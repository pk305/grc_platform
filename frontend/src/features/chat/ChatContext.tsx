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
  useChatHeartbeatMutation,
  useMarkChatReadMutation,
  useOpenChatConversationMutation,
  type ChatContactsQuery
} from './__generated__/queries.generated';

export type ChatContact = ChatContactsQuery['chatContacts'][number];

/** One conversation window docked along the bottom bar. */
export interface ChatWindowState {
  /** The colleague's user id — what the rail and the dock agree on. */
  contactId: string;
  /** Null until the thread exists; the first message brings it into being. */
  conversationId: string | null;
  minimized: boolean;
}

/**
 * How often the rail asks for fresh contacts. Also how long a message can sit
 * unseen, so it is short enough to feel live without a socket, and long enough
 * that a tab left open all day isn't a load problem.
 */
const POLL_INTERVAL_MS = 10000;

/** Comfortably inside the two-minute window the server calls "online". */
const HEARTBEAT_INTERVAL_MS = 45000;

/**
 * How many windows the dock will hold. Facebook's bar drops the oldest window
 * once the row would overflow; matching that keeps the composer reachable on a
 * laptop screen instead of pushing windows off the edge.
 */
export const MAX_OPEN_WINDOWS = 3;

/**
 * Keyed by user: the dock is restored from the browser, and one person's open
 * conversations must not reappear for whoever signs in on the same machine
 * next.
 */
const windowsStorageKey = (userId: string) => `phoenix.chat.windows.${userId}`;

interface ChatContextValue {
  contacts: ChatContact[];
  loading: boolean;
  windows: ChatWindowState[];
  unreadTotal: number;
  /** Contacts rail visibility — remembered per browser, like the nav. */
  railOpen: boolean;
  toggleRail: () => void;
  openChat: (contactId: string) => void;
  closeChat: (contactId: string) => void;
  toggleMinimized: (contactId: string) => void;
  markRead: (contactId: string, conversationId: string) => void;
  contactById: (contactId: string) => ChatContact | undefined;
  /** Records a thread created by a window's first message. */
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
        // Windows come back minimized: reloading into three open chat panes
        // over the page you actually navigated to would be a nuisance.
        minimized: true
      }));
  } catch {
    return [];
  }
}

function readStoredRail(): boolean {
  try {
    return localStorage.getItem(RAIL_STORAGE_KEY) !== 'false';
  } catch {
    return true;
  }
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  // `AuthGuard` holds this subtree back until the session has resolved, so the
  // provider only ever mounts in the browser with a user in hand — the stored
  // dock can be read straight into initial state, with no hydration to skew
  // and no restoring pass afterwards.
  const storageKey = windowsStorageKey(user?.id ?? 'anonymous');
  const [windows, setWindows] = useState<ChatWindowState[]>(() =>
    readStoredWindows(storageKey)
  );
  const [railOpen, setRailOpen] = useState(readStoredRail);

  const { data, loading } = useChatContactsQuery({
    // Polling stands in for a socket: the backend is request/response, so the
    // rail asks again rather than being told.
    pollInterval: POLL_INTERVAL_MS,
    fetchPolicy: 'cache-and-network',
    skip: !isAuthenticated
  });

  const [heartbeat] = useChatHeartbeatMutation();
  const [openConversation] = useOpenChatConversationMutation();
  const [markReadMutation] = useMarkChatReadMutation();

  const contacts = useMemo(() => data?.chatContacts ?? [], [data]);

  // The rail is fixed-position, so the page has to be told to leave it a
  // gutter; a class on <html> is how the vertical navbar does the same thing.
  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle('chat-rail-open', railOpen);
    // Signing out unmounts the provider; without this the gutter would still
    // be reserved on the auth pages, which have no rail to put in it.
    return () => html.classList.remove('chat-rail-open');
  }, [railOpen]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(windows));
    } catch {
      // A browser refusing storage costs the dock its memory, nothing more.
    }
  }, [storageKey, windows]);

  useEffect(() => {
    if (!isAuthenticated) return;
    heartbeat().catch(() => {});
    const timer = setInterval(() => {
      // A backgrounded tab isn't someone you can reach, so let the dot lapse.
      if (document.visibilityState === 'visible') heartbeat().catch(() => {});
    }, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [heartbeat, isAuthenticated]);

  const toggleRail = useCallback(() => {
    setRailOpen(open => {
      const next = !open;
      try {
        localStorage.setItem(RAIL_STORAGE_KEY, String(next));
      } catch {
        // Preference is cosmetic; losing it is survivable.
      }
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
        // The badge is summed from the rail's contacts, so zeroing this row is
        // what actually clears it — without waiting for the next poll. Edited
        // by cache id rather than by rewriting the query, so it holds however
        // the rail happened to be filtered when the message arrived.
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
          // Clicking a name again brings that window back rather than opening
          // a second one.
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
        // Newest on the right, oldest dropped once the bar is full.
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
