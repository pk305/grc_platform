'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode
} from 'react';
import { Theme } from '@radix-ui/themes';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

/** Shared with the pre-paint script in the root layout — keep the two in step. */
export const THEME_STORAGE_KEY = 'phoenix-theme';

/** Fired on this tab when the choice changes; `storage` only fires on others. */
const THEME_CHANGE_EVENT = 'phoenix-theme-change';

const DARK_QUERY = '(prefers-color-scheme: dark)';

/* -------------------------------------------------------------------------- */
/* The two browser values the theme depends on, read as external stores.       */
/* Both snapshots return strings, so React can compare them by value and the   */
/* server snapshots give hydration something stable to start from.             */
/* -------------------------------------------------------------------------- */

function subscribeToMode(onChange: () => void): () => void {
  window.addEventListener('storage', onChange);
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
  };
}

function getModeSnapshot(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // Private mode, or site data blocked — fall through to the default.
  }
  return 'system';
}

function subscribeToSystem(onChange: () => void): () => void {
  const media = window.matchMedia(DARK_QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

function getSystemSnapshot(): ResolvedTheme {
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

const getServerMode = (): ThemeMode => 'system';
const getServerSystem = (): ResolvedTheme => 'light';

interface ThemeContextValue {
  /** What the user chose, including 'system'. */
  mode: ThemeMode;
  /** What that currently resolves to — never 'system'. */
  resolved: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Owns the light/dark choice for the whole app.
 *
 * Two theming systems have to agree: the Falcon SCSS keys off a `dark` class
 * on `<html>`, and Radix takes an `appearance` prop. Both are driven from the
 * one value here so they can never disagree. The pre-paint script in the root
 * layout applies the class before first paint; this provider takes over on
 * hydration and keeps it in sync afterwards.
 *
 * The preference lives in localStorage rather than React state so it survives
 * reloads and — via the `storage` event — tracks across the user's open tabs.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const mode = useSyncExternalStore(
    subscribeToMode,
    getModeSnapshot,
    getServerMode
  );
  const systemResolved = useSyncExternalStore(
    subscribeToSystem,
    getSystemSnapshot,
    getServerSystem
  );

  const resolved: ResolvedTheme = mode === 'system' ? systemResolved : mode;

  // Pushing the resolved theme out to the document is exactly what an effect
  // is for: synchronising an external system with React state.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolved === 'dark');
    // Lets CSS and any non-React widget read the active theme directly.
    document.documentElement.dataset.theme = resolved;
  }, [resolved]);

  const setMode = useCallback((next: ThemeMode) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Preference just won't survive a reload; the session still switches.
    }
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }, []);

  const value = useMemo(
    () => ({ mode, resolved, setMode }),
    [mode, resolved, setMode]
  );

  return (
    <ThemeContext.Provider value={value}>
      <Theme
        appearance={resolved}
        accentColor="blue"
        grayColor="slate"
        radius="small"
        hasBackground={false}
        panelBackground="solid"
      >
        {children}
      </Theme>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
