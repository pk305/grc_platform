/**
 * Vertical-nav tree + route map, ported from src/pug/mixins/Variables.pug's
 * `sitemap` literal. Trimmed down to dashboard, starter, and authentication —
 * the errors demo pages and the forms/tables/components/utilities/multi-level
 * showcase sections were dropped along with their routes.
 */
export interface SitemapPage {
  name?: string;
  label?: string;
  path?: string;
  icon?: string;
  pages?: SitemapPage[];
  badge?: { type: string; text: string };
}

export const sitemap: SitemapPage[] = [
  { name: 'dashboard', icon: 'cast', path: '/' },
  {
    label: 'pages',
    pages: [
      { name: 'starter', icon: 'flag', path: '/starter' },
      {
        name: 'authentication',
        icon: 'lock',
        pages: [
          { name: 'login', path: '/auth/login' },
          { name: 'sign-up', path: '/sign-up' },
          { name: 'sign-out', path: '/sign-out' },
          { name: 'forgot-password', path: '/forgot-password' },
          { name: 'reset-password', path: '/reset-password' },
          { name: 'lock-screen', path: '/lock-screen' }
        ]
      }
    ]
  }
];
