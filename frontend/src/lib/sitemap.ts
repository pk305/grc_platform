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
  },
  {
    label: 'administration',
    pages: [
      { name: 'Overview', icon: 'grid', path: '/iam' },
      { name: 'Users', icon: 'users', path: '/iam/users' },
      { name: 'Roles', icon: 'shield', path: '/iam/roles' },
      { name: 'Permissions', icon: 'key', path: '/iam/permissions' },
      { name: 'Audit Log', icon: 'file-text', path: '/iam/audit-log' }
    ]
  }
];
