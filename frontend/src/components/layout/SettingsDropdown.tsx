'use client';

import Link from 'next/link';
import { useAuth } from '@/features/auth/AuthContext';
import { useTheme, type ThemeMode } from '@/features/theme/ThemeContext';

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: string }[] = [
  { mode: 'light', label: 'Light', icon: 'fas fa-sun' },
  { mode: 'dark', label: 'Dark', icon: 'fas fa-moon' },
  { mode: 'system', label: 'System', icon: 'fas fa-desktop' }
];

interface SettingsLink {
  href: string;
  label: string;
  icon: string;
  description: string;
  adminOnly?: boolean;
}

const LINKS: SettingsLink[] = [
  {
    href: '/profile',
    label: 'My profile',
    icon: 'fas fa-user',
    description: 'Name, department and photo'
  },
  {
    href: '/profile#security',
    label: 'Security',
    icon: 'fas fa-shield-alt',
    description: 'Password, two-factor and recovery codes'
  },
  {
    href: '/settings/sso',
    label: 'SSO settings',
    icon: 'fas fa-key',
    description: 'Microsoft Entra ID single sign-on',
    adminOnly: true
  },
  {
    href: '/iam',
    label: 'Identity & access',
    icon: 'fas fa-users-cog',
    description: 'Users, roles and permissions',
    adminOnly: true
  }
];

export default function SettingsDropdown() {
  const { isAdmin } = useAuth();
  const { mode, setMode } = useTheme();
  const links = LINKS.filter(link => !link.adminOnly || isAdmin);

  return (
    <div
      className="dropdown-menu dropdown-menu-end py-0 shadow border border-300"
      style={{ minWidth: '18rem' }}
      aria-labelledby="navbarDropdownSettings"
    >
      <div className="card position-relative border-0">
        <div className="card-header border-bottom py-2 px-3">
          <h6 className="mb-0">Settings</h6>
        </div>

        <div className="px-3 py-3 border-bottom">
          <p
            className="fs--2 fw-bold text-600 text-uppercase mb-2"
            id="theme-mode-label"
          >
            Appearance
          </p>
          <div
            className="btn-group w-100"
            role="group"
            aria-labelledby="theme-mode-label"
          >
            {THEME_OPTIONS.map(option => {
              const selected = mode === option.mode;
              return (
                <button
                  key={option.mode}
                  type="button"
                  className={`btn btn-sm ${
                    selected ? 'btn-primary' : 'btn-outline-secondary'
                  }`}
                  aria-pressed={selected}
                  onClick={() => setMode(option.mode)}
                >
                  <span className={`${option.icon} me-1`} aria-hidden="true" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <ul className="list-unstyled mb-0">
          {links.map(link => (
            <li key={link.href} className="border-bottom">
              <Link
                href={link.href}
                className="d-flex gap-3 px-3 py-2 text-decoration-none hover-bg-200"
              >
                <span
                  className={`${link.icon} text-700 mt-1`}
                  aria-hidden="true"
                />
                <span>
                  <span className="d-block text-900 fs--1">{link.label}</span>
                  <span className="d-block text-600 fs--2">
                    {link.description}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
