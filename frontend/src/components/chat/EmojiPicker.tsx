'use client';

import { Popover } from '@radix-ui/themes';

/**
 * A small curated set rather than a full Unicode picker — this is a chat
 * composer, not an emoji reference. No third-party picker library is pulled
 * in for it.
 */
const EMOJI = [
  '😀',
  '😂',
  '😍',
  '😊',
  '😉',
  '😢',
  '😮',
  '😡',
  '👍',
  '👎',
  '👏',
  '🙏',
  '💪',
  '🤝',
  '✌️',
  '🤞',
  '❤️',
  '🔥',
  '🎉',
  '✅',
  '⚠️',
  '❓',
  '💯',
  '👀'
];

export default function EmojiPicker({
  onSelect
}: {
  onSelect: (emoji: string) => void;
}) {
  return (
    <Popover.Root>
      <Popover.Trigger>
        <button
          type="button"
          className="chat-icon-btn chat-emoji-btn"
          aria-label="Add an emoji"
        >
          <span className="far fa-smile" aria-hidden="true" />
        </button>
      </Popover.Trigger>
      <Popover.Content size="1" className="chat-emoji-popover">
        <div className="chat-emoji-grid">
          {EMOJI.map(emoji => (
            <Popover.Close key={emoji}>
              <button
                type="button"
                className="chat-emoji-option"
                onClick={() => onSelect(emoji)}
                aria-label={`Insert ${emoji}`}
              >
                {emoji}
              </button>
            </Popover.Close>
          ))}
        </div>
      </Popover.Content>
    </Popover.Root>
  );
}
