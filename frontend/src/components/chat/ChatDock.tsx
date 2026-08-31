'use client';

import { useChat } from '@/features/chat/ChatContext';
import ChatWindow from './ChatWindow';

/**
 * The fixed bar along the bottom holding every open conversation.
 *
 * Windows sit right-to-left with the newest nearest the rail, and the bar is
 * only as wide as the windows in it — an empty dock renders nothing, so it
 * never covers page content that isn't being chatted over.
 */
export default function ChatDock() {
  const { windows, contactById, railOpen } = useChat();

  // A window whose contact has since been deactivated has nothing to render,
  // so it is dropped here rather than rendered empty.
  const open = windows.flatMap(state => {
    const contact = contactById(state.contactId);
    return contact ? [{ state, contact }] : [];
  });

  if (open.length === 0) return null;

  return (
    <div
      className={`chat-dock ${railOpen ? 'has-rail' : ''}`.trim()}
      role="region"
      aria-label="Open conversations"
    >
      {open.map(({ state, contact }) => (
        <ChatWindow key={state.contactId} window={state} contact={contact} />
      ))}
    </div>
  );
}
