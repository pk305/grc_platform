'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Avatar from '@/components/common/Avatar';
import { Button } from '@/components/ui/Button';
import { useAuth, type AuthUser } from '@/features/auth/AuthContext';

const brands = [
  { img: 'nav-icons/behance.png', title: 'Behance', w: 512, h: 512 },
  { img: 'nav-icons/google-cloud.png', title: 'Cloud', w: 512, h: 416 },
  { img: 'nav-icons/slack.png', title: 'Slack', w: 90, h: 90 },
  { img: 'nav-icons/github.png', title: 'Github', w: 512, h: 512 },
  { img: 'nav-icons/bitbucket.png', title: 'BitBucket', w: 512, h: 452 },
  { img: 'nav-icons/google-drive.png', title: 'Drive', w: 512, h: 452 },
  { img: 'nav-icons/trello.png', title: 'Trello', w: 512, h: 512 },
  {
    img: 'nav-icons/figma.png',
    title: 'Figma',
    w: 42,
    h: 61,
    displayWidth: 20
  },
  { img: 'nav-icons/twitter.png', title: 'Twitter', w: 512, h: 407 },
  { img: 'nav-icons/pinterest.png', title: 'Pinterest', w: 512, h: 512 },
  { img: 'nav-icons/linkedin.png', title: 'Linkedin', w: 512, h: 480 },
  { img: 'nav-icons/google-maps.png', title: 'Maps', w: 512, h: 512 },
  { img: 'nav-icons/google-photos.png', title: 'Photos', w: 512, h: 512 },
  { img: 'nav-icons/spotify.png', title: 'Spotify', w: 512, h: 512 }
];

function NineDotsDropdown() {
  return (
    <div
      className="dropdown-menu dropdown-menu-end py-0 dropdown-nide-dots shadow border border-300"
      aria-labelledby="navbarDropdownNindeDots"
    >
      <div className="card bg-white position-relative border-0">
        <div
          className="card-body pt-3 px-3 pb-0 overflow-auto scrollbar"
          style={{ height: '20rem' }}
        >
          <div className="row text-center align-items-center gx-0 gy-0">
            {brands.map(item => (
              <div className="col-4" key={item.title}>
                <a
                  className="d-block hover-bg-200 p-2 rounded-3 text-center text-decoration-none mb-3"
                  href="#!"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Image
                    src={`/assets/img/${item.img}`}
                    alt=""
                    width={item.w}
                    height={item.h}
                    style={{ width: item.displayWidth ?? 30, height: 'auto' }}
                  />
                  <p
                    className={`mb-0 text-black text-truncate fs--2 mt-1 ${item.img ? 'pt-1' : ''}`.trim()}
                  >
                    {item.title}
                  </p>
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

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
      <div className="card bg-white position-relative border-0">
        <div
          className="card-body p-0 overflow-auto scrollbar"
          style={{ height: '18rem' }}
        >
          <div className="text-center pt-4 pb-3">
            <Avatar name={fullName} size="xl" status="" round="circle" />
            <h6 className="mt-2">{fullName}</h6>
            <p className="text-600 fs--1 mb-0">{user.email}</p>
          </div>
          <div className="mb-3 mx-3">
            <input
              id="statusUpdateInput"
              className="form-control form-control-sm"
              type="text"
              placeholder="Update your status"
            />
          </div>
          <ul className="nav d-flex flex-column mb-2 pb-1">
            {[
              ['user', 'Profile'],
              ['pie-chart', 'Dashboard'],
              ['lock', 'Posts & Activity'],
              ['settings', 'Settings & Privacy'],
              ['help-circle', 'Help Center'],
              ['globe', 'Language']
            ].map(([icon, label]) => (
              <li className="nav-item" key={icon}>
                <a className="nav-link px-3" href="#!">
                  <span className="me-2 text-900" data-feather={icon} />
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="card-footer p-0 border-top">
          <ul className="nav d-flex flex-column my-3">
            <li className="nav-item">
              <a className="nav-link px-3" href="#!">
                <span className="me-2 text-900" data-feather="user-plus" />
                Add another account
              </a>
            </li>
          </ul>
          <hr />
          <div className="px-3">
            <Button
              variant="soft"
              color="gray"
              className="d-flex flex-center w-100"
              onClick={onSignOut}
            >
              <span className="me-2" data-feather="log-out" />
              Sign out
            </Button>
          </div>
          <div className="my-2 text-center fw-bold fs--2 text-600">
            <a className="text-600 me-1" href="#!">
              Privacy policy
            </a>
            &bull;
            <a className="text-600 mx-1" href="#!">
              Terms
            </a>
            &bull;
            <a className="text-600 ms-1" href="#!">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NavbarIcons() {
  const { user, logout } = useAuth();
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

  return (
    <ul className="navbar-nav navbar-nav-icons ms-auto flex-row">
      <li className="nav-item dropdown">
        <a
          id="navbarDropdownNotification"
          className="nav-link"
          href="#!"
          role="button"
          data-bs-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false"
        >
          <span
            className="text-700"
            data-feather="bell"
            style={{ height: 20, width: 20 }}
          />
        </a>
      </li>
      <li className="nav-item dropdown">
        <a
          id="navbarDropdownSettings"
          className="nav-link notification-indicator notification-indicator-primary"
          href="#!"
          role="button"
          data-bs-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false"
        >
          <span
            className="text-700"
            data-feather="settings"
            style={{ height: 20, width: 20 }}
          />
        </a>
      </li>
      <li className="nav-item dropdown">
        <a
          id="navbarDropdownNindeDots"
          className="nav-link"
          href="#!"
          role="button"
          data-bs-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {[
              [2, 2],
              [2, 8],
              [2, 14],
              [8, 8],
              [8, 14],
              [14, 8],
              [14, 14],
              [8, 2],
              [14, 2]
            ].map(([cx, cy]) => (
              <circle
                key={`${cx}-${cy}`}
                cx={cx}
                cy={cy}
                r="2"
                fill="#6C6E71"
              />
            ))}
          </svg>
        </a>
        <NineDotsDropdown />
      </li>
      {user && (
        <li className="nav-item dropdown">
          <a
            id="navbarDropdownUser"
            className="nav-link lh-1 px-0 ms-5"
            href="#!"
            role="button"
            data-bs-toggle="dropdown"
            aria-haspopup="true"
            aria-expanded="false"
          >
            <Avatar
              name={`${user.firstName} ${user.lastName}`.trim() || user.email}
              size="l"
              status=""
              round="circle"
            />
          </a>
          <ProfileDropdown user={user} onSignOut={handleSignOut} />
        </li>
      )}
    </ul>
  );
}
