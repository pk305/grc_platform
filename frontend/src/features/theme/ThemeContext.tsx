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

export const THEME_STORAGE_KEY = 'phoenix-theme';

const THEME_CHANGE_EVENT = 'phoenix-theme-change';

const DARK_QUERY = '(prefers-color-scheme: dark)';

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
  } catch {}
  return 'light';
}

function subscribeToSystem(onChange: () => void): () => void {
  const media = window.matchMedia(DARK_QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

function getSystemSnapshot(): ResolvedTheme {
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

const getServerMode = (): ThemeMode => 'light';
const getServerSystem = (): ResolvedTheme => 'light';

interface ThemeContextValue {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

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

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolved === 'dark');
    document.documentElement.dataset.theme = resolved;
  }, [resolved]);

  const setMode = useCallback((next: ThemeMode) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {}
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
