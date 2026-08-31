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
      { name: 'My Profile', icon: 'user', path: '/profile' },
      {
        name: 'IAM',
        icon: 'shield',
        pages: [
          { name: 'Overview', path: '/iam' },
          { name: 'Users', path: '/iam/users' },
          { name: 'Roles', path: '/iam/roles' },
          { name: 'Permissions', path: '/iam/permissions' },
          { name: 'Audit Log', path: '/iam/audit-log' }
        ]
      }
    ]
  }
];
