'use client';

import { useEffect } from 'react';
import { siteConfig } from '@/lib/site-config';

export interface PageTitleProps {
  title: string;
}

/**
 * Sets the browser tab title for the current page. Every route in this app
 * is a Client Component, so Next's `metadata` export (Server Component only)
 * can't be used per-page — this fills that gap directly via `document.title`.
 */
export function PageTitle({ title }: PageTitleProps) {
  useEffect(() => {
    const previous = document.title;
    document.title = `${title} | ${siteConfig.name}`;
    return () => {
      document.title = previous;
    };
  }, [title]);

  return null;
}
