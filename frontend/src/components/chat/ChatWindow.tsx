'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  useChatMessagesQuery,
  useSendChatMessageMutation
} from '@/features/chat/__generated__/queries.generated';
import {
  useChat,
  type ChatContact,
  type ChatWindowState
} from '@/features/chat/ChatContext';
import ChatAvatar from './ChatAvatar';

/** Matches the rail's cadence, so both halves of the UI age at the same rate. */
const POLL_INTERVAL_MS = 10000;

/** Consecutive messages from one person within this gap render as one group. */
const GROUPING_WINDOW_MS = 5 * 60 * 1000;

function formatTime(value: unknown): string {
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

interface Bubble {
  id: string;
  body: string;
  createdAt: unknown;
  mine: boolean;
  senderName: string;
  senderAvatar?: string | null;
  /** First of its group — the one that carries the timestamp. */
  startsGroup: boolean;
  /** Last of its group — the one that carries the avatar. */
  endsGroup: boolean;
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
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const conversationId = state.conversationId ?? contact.conversationId ?? null;

  const { data, loading } = useChatMessagesQuery({
    variables: { conversationId: conversationId ?? '' },
    // Nothing to fetch until the thread exists; the first message creates it.
    skip: !conversationId || state.minimized,
    pollInterval: state.minimized ? 0 : POLL_INTERVAL_MS,
    fetchPolicy: 'cache-and-network'
  });

  const [sendMessage, { loading: sending }] = useSendChatMessageMutation();

  const messages = useMemo(() => data?.chatMessages ?? [], [data]);

  const bubbles = useMemo<Bubble[]>(
    () =>
      messages.map((message, index) => {
        const previous = messages[index - 1];
        const next = messages[index + 1];
        const at = new Date(String(message.createdAt)).getTime();
        const near = (other: typeof message | undefined) =>
          !!other &&
          other.sender.id === message.sender.id &&
          Math.abs(new Date(String(other.createdAt)).getTime() - at) <
            GROUPING_WINDOW_MS;

        return {
          id: message.id,
          body: message.body,
          createdAt: message.createdAt,
          mine: message.mine,
          senderName: message.sender.name,
          senderAvatar: message.sender.avatarUrl,
          startsGroup: !near(previous),
          endsGroup: !near(next)
        };
      }),
    [messages]
  );

  // Follow the conversation down as it grows, and on first open.
  useEffect(() => {
    const element = scrollRef.current;
    if (!element || state.minimized) return;
    element.scrollTop = element.scrollHeight;
  }, [bubbles.length, state.minimized]);

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

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;

    setDraft('');
    setError(null);
    try {
      const result = await sendMessage({
        variables: conversationId
          ? { body, conversationId }
          : { body, recipientId: contact.id },
        // The thread's message list is the only thing a send changes; refetch
        // it rather than splicing, so ordering and grouping stay the server's
        // call.
        refetchQueries: ['ChatMessages', 'ChatContacts'],
        awaitRefetchQueries: false
      });
      const created = result.data?.sendChatMessage;
      if (created && !conversationId) {
        attachConversation(contact.id, created.conversationId);
      }
    } catch {
      // Hand the text back rather than losing it to a failed request.
      setDraft(body);
      setError('Message not sent. Try again.');
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
                  <span
                    className="chat-bubble"
                    title={formatTime(bubble.createdAt)}
                  >
                    {bubble.body}
                  </span>
                </div>
              ))
            )}
          </div>

          {error && <p className="chat-window-error">{error}</p>}

          <form className="chat-window-composer" onSubmit={handleSubmit}>
            <input
              type="text"
              value={draft}
              onChange={event => setDraft(event.target.value)}
              placeholder="Aa"
              aria-label={`Message ${contact.participant.name}`}
              maxLength={4000}
            />
            <button
              type="submit"
              className="chat-send"
              disabled={!draft.trim() || sending}
              aria-label="Send message"
            >
              <span className="fas fa-paper-plane" aria-hidden="true" />
            </button>
          </form>
        </>
      )}
    </section>
  );
}
