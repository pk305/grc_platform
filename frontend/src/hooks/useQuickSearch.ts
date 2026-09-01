'use client';

import { useEffect, useMemo, useState } from 'react';
import { useGlobalSearchQuery } from '@/features/navbar/__generated__/queries.generated';
import { flattenSitemap } from '@/lib/sitemap';
import { cleanText } from '@/lib/text';

/** Matches the backend's MIN_SEARCH_TERM_LENGTH — below this nothing is queried. */
export const MIN_TERM_LENGTH = 2;

const DEBOUNCE_MS = 200;
const MAX_PAGE_RESULTS = 4;
/** Pages offered as a starting point before anything has been typed. */
const MAX_SUGGESTIONS = 6;

export type QuickSearchKind = 'page' | 'risk' | 'user';

export interface QuickSearchItem {
  key: string;
  kind: QuickSearchKind;
  label: string;
  sublabel: string;
  url: string;
}

export const SECTION_LABEL: Record<QuickSearchKind, string> = {
  page: 'Pages',
  risk: 'Risks',
  user: 'People'
};

export const SECTION_ICON: Record<QuickSearchKind, string> = {
  page: 'fas fa-file-alt',
  risk: 'fas fa-exclamation-triangle',
  user: 'fas fa-user'
};

export const SECTION_ORDER: QuickSearchKind[] = ['page', 'risk', 'user'];

function toPageItem(page: {
  name: string;
  path: string;
  trail: string[];
}): QuickSearchItem {
  return {
    key: `page-${page.path}`,
    kind: 'page',
    label: cleanText(page.name),
    sublabel: page.trail.map(cleanText).join(' › '),
    url: page.path
  };
}

function matchPages(term: string): QuickSearchItem[] {
  const pages = flattenSitemap();
  if (!term) return pages.slice(0, MAX_SUGGESTIONS).map(toPageItem);

  const needle = term.toLowerCase();
  return pages
    .filter(page =>
      `${page.trail.join(' ')} ${page.name}`.toLowerCase().includes(needle)
    )
    .slice(0, MAX_PAGE_RESULTS)
    .map(toPageItem);
}

/**
 * Results for the quick-search palette: pages matched locally from the
 * sitemap, plus records matched by the API.
 *
 * Pages resolve instantly on the first keystroke while the debounced query is
 * still in flight, so the palette always has something to show; an empty term
 * falls back to offering the main pages rather than an empty panel.
 */
export function useQuickSearch(term: string): {
  items: QuickSearchItem[];
  loading: boolean;
  /** The term the current remote results correspond to. */
  debouncedTerm: string;
} {
  const trimmed = term.trim();
  const [debouncedTerm, setDebouncedTerm] = useState('');

  // Debounce so a query goes out per pause, not per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(trimmed), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [trimmed]);

  const shouldQuery = debouncedTerm.length >= MIN_TERM_LENGTH;
  const { data, loading } = useGlobalSearchQuery({
    variables: { query: debouncedTerm },
    skip: !shouldQuery,
    // The palette lists records that change under the user; a stale hit that
    // dead-ends on click is worse than a moment's spinner.
    fetchPolicy: 'cache-and-network'
  });

  const items = useMemo<QuickSearchItem[]>(() => {
    const pages = matchPages(trimmed);
    // Ignore results still describing an older term — otherwise the list
    // flickers between the previous query's hits and the new one's.
    if (!shouldQuery || debouncedTerm !== trimmed) return pages;

    const remote = (data?.globalSearch ?? []).map(result => ({
      key: result.id,
      kind: (result.kind === 'user' ? 'user' : 'risk') as QuickSearchKind,
      label: result.label,
      sublabel: result.sublabel,
      url: result.url
    }));
    return [...pages, ...remote];
  }, [trimmed, shouldQuery, debouncedTerm, data]);

  return { items, loading: loading && shouldQuery, debouncedTerm };
}
