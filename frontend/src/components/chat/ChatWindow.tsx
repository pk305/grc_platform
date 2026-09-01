'use client';

import type { ApolloCache } from '@apollo/client';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChatMessagesDocument,
  useChatMessageReceivedSubscription,
  useChatMessagesQuery,
  useChatTypingChangedSubscription,
  useSendChatMessageMutation,
  useSetChatTypingMutation,
  useStartChatCallMutation,
  type ChatMessageFieldsFragment
} from '@/features/chat/__generated__/queries.generated';
import {
  useChat,
  type ChatContact,
  type ChatWindowState
} from '@/features/chat/ChatContext';
import {
  ACCEPTED_IMAGE_TYPES,
  ImageReadError,
  toContainedDataUrl
} from '@/lib/image';
import ChatAvatar from './ChatAvatar';
import EmojiPicker from './EmojiPicker';

/** Consecutive messages from one person within this gap render as one group. */
const GROUPING_WINDOW_MS = 5 * 60 * 1000;

/**
 * Consecutive text-only messages from one person within this gap are shown
 * fused into a single bubble, rather than as their own separate shapes.
 * Purely a display choice — each stays its own immutable `Message` row (see
 * `domains/chat/models.py`); nothing about the underlying data changes. Short
 * on purpose: it exists to smooth over someone hitting Enter mid-word (their
 * "hello" landing as two rows, "he" then "llo"), not to fuse unrelated quick
 * replies into one run-on bubble.
 */
const MERGE_WINDOW_MS = 1500;

/** Mirrors `MAX_ATTACHMENTS_PER_MESSAGE` in domains/chat/service.py. */
const MAX_PHOTOS_PER_MESSAGE = 10;

/** Mirrors `MAX_PHOTO_EDGE_PX` in domains/chat/images.py. */
const MAX_PHOTO_EDGE_PX = 1600;

/** How many photos a bubble's grid shows before collapsing into "+N". */
const GRID_PREVIEW_LIMIT = 4;

/** Stop broadcasting "typing" after this long without a keystroke. */
const TYPING_IDLE_MS = 3000;

/**
 * How long the *receiving* side keeps showing the dots after the last
 * "typing" signal before giving up on it — a safety net for a "stopped"
 * event that never arrives (tab closed mid-keystroke, network drop), same
 * grace-period spirit as presence's disconnect handling.
 */
const TYPING_RECEIVE_TIMEOUT_MS = 5000;

/**
 * Inserts `message` into the cached `ChatMessages` list for `conversationId`,
 * de-duplicated by id. Called from both the subscription (every message,
 * either side) and the send mutation's own response (only the sender's
 * thread-starting first message can reach a subscription that didn't exist
 * yet to hear it) — idempotent either way, so whichever arrives first wins.
 */
function appendMessage(
  cache: ApolloCache<unknown>,
  conversationId: string,
  message: ChatMessageFieldsFragment
) {
  cache.updateQuery(
    { query: ChatMessagesDocument, variables: { conversationId } },
    current => {
      const existing = current?.chatMessages ?? [];
      if (existing.some(entry => entry.id === message.id)) return current;
      return { chatMessages: [...existing, message] };
    }
  );
}

