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
      },
      { name: 'System Settings', icon: 'settings', path: '/settings/system' }
    ]
  }
];

export interface SitemapLeaf {
  name: string;
  path: string;
  trail: string[];
}

export function flattenSitemap(
  pages: SitemapPage[] = sitemap,
  trail: string[] = []
): SitemapLeaf[] {
  return pages.flatMap(page => {
    const heading = page.label ?? page.name;
    if (page.pages) {
      return flattenSitemap(page.pages, heading ? [...trail, heading] : trail);
    }
    if (!page.name || !page.path || page.path === '#!') return [];
    return [{ name: page.name, path: page.path, trail }];
  });
}
