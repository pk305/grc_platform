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
    label: 'risk',
    pages: [
      { name: 'Risk Register', icon: 'alert-triangle', path: '/risk-register' }
    ]
  }
];
