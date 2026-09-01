'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Avatar from '@/components/common/Avatar';
import { Button } from '@/components/ui/Button';
import { useAuth, type AuthUser } from '@/features/auth/AuthContext';
import { useChat } from '@/features/chat/ChatContext';
import NotificationsDropdown, {
  useNotifications
} from './NotificationsDropdown';
import SettingsDropdown from './SettingsDropdown';

// feather.replace() swaps each placeholder span for an SVG outside of React,
// leaving React holding a node that is no longer in the document. Nothing may
// therefore be inserted or removed beside one after mount — which is why the
// bell's badge stays mounted and only toggles `hidden`.
const ICON_SIZE = { height: 20, width: 20 } as const;

const PROFILE_LINKS: [icon: string, label: string, href: string][] = [
  ['user', 'Profile', '/profile'],
  ['shield', 'Security', '/profile#security'],
  ['pie-chart', 'Dashboard', '/']
];

function ProfileDropdown({
  user,
  onSignOut
}: {
  user: AuthUser;
  onSignOut: () => void;
}) {
  const fullName = `${user.firstName} ${user.lastName}`.trim() || user.email;

  return (
    <div
      className="dropdown-menu dropdown-menu-end py-0 dropdown-profile shadow border border-300"
      aria-labelledby="navbarDropdownUser"
    >
      <div className="card position-relative border-0">
        <div className="card-body p-0">
          <div className="text-center pt-4 pb-3">
            <Avatar
              name={fullName}
              src={user.avatarUrl}
              size="xl"
              status=""
              round="circle"
            />
            <h6 className="mt-2 mb-0">{fullName}</h6>
            <p className="text-600 fs--1 mb-0">{user.email}</p>
          </div>
          <ul className="nav d-flex flex-column mb-2 pb-1">
            {PROFILE_LINKS.map(([icon, label, href]) => (
              <li className="nav-item" key={href}>
                <Link className="nav-link px-3" href={href}>
                  <span
                    className="me-2 text-900"
                    data-feather={icon}
                    aria-hidden="true"
                  />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="card-footer p-0 border-top">
          <div className="px-3 my-3">
            <Button
              variant="soft"
              color="gray"
              className="d-flex flex-center w-100"
              onClick={onSignOut}
            >
              <span
                className="me-2"
                data-feather="log-out"
                aria-hidden="true"
              />
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NavbarIcons() {
  const { user, logout } = useAuth();
  const {
    items: notifications,
    loading: notificationsLoading,
    clearOne,
    clearAll,
    clearing
  } = useNotifications();
  const { unreadTotal, railOpen, toggleRail } = useChat();
  const router = useRouter();

  async function handleSignOut() {
    try {
      await logout();
    } catch (error) {
      console.error('Sign out request failed', error);
    } finally {
      router.push('/sign-out');
    }
  }

  const attentionCount = notifications.length;

  return (
    <ul className="navbar-nav navbar-nav-icons ms-auto flex-row align-items-center gap-1">
      <li className="nav-item">
        <button
          className="nav-link btn btn-link position-relative border-0 shadow-none"
          type="button"
          onClick={toggleRail}
          aria-pressed={railOpen}
          aria-label={
            unreadTotal > 0
              ? `Chat — ${unreadTotal} unread`
              : railOpen
                ? 'Hide contacts'
                : 'Show contacts'
          }
        >
          <span
            className="text-700"
            data-feather="message-circle"
            style={ICON_SIZE}
            aria-hidden="true"
          />
          {/* Mounted unconditionally for the same reason as the bell's badge:
              feather replaces the icon beside it outside of React. */}
          <span
            className="position-absolute badge rounded-pill bg-danger text-white"
            style={{
              top: 2,
              insetInlineEnd: 0,
              fontSize: '0.6rem',
              padding: '0.15rem 0.3rem'
            }}
            hidden={unreadTotal === 0}
            aria-hidden="true"
          >
            {unreadTotal > 9 ? '9+' : unreadTotal}
          </span>
        </button>
      </li>

      <li className="nav-item dropdown">
        <button
          id="navbarDropdownNotification"
          className="nav-link btn btn-link position-relative border-0 shadow-none"
          type="button"
          data-bs-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false"
          aria-label={
            attentionCount > 0
              ? `Notifications — ${attentionCount} need attention`
              : 'Notifications'
          }
        >
          <span
            className="text-700"
            data-feather="bell"
            style={ICON_SIZE}
            aria-hidden="true"
          />
          {/* Always mounted so React only ever updates it in place. */}
          <span
            className="position-absolute badge rounded-pill bg-danger text-white"
            style={{
              top: 2,
              insetInlineEnd: 0,
              fontSize: '0.6rem',
              padding: '0.15rem 0.3rem'
            }}
            hidden={attentionCount === 0}
            aria-hidden="true"
          >
            {attentionCount}
          </span>
        </button>
        <NotificationsDropdown
          items={notifications}
          loading={notificationsLoading}
          clearOne={clearOne}
          clearAll={clearAll}
          clearing={clearing}
        />
      </li>

      <li className="nav-item dropdown">
        <button
          id="navbarDropdownSettings"
          className="nav-link btn btn-link border-0 shadow-none"
          type="button"
          data-bs-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false"
          aria-label="Settings"
        >
          <span
            className="text-700"
            data-feather="settings"
            style={ICON_SIZE}
            aria-hidden="true"
          />
        </button>
        <SettingsDropdown />
      </li>

      {user && (
        <li className="nav-item dropdown ms-2">
          <button
            id="navbarDropdownUser"
            className="nav-link btn btn-link lh-1 px-0 border-0 shadow-none"
            type="button"
            data-bs-toggle="dropdown"
            aria-haspopup="true"
            aria-expanded="false"
            aria-label={`Account menu for ${
              `${user.firstName} ${user.lastName}`.trim() || user.email
            }`}
          >
            <Avatar
              name={`${user.firstName} ${user.lastName}`.trim() || user.email}
              src={user.avatarUrl}
              size="l"
              status=""
              round="circle"
            />
          </button>
          <ProfileDropdown user={user} onSignOut={handleSignOut} />
        </li>
      )}
    </ul>
  );
}