function formatTime(value: unknown): string {
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

interface BubbleAttachment {
  id: string;
  url: string;
}

interface Bubble {
  id: string;
  body: string;
  createdAt: unknown;
  mine: boolean;
  senderId: string;
  senderName: string;
  senderAvatar?: string | null;
  attachments: BubbleAttachment[];
  /** Timestamp of the run's last constituent message — what merge-window gaps are measured from. */
  lastAt: number;
  /** First of its group — the one that carries the timestamp. */
  startsGroup: boolean;
  /** Last of its group — the one that carries the avatar. */
  endsGroup: boolean;
}

function PhotoGrid({
  attachments,
  senderName
}: {
  attachments: BubbleAttachment[];
  senderName: string;
}) {
  const shown = attachments.slice(0, GRID_PREVIEW_LIMIT);
  const hiddenCount = attachments.length - shown.length;
  const tileSize = shown.length === 1 ? 220 : 110;

  return (
    <div
      className={`chat-photo-grid ${shown.length === 1 ? 'is-single' : ''}`.trim()}
    >
      {shown.map((attachment, index) => {
        const isLastTile = index === shown.length - 1;
        return (
          <a
            key={attachment.id}
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="chat-photo-tile"
          >
            <Image
              src={attachment.url}
              alt={`Photo from ${senderName}`}
              width={tileSize}
              height={tileSize}
              unoptimized
              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            />
            {isLastTile && hiddenCount > 0 && (
              <span className="chat-photo-more">+{hiddenCount}</span>
            )}
          </a>
        );
      })}
    </div>
  );
}

/**
 * One docked conversation.
 *
 * Messages are grouped the way a messenger does it: a run from the same person
 * becomes one visual block with a single timestamp and a single avatar, so a
 * burst of short replies doesn't turn into a column of repeated faces.
 */
export default function ChatWindow({
  window: state,
  contact
}: {
  window: ChatWindowState;
  contact: ChatContact;
}) {
  const { closeChat, toggleMinimized, attachConversation, markRead } =
    useChat();
  const [draft, setDraft] = useState('');
  const [pendingPhotos, setPendingPhotos] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [otherIsTyping, setOtherIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const draftInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isTypingRef = useRef(false);
  const typingIdleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const typingReceiveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const conversationId = state.conversationId ?? contact.conversationId ?? null;

  const { data, loading } = useChatMessagesQuery({
    variables: { conversationId: conversationId ?? '' },
    // Nothing to fetch until the thread exists; the first message creates it.
    // One fetch for what's already there — the subscription below carries
    // everything that arrives after.
    skip: !conversationId || state.minimized,
    fetchPolicy: 'cache-and-network'
  });

  // Both sides of the conversation see a sent message through this same
  // path — including the sender's own, since their window is subscribed
  // too — rather than also handling the mutation's own response, which
  // would mean keeping two paths to the same bubble in sync.
  useChatMessageReceivedSubscription({
    variables: { conversationId: conversationId ?? '' },
    skip: !conversationId || state.minimized,
    onData: ({ client, data: event }) => {
      const message = event.data?.chatMessageReceived;
      if (!message || !conversationId) return;
      appendMessage(client.cache, conversationId, message);
    }
  });

  // "Is the other person typing" — purely ephemeral, nothing here is stored
  // anywhere. The receive-side timeout below is what protects against a
  // "stopped" signal that never arrives.
  useChatTypingChangedSubscription({
    variables: { conversationId: conversationId ?? '' },
    skip: !conversationId || state.minimized,
    onData: ({ data: event }) => {
      const typingEvent = event.data?.chatTypingChanged;
      if (!typingEvent) return;
      if (typingReceiveTimeoutRef.current) {
        clearTimeout(typingReceiveTimeoutRef.current);
        typingReceiveTimeoutRef.current = null;
      }
      if (typingEvent.typing) {
        setOtherIsTyping(true);
        typingReceiveTimeoutRef.current = setTimeout(() => {
          setOtherIsTyping(false);
        }, TYPING_RECEIVE_TIMEOUT_MS);
      } else {
        setOtherIsTyping(false);
      }
    }
  });

  const [setTypingMutation] = useSetChatTypingMutation();

  const [sendMessage, { loading: sending }] = useSendChatMessageMutation();
  const [startCall, { loading: calling }] = useStartChatCallMutation();

  const messages = useMemo(() => data?.chatMessages ?? [], [data]);

  const bubbles = useMemo<Bubble[]>(() => {
    // Pass 1 — fuse consecutive text-only messages from the same sender sent
    // within MERGE_WINDOW_MS into one displayed bubble. Photos always start
    // their own bubble: merging a caption into a preceding photo grid (or
    // vice versa) has no sensible single rendering.
    const runs: Bubble[] = [];
    for (const message of messages) {
      const at = new Date(String(message.createdAt)).getTime();
      const run = runs[runs.length - 1];
      const canFuse =
        run &&
        run.senderId === message.sender.id &&
        run.attachments.length === 0 &&
        message.attachments.length === 0 &&
        run.body !== '' &&
        message.body !== '' &&
        at - run.lastAt < MERGE_WINDOW_MS;

      if (canFuse) {
        run.body += message.body;
        run.createdAt = message.createdAt;
        run.lastAt = at;
        continue;
      }

      runs.push({
        id: message.id,
        body: message.body,
        createdAt: message.createdAt,
        mine: message.mine,
        senderId: message.sender.id,
        senderName: message.sender.name,
        senderAvatar: message.sender.avatarUrl,
        attachments: message.attachments,
        lastAt: at,
        startsGroup: true,
        endsGroup: true
      });
    }

    // Pass 2 — the coarser 5-minute avatar/timestamp grouping, now over the
    // fused runs rather than raw messages.
    runs.forEach((run, index) => {
      const previous = runs[index - 1];
      const next = runs[index + 1];
      const near = (other: Bubble | undefined) =>
        !!other &&
        other.senderId === run.senderId &&
        Math.abs(other.lastAt - run.lastAt) < GROUPING_WINDOW_MS;
      run.startsGroup = !near(previous);
      run.endsGroup = !near(next);
    });

    return runs;
  }, [messages]);

  // Follow the conversation down as it grows, and on first open — the
  // typing dots count as content worth scrolling to as well.
  useEffect(() => {
    const element = scrollRef.current;
    if (!element || state.minimized) return;
    element.scrollTop = element.scrollHeight;
  }, [bubbles.length, otherIsTyping, state.minimized]);

  // Reading is what an open window means: anything that lands while it is on
  // screen is already seen.
  useEffect(() => {
    if (state.minimized || !conversationId || contact.unreadCount === 0) return;
    markRead(contact.id, conversationId);
  }, [
    contact.id,
    contact.unreadCount,
    conversationId,
    markRead,
    state.minimized
  ]);

  // Broadcasts only on an actual true/false transition — every keystroke
  // still resets the idle timer below, but doesn't re-send while already
  // marked typing.
  function notifyTyping(typing: boolean) {
    if (!conversationId || isTypingRef.current === typing) return;
    isTypingRef.current = typing;
    setTypingMutation({ variables: { conversationId, typing } }).catch(
      () => {}
    );
  }

  // Best-effort "stopped typing" if the window closes, minimizes, or the
  // conversation changes out from under it mid-type — the receiving side's
  // own timeout is the real safety net, this just makes the common case
  // (closing the window) tidy instead of leaving dots up for 5s.
  useEffect(() => {
    return () => {
      if (typingIdleTimeoutRef.current)
        clearTimeout(typingIdleTimeoutRef.current);
      notifyTyping(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Separate from the above: this fires only once, on the window's actual
  // unmount, to stop the receive-side auto-clear timer touching state that
  // no longer exists.
  useEffect(() => {
    return () => {
      if (typingReceiveTimeoutRef.current) {
        clearTimeout(typingReceiveTimeoutRef.current);
      }
    };
  }, []);

  function handleDraftChange(value: string) {
    setDraft(value);
    if (typingIdleTimeoutRef.current)
      clearTimeout(typingIdleTimeoutRef.current);
    if (value.trim()) {
      notifyTyping(true);
      typingIdleTimeoutRef.current = setTimeout(() => {
        notifyTyping(false);
      }, TYPING_IDLE_MS);
    } else {
      notifyTyping(false);
    }
  }

  async function sendBody(bodyInput: string, photos: string[]) {
    const text = bodyInput.trim();
    if (!text && photos.length === 0) return;
    if (sending) return;

    if (typingIdleTimeoutRef.current)
      clearTimeout(typingIdleTimeoutRef.current);
    notifyTyping(false);
    setDraft('');
    setPendingPhotos([]);
    setError(null);
    try {
      const result = await sendMessage({
        variables: {
          body: text || undefined,
          photos: photos.length ? photos : undefined,
          ...(conversationId ? { conversationId } : { recipientId: contact.id })
        },
        update: (cache, { data: mutationData }) => {
          const created = mutationData?.sendChatMessage;
          if (created) appendMessage(cache, created.conversationId, created);
        }
      });
      const created = result.data?.sendChatMessage;
      if (created && !conversationId) {
        attachConversation(contact.id, created.conversationId);
      }
    } catch {
      setDraft(text);
      setPendingPhotos(photos);
      setError('Message not sent. Try again.');
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    void sendBody(draft, pendingPhotos);
  }

  function handleLikeSend() {
    void sendBody('👍', []);
  }

  async function handlePhotoSelect(files: FileList | null) {
    if (!files || files.length === 0) return;
    const room = MAX_PHOTOS_PER_MESSAGE - pendingPhotos.length;
    const selected = Array.from(files).slice(0, Math.max(0, room));
    setError(null);
    try {
      const converted = await Promise.all(
        selected.map(
          async file =>
            (await toContainedDataUrl(file, MAX_PHOTO_EDGE_PX)).dataUrl
        )
      );
      setPendingPhotos(current => [...current, ...converted]);
    } catch (cause) {
      setError(
        cause instanceof ImageReadError
          ? cause.message
          : 'That photo could not be added.'
      );
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removePendingPhoto(index: number) {
    setPendingPhotos(current => current.filter((_, i) => i !== index));
  }

  function insertEmoji(emoji: string) {
    const input = draftInputRef.current;
    if (!input) {
      setDraft(current => current + emoji);
      return;
    }
    const start = input.selectionStart ?? draft.length;
    const end = input.selectionEnd ?? draft.length;
    const next = draft.slice(0, start) + emoji + draft.slice(end);
    setDraft(next);
    requestAnimationFrame(() => {
      input.focus();
      const cursor = start + emoji.length;
      input.setSelectionRange(cursor, cursor);
    });
  }

  async function handleCall(video: boolean) {
    setError(null);
    try {
      const result = await startCall({
        variables: { recipientId: contact.id, video }
      });
      const joinUrl = result.data?.startChatCall.joinUrl;
      if (joinUrl) window.open(joinUrl, '_blank', 'noopener');
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'That call could not be started.'
      );
    }
  }

  return (
    <section
      className={`chat-window ${state.minimized ? 'is-minimized' : ''}`.trim()}
      aria-label={`Chat with ${contact.participant.name}`}
    >
      <header className="chat-window-header">
        <button
          type="button"
          className="chat-window-title"
          onClick={() => toggleMinimized(contact.id)}
          aria-expanded={!state.minimized}
        >
          <ChatAvatar
            name={contact.participant.name}
            src={contact.participant.avatarUrl}
            online={contact.participant.online}
            size="s"
          />
          <span className="chat-window-name">
            {contact.participant.name}
            {contact.unreadCount > 0 && state.minimized && (
              <span className="chat-window-badge">{contact.unreadCount}</span>
            )}
          </span>
        </button>
        <span className="chat-window-actions">
          <button
            type="button"
            className="chat-icon-btn chat-call-btn"
            onClick={() => handleCall(false)}
            disabled={calling}
            aria-label={`Call ${contact.participant.name}`}
          >
            <span className="fas fa-phone" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="chat-icon-btn chat-call-btn"
            onClick={() => handleCall(true)}
            disabled={calling}
            aria-label={`Video call ${contact.participant.name}`}
          >
            <span className="fas fa-video" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="chat-icon-btn"
            onClick={() => toggleMinimized(contact.id)}
            aria-label={
              state.minimized ? 'Expand conversation' : 'Minimize conversation'
            }
          >
            <span
              className={`fas fa-${state.minimized ? 'chevron-up' : 'minus'}`}
              aria-hidden="true"
            />
          </button>
          <button
            type="button"
            className="chat-icon-btn"
            onClick={() => closeChat(contact.id)}
            aria-label="Close conversation"
          >
            <span className="fas fa-times" aria-hidden="true" />
          </button>
        </span>
      </header>

      {!state.minimized && (
        <>
          <div className="chat-window-body scrollbar" ref={scrollRef}>
            {bubbles.length === 0 ? (
              <p className="chat-window-empty">
                {loading && conversationId
                  ? 'Loading…'
                  : `Say hello to ${contact.participant.name.split(' ')[0]}.`}
              </p>
            ) : (
              bubbles.map(bubble => (
                <div
                  key={bubble.id}
                  className={`chat-line ${bubble.mine ? 'is-mine' : 'is-theirs'} ${
                    bubble.endsGroup ? 'ends-group' : ''
                  }`.trim()}
                >
                  {!bubble.mine && (
                    <span className="chat-line-avatar">
                      {bubble.endsGroup && (
                        <ChatAvatar
                          name={bubble.senderName}
                          src={bubble.senderAvatar}
                          online={contact.participant.online}
                          size="s"
                        />
                      )}
                    </span>
                  )}
                  <span className="chat-line-content">
                    {bubble.attachments.length > 0 && (
                      <PhotoGrid
                        attachments={bubble.attachments}
                        senderName={bubble.senderName}
                      />
                    )}
                    {bubble.body ? (
                      <span
                        className="chat-bubble"
                        title={formatTime(bubble.createdAt)}
                      >
                        {bubble.body}
                      </span>
                    ) : (
                      bubble.attachments.length > 0 && (
                        <span
                          className="chat-photo-caption"
                          title={formatTime(bubble.createdAt)}
                        >
                          {bubble.mine ? 'You' : bubble.senderName} sent{' '}
                          {bubble.attachments.length} photo
                          {bubble.attachments.length === 1 ? '' : 's'}
                        </span>
                      )
                    )}
                  </span>
                </div>
              ))
            )}
            {otherIsTyping && (
              <div className="chat-line is-theirs">
                <span className="chat-line-avatar">
                  <ChatAvatar
                    name={contact.participant.name}
                    src={contact.participant.avatarUrl}
                    online={contact.participant.online}
                    size="s"
                  />
                </span>
                <span className="chat-line-content">
                  <span
                    className="chat-bubble chat-typing-dots"
                    aria-label={`${contact.participant.name} is typing`}
                  >
                    <span />
                    <span />
                    <span />
                  </span>
                </span>
              </div>
            )}
          </div>

          {error && <p className="chat-window-error">{error}</p>}

          <form className="chat-window-composer" onSubmit={handleSubmit}>
            {pendingPhotos.length > 0 && (
              <div className="chat-composer-attachments">
                {pendingPhotos.map((dataUrl, index) => (
                  <div className="chat-composer-attachment" key={index}>
                    <Image
                      src={dataUrl}
                      alt=""
                      width={56}
                      height={56}
                      unoptimized
                      style={{
                        objectFit: 'cover',
                        width: '100%',
                        height: '100%'
                      }}
                    />
                    <button
                      type="button"
                      className="chat-composer-attachment-remove"
                      onClick={() => removePendingPhoto(index)}
                      aria-label="Remove photo"
                    >
                      <span className="fas fa-times" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="chat-composer-row">
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(',')}
                multiple
                hidden
                onChange={event => handlePhotoSelect(event.target.files)}
              />
              <button
                type="button"
                className="chat-icon-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={pendingPhotos.length >= MAX_PHOTOS_PER_MESSAGE}
                aria-label="Attach photos"
              >
                <span className="far fa-image" aria-hidden="true" />
              </button>
              <EmojiPicker onSelect={insertEmoji} />
              <input
                ref={draftInputRef}
                type="text"
                value={draft}
                onChange={event => handleDraftChange(event.target.value)}
                placeholder="Aa"
                aria-label={`Message ${contact.participant.name}`}
                maxLength={4000}
              />
              {draft.trim() || pendingPhotos.length > 0 ? (
                <button
                  type="submit"
                  className="chat-send"
                  disabled={sending}
                  aria-label="Send message"
                >
                  <span className="fas fa-paper-plane" aria-hidden="true" />
                </button>
              ) : (
                <button
                  type="button"
                  className="chat-send chat-send-like"
                  onClick={handleLikeSend}
                  disabled={sending}
                  aria-label="Send a thumbs up"
                >
                  👍
                </button>
              )}
            </div>
          </form>
        </>
      )}
    </section>
  );
}
