'use client';

import { useCallback, useEffect, useState } from 'react';
import SearchModal from './SearchModal';

/**
 * The navbar's search affordance. Looks like a field but is a button: typing
 * happens in the palette it opens, so there is no second input to keep in
 * sync, and the control can never submit a form out from under the app.
 */
export default function Search({
  placeholder = 'Search...',
  inputClass = '',
  className
}: {
  placeholder?: string;
  inputClass?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  // ⌘K / Ctrl-K from anywhere in the app, the way every command palette works.
  // Opening only — the palette closes itself on ⌘K so the exit animation
  // still plays instead of the whole thing being unmounted mid-flight.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className={`search-box ${className || ''}`.trim()}>
      <button
        type="button"
        className={`form-control form-control-sm search-input qs-trigger ${inputClass}`.trim()}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="qs-trigger-text">{placeholder}</span>
        {/*
          Shown as ⌘K on every platform: it reads as "command palette" by now,
          and the handler accepts Ctrl just the same.
        */}
        <kbd className="qs-trigger-kbd" aria-hidden="true">
          ⌘K
        </kbd>
      </button>
      <span className="fas fa-search search-box-icon" aria-hidden="true" />

      {open && <SearchModal onClose={close} />}
    </div>
  );
}
