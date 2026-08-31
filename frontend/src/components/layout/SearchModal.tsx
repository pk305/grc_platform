'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  MIN_TERM_LENGTH,
  SECTION_ICON,
  SECTION_LABEL,
  SECTION_ORDER,
  useQuickSearch,
  type QuickSearchItem
} from '@/hooks/useQuickSearch';

/** Must stay in step with the .qs-panel exit animation in globals.scss. */
const EXIT_MS = 140;

export default function SearchModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const [term, setTerm] = useState('');
  // Tracked by key, not index: results are replaced wholesale as the user
  // types, and a remembered index would silently point at a different row.
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [exiting, setExiting] = useState(false);

  const { items, loading, debouncedTerm } = useQuickSearch(term);

  // Derived rather than stored, so a result set that no longer contains the
  // highlighted row falls back to the first one without an extra render.
  const foundIndex = items.findIndex(item => item.key === activeKey);
  const activeIndex = foundIndex === -1 ? 0 : foundIndex;
  const activeItem = items[activeIndex];

  const requestClose = useCallback(() => setExiting(true), []);

  // Unmounting is deferred to the parent so the exit animation can play out.
  useEffect(() => {
    if (!exiting) return undefined;
    const timer = setTimeout(onClose, EXIT_MS);
    return () => clearTimeout(timer);
  }, [exiting, onClose]);

  // Take focus on open and hand it back to whatever had it on close.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    return () => previouslyFocused?.focus?.();
  }, []);

  // The page behind the palette must not scroll with it open.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const go = useCallback(
    (item: QuickSearchItem | undefined) => {
      if (!item) return;
      router.push(item.url);
      setExiting(true);
    },
    [router]
  );

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      requestClose();
      return;
    }
    // The shortcut that opened the palette also dismisses it.
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      requestClose();
      return;
    }
    // Focus stays on the input for the whole lifetime of the palette, so Tab
    // has nowhere useful to go — let it not break out to the page behind.
    if (event.key === 'Tab') {
      event.preventDefault();
      return;
    }
    if (!items.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveKey(items[(activeIndex + 1) % items.length].key);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveKey(items[(activeIndex - 1 + items.length) % items.length].key);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      go(activeItem);
    }
  }

  const state = exiting ? 'exiting' : 'entering';
  const searching = debouncedTerm.length >= MIN_TERM_LENGTH;

  return createPortal(
    <div
      className="qs-backdrop"
      data-state={state}
      // A click that starts and ends on the backdrop dismisses; one that began
      // inside the panel (a drag over a result) must not.
      onMouseDown={event => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      <div
        className="qs-panel"
        data-state={state}
        role="dialog"
        aria-modal="true"
        aria-label="Quick search"
        onKeyDown={handleKeyDown}
      >
        <div className="qs-field">
          <span className="fas fa-search qs-field-icon" aria-hidden="true" />
          <input
            ref={inputRef}
            className="qs-input"
            type="text"
            value={term}
            placeholder="Search pages, risks and people"
            aria-label="Search"
            role="combobox"
            aria-expanded={items.length > 0}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={
              activeItem ? `${listboxId}-${activeIndex}` : undefined
            }
            autoComplete="off"
            spellCheck={false}
            onChange={event => setTerm(event.target.value)}
          />
          {term && (
            <button
              type="button"
              className="qs-clear"
              aria-label="Clear search"
              onClick={() => {
                setTerm('');
                inputRef.current?.focus();
              }}
            >
              <span className="fas fa-times" aria-hidden="true" />
            </button>
          )}
        </div>

        {/*
          ARIA 1.2 combobox: focus never leaves the input, so the options carry
          no tabbable controls of their own — the highlight is published with
          aria-activedescendant and acted on by Enter.
        */}
        <div
          className="qs-results"
          id={listboxId}
          role="listbox"
          aria-label="Search results"
        >
          {SECTION_ORDER.map(kind => {
            const section = items.filter(item => item.kind === kind);
            if (!section.length) return null;
            const heading =
              kind === 'page' && !term ? 'Jump to' : SECTION_LABEL[kind];

            return (
              <div key={kind} role="group" aria-label={heading}>
                <p className="qs-section" aria-hidden="true">
                  {heading}
                </p>
                {section.map(item => {
                  const index = items.indexOf(item);
                  const isActive = index === activeIndex;
                  return (
                    <div
                      key={item.key}
                      id={`${listboxId}-${index}`}
                      role="option"
                      aria-selected={isActive}
                      className={`qs-row ${isActive ? 'is-active' : ''}`.trim()}
                      onMouseMove={() => setActiveKey(item.key)}
                      onClick={() => go(item)}
                    >
                      <span
                        className={`${SECTION_ICON[item.kind]} qs-row-icon`}
                        aria-hidden="true"
                      />
                      <span className="qs-row-text">
                        <span className="qs-row-label">{item.label}</span>
                        {item.sublabel && (
                          <span className="qs-row-sublabel">
                            {item.sublabel}
                          </span>
                        )}
                      </span>
                      <span className="qs-row-kind" aria-hidden="true">
                        {SECTION_LABEL[item.kind]}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {!items.length && (
            <p className="qs-empty">
              {loading
                ? 'Searching…'
                : searching
                  ? `No matches for “${debouncedTerm}”.`
                  : `Type at least ${MIN_TERM_LENGTH} characters to search.`}
            </p>
          )}
        </div>

        <div className="qs-footer">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> navigate
          </span>
          <span>
            <kbd>↵</kbd> open
          </span>
          <span>
            <kbd>esc</kbd> close
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
}
