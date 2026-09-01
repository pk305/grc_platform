'use client';

import { useMemo, useState } from 'react';
import { useChat } from '@/features/chat/ChatContext';
import ChatAvatar from './ChatAvatar';

export default function ChatSidebar() {
  const { contacts, loading, openChat, railOpen, toggleRail } = useChat();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return contacts;
    return contacts.filter(contact =>
      `${contact.participant.name} ${contact.participant.email} ${contact.participant.department}`
        .toLowerCase()
        .includes(term)
    );
  }, [contacts, search]);

  const onlineCount = contacts.filter(
    contact => contact.participant.online
  ).length;

  if (!railOpen) return null;

  return (
    <aside className="chat-rail" aria-label="Contacts">
      <div className="chat-rail-header">
        <span className="chat-rail-title">Contacts</span>
        <span className="chat-rail-count">
          {onlineCount > 0 ? `${onlineCount} active` : 'No one active'}
        </span>
        <button
          type="button"
          className="chat-icon-btn"
          onClick={toggleRail}
          aria-label="Hide contacts"
        >
          <span className="fas fa-times" aria-hidden="true" />
        </button>
      </div>

      <div className="chat-rail-search">
        <span className="fas fa-search" aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder="Search contacts"
          aria-label="Search contacts"
        />
      </div>

      <ul className="chat-rail-list scrollbar">
        {filtered.length === 0 ? (
          <li className="chat-rail-empty">
            {loading ? 'Loading contacts…' : 'No one matches that.'}
          </li>
        ) : (
          filtered.map(contact => (
            <li key={contact.id}>
              <button
                type="button"
                className="chat-rail-row"
                onClick={() => openChat(contact.id)}
              >
                <ChatAvatar
                  name={''}
                  src={contact.participant.avatarUrl}
                  online={contact.participant.online}
                />
                <span className="chat-rail-body">
                  <span className="chat-rail-name">
                    {contact.participant.name}
                  </span>
                  <span className="chat-rail-sub">
                    {contact.lastMessagePreview ||
                      contact.participant.department ||
                      contact.participant.email}
                  </span>
                </span>
                {contact.unreadCount > 0 && (
                  <span
                    className="chat-rail-badge"
                    aria-label={`${contact.unreadCount} unread`}
                  >
                    {contact.unreadCount > 9 ? '9+' : contact.unreadCount}
                  </span>
                )}
              </button>
            </li>
          ))
        )}
      </ul>
    </aside>
  );
}
