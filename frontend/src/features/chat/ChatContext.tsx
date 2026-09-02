'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import {
  useChatContactsQuery,
  useChatContactUpdatedSubscription,
  useChatPresenceChangedSubscription,
  useMarkChatReadMutation,
  useOpenChatConversationMutation,
  type ChatContactsQuery
} from './__generated__/queries.generated';

export type ChatContact = ChatContactsQuery['chatContacts'][number];

export interface ChatWindowState {
  contactId: string;
  conversationId: string | null;
  minimized: boolean;
}

export const MAX_OPEN_WINDOWS = 3;

const windowsStorageKey = (userId: string) => `phoenix.chat.windows.${userId}`;

interface ChatContextValue {
  contacts: ChatContact[];
  loading: boolean;
  windows: ChatWindowState[];
  unreadTotal: number;
  railOpen: boolean;
  toggleRail: () => void;
  openChat: (contactId: string) => void;
  closeChat: (contactId: string) => void;
  toggleMinimized: (contactId: string) => void;
  markRead: (contactId: string, conversationId: string) => void;
  contactById: (contactId: string) => ChatContact | undefined;
  attachConversation: (contactId: string, conversationId: string) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

const RAIL_STORAGE_KEY = 'phoenix.chat.railOpen';

function readStoredWindows(key: string): ChatWindowState[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(entry => entry && typeof entry.contactId === 'string')
      .slice(0, MAX_OPEN_WINDOWS)
      .map(entry => ({
        contactId: entry.contactId,
        conversationId:
          typeof entry.conversationId === 'string'
            ? entry.conversationId
            : null,
        minimized: true
      }));
  } catch {
    return [];
  }
}

function readStoredRail(): boolean {
  try {
    return localStorage.getItem(RAIL_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const storageKey = windowsStorageKey(user?.id ?? 'anonymous');
  const [windows, setWindows] = useState<ChatWindowState[]>(() =>
    readStoredWindows(storageKey)
  );
  const [railOpen, setRailOpen] = useState(readStoredRail);

  const { data, loading } = useChatContactsQuery({
    fetchPolicy: 'cache-and-network',
    skip: !isAuthenticated
  });

  useChatContactUpdatedSubscription({
    skip: !isAuthenticated,
    onData: ({ data: event }) => {
      const contact = event.data?.chatContactUpdated;
      if (
        !contact ||
        typeof Notification === 'undefined' ||
        Notification.permission !== 'granted' ||
        !document.hidden
      ) {
        return;
      }
      const notification = new Notification(contact.participant.name, {
        body: contact.lastMessagePreview || 'sent a message',
        tag: `chat-${contact.id}`
      });
      notification.onclick = () => {
        window.focus();
        openChat(contact.id);
        notification.close();
      };
    }
  });

  useChatPresenceChangedSubscription({
    skip: !isAuthenticated,
    onData: ({ client, data: event }) => {
      const presence = event.data?.chatPresenceChanged;
      if (!presence) return;
      client.cache.modify({
        id: client.cache.identify({
          __typename: 'ChatParticipantType',
          id: presence.userId
        }),
        fields: { online: () => presence.online }
      });
    }
  });

  const [openConversation] = useOpenChatConversationMutation();
  const [markReadMutation] = useMarkChatReadMutation();

  const contacts = useMemo(() => {
    const rows = data?.chatContacts ?? [];
    return [...rows].sort((a, b) => {
      if (a.unreadCount > 0 !== b.unreadCount > 0) {
        return a.unreadCount > 0 ? -1 : 1;
      }
      const atA = a.lastMessageAt
        ? new Date(String(a.lastMessageAt)).getTime()
        : 0;
      const atB = b.lastMessageAt
        ? new Date(String(b.lastMessageAt)).getTime()
        : 0;
      return atB - atA;
    });
  }, [data]);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle('chat-rail-open', railOpen);
    return () => html.classList.remove('chat-rail-open');
  }, [railOpen]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(windows));
    } catch {}
  }, [storageKey, windows]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, [isAuthenticated]);

  const toggleRail = useCallback(() => {
    setRailOpen(open => {
      const next = !open;
      try {
        localStorage.setItem(RAIL_STORAGE_KEY, String(next));
      } catch {}
      return next;
    });
  }, []);

  const attachConversation = useCallback(
    (contactId: string, conversationId: string) => {
      setWindows(current =>
        current.map(entry =>
          entry.contactId === contactId ? { ...entry, conversationId } : entry
        )
      );
    },
    []
  );

  const markRead = useCallback(
    (contactId: string, conversationId: string) => {
      markReadMutation({
        variables: { conversationId },
        update: cache => {
          cache.modify({
            id: cache.identify({
              __typename: 'ChatContactType',
              id: contactId
            }),
            fields: { unreadCount: () => 0 }
          });
        }
      }).catch(() => {});
    },
    [markReadMutation]
  );

  const openChat = useCallback(
    (contactId: string) => {
      setWindows(current => {
        const existing = current.find(entry => entry.contactId === contactId);
        if (existing) {
          return current.map(entry =>
            entry.contactId === contactId
              ? { ...entry, minimized: false }
              : entry
          );
        }
        const opened: ChatWindowState = {
          contactId,
          conversationId:
            contacts.find(contact => contact.id === contactId)
              ?.conversationId ?? null,
          minimized: false
        };
        return [...current, opened].slice(-MAX_OPEN_WINDOWS);
      });

      openConversation({ variables: { recipientId: contactId } })
        .then(result => {
          const conversationId =
            result.data?.openChatConversation.conversationId;
          if (!conversationId) return;
          attachConversation(contactId, conversationId);
          markRead(contactId, conversationId);
        })
        .catch(() => {});
    },
    [attachConversation, contacts, markRead, openConversation]
  );

  const closeChat = useCallback((contactId: string) => {
    setWindows(current =>
      current.filter(entry => entry.contactId !== contactId)
    );
  }, []);

  const toggleMinimized = useCallback((contactId: string) => {
    setWindows(current =>
      current.map(entry =>
        entry.contactId === contactId
          ? { ...entry, minimized: !entry.minimized }
          : entry
      )
    );
  }, []);

  const contactById = useCallback(
    (contactId: string) => contacts.find(contact => contact.id === contactId),
    [contacts]
  );

  const unreadTotal = useMemo(
    () => contacts.reduce((total, contact) => total + contact.unreadCount, 0),
    [contacts]
  );

  const value = useMemo(
    () => ({
      contacts,
      loading,
      windows,
      unreadTotal,
      railOpen,
      toggleRail,
      openChat,
      closeChat,
      toggleMinimized,
      markRead,
      contactById,
      attachConversation
    }),
    [
      attachConversation,
      closeChat,
      contactById,
      contacts,
      loading,
      markRead,
      openChat,
      railOpen,
      toggleMinimized,
      toggleRail,
      unreadTotal,
      windows
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
