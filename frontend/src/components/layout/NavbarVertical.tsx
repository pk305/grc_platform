'use client';

import { Fragment, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { sitemap, type SitemapPage } from '@/lib/sitemap';
import { cleanText } from '@/lib/text';

const slugify = str => str.toLowerCase().replace(/\s+/g, '-');

const containsActivePath = (pages: SitemapPage[], pathname: string): boolean =>
  pages.some(
    page =>
      page.path === pathname ||
      (page.pages && containsActivePath(page.pages, pathname))
  );

function NavLink({
  page,
  pathname,
  isGroup
}: {
  page: SitemapPage;
  pathname: string;
  isGroup: boolean;
}) {
  const slug = slugify(page.name);
  const isActive = !isGroup && page.path === pathname;
  const isPlaceholder = page.path === '#!';

  const inner = (
    <div className="d-flex align-items-center">
      {isGroup && (
        <div className="dropdown-indicator-icon d-flex flex-center">
          <span className="fas fa-caret-right fs-0" />
        </div>
      )}
      {page.icon && (
        <span className="nav-link-icon">
          <span data-feather={page.icon} />
        </span>
      )}
      <span className="nav-link-text">{cleanText(page.name)}</span>
      {page.badge && (
        <span
          className={`badge rounded-pill ms-2 badge-soft-${page.badge.type}`}
        >
          {page.badge.text}
        </span>
      )}
    </div>
  );

  if (isGroup) {
    const expanded = containsActivePath(page.pages, pathname);
    return (
      <a
        className="nav-link dropdown-indicator"
        href={`#${slug}`}
        role="button"
        data-bs-toggle="collapse"
        data-bs-target={`#${slug}`}
        aria-expanded={expanded ? 'true' : 'false'}
        aria-controls={slug}
      >
        {inner}
      </a>
    );
  }

  if (isPlaceholder) {
    return (
      <a className="nav-link" href="#!">
        {inner}
      </a>
    );
  }

  return (
    <Link
      className={`nav-link ${isActive ? 'active' : ''}`.trim()}
      href={page.path}
    >
      {inner}
    </Link>
  );
}

function NavTree({
  pages,
  pathname,
  id,
  topLevel = false
}: {
  pages: SitemapPage[];
  pathname: string;
  id?: string;
  topLevel?: boolean;
}) {
  const items = pages.map(page => (
    <li className="nav-item" key={page.name}>
      <NavLink page={page} pathname={pathname} isGroup={!!page.pages} />
      {page.pages && (
        <NavTree
          pages={page.pages}
          pathname={pathname}
          id={slugify(page.name)}
        />
      )}
    </li>
  ));

  if (topLevel) return items;

  return (
    <ul
      className={`nav collapse parent ${containsActivePath(pages, pathname) ? 'show' : ''}`.trim()}
      id={id}
    >
      {items}
    </ul>
  );
}

export default function NavbarVertical({ className }) {
  const pathname = usePathname();

  useEffect(() => {
    const toggle = document.querySelector('.navbar-vertical-toggle');
    const html = document.documentElement;
    const collapseEl = document.querySelector(
      '.navbar-vertical .navbar-collapse'
    );

    try {
      const stored = JSON.parse(
        localStorage.getItem('isNavbarVerticalCollapsed')
      );
      if (stored) html.classList.add('navbar-vertical-collapsed');
    } catch {
      // no stored preference yet
    }

    const onToggleClick = e => {
      e.currentTarget.blur();
      html.classList.toggle('navbar-vertical-collapsed');
      let stored = false;
      try {
        stored =
          JSON.parse(localStorage.getItem('isNavbarVerticalCollapsed')) ||
          false;
      } catch {
        stored = false;
      }
      localStorage.setItem(
        'isNavbarVerticalCollapsed',
        JSON.stringify(!stored)
      );
    };
    const onMouseOver = () => {
      if (html.classList.contains('navbar-vertical-collapsed')) {
        html.classList.add('navbar-vertical-collapsed-hover-nn');
      }
    };
    const onMouseLeave = () => {
      if (html.classList.contains('navbar-vertical-collapsed-hover-nn')) {
        html.classList.remove('navbar-vertical-collapsed-hover-nn');
      }
    };

    toggle?.addEventListener('click', onToggleClick);
    collapseEl?.addEventListener('mouseover', onMouseOver);
    collapseEl?.addEventListener('mouseleave', onMouseLeave);

    return () => {
      toggle?.removeEventListener('click', onToggleClick);
      collapseEl?.removeEventListener('mouseover', onMouseOver);
      collapseEl?.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <nav
      className={`navbar navbar-light navbar-vertical navbar-vibrant ${className || ''}`.trim()}
    >
      <div id="navbarVerticalCollapse" className="collapse navbar-collapse">
        <div className="navbar-vertical-content scrollbar">
          <ul className="navbar-nav flex-column" id="navbarVerticalNav">
            {sitemap.map(item =>
              item.pages ? (
                <Fragment key={item.label || item.name}>
                  {item.label && (
                    <p className="navbar-vertical-label">
                      {cleanText(item.label)}
                    </p>
                  )}
                  <NavTree pages={item.pages} pathname={pathname} topLevel />
                </Fragment>
              ) : (
                <li className="nav-item" key={item.name}>
                  <NavLink page={item} pathname={pathname} isGroup={false} />
                </li>
              )
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
