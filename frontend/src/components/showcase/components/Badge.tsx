import { colors, capitalize } from '@/lib/theme-colors';

export function BadgeHeadingDemo() {
  return (
    <>
      <h1>
        Example heading <span className="badge bg-secondary">New</span>
      </h1>
      <h2>
        Example heading <span className="badge bg-secondary">New</span>
      </h2>
      <h3>
        Example heading <span className="badge bg-secondary">New</span>
      </h3>
      <h4>
        Example heading <span className="badge bg-secondary">New</span>
      </h4>
      <h5>
        Example heading <span className="badge bg-secondary">New</span>
      </h5>
      <h6>
        Example heading <span className="badge bg-secondary">New</span>
      </h6>
    </>
  );
}

export function BadgeButtonsDemo() {
  return (
    <button className="btn btn-primary d-flex align-items-center" type="button">
      Notifications <span className="badge bg-secondary ms-2">4</span>
    </button>
  );
}

export function BadgePositionedDemo() {
  return (
    <button className="btn btn-primary position-relative" type="button">
      Inbox
      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
        99+
        <span className="visually-hidden">unread messages</span>
      </span>
    </button>
  );
}

const badgeClass = value =>
  `bg-${value}${value === 'light' ? ' text-dark' : ''}${value === 'dark' ? ' dark__bg-dark' : ''}`;

export function BadgeSolidDemo() {
  return (
    <>
      {colors.map(value => (
        <span key={value} className={`badge ${badgeClass(value)}`}>
          {capitalize(value)}
        </span>
      ))}
    </>
  );
}

export function BadgeWithIconsDemo() {
  return (
    <>
      {colors.map(value => (
        <span key={value} className={`badge fs--1 ${badgeClass(value)}`}>
          {capitalize(value)}
          <span className="fas fa-bell ms-1" />
        </span>
      ))}
    </>
  );
}

export function BadgePillDemo() {
  return (
    <>
      {colors.map(value => (
        <span key={value} className={`badge rounded-pill ${badgeClass(value)}`}>
          {capitalize(value)}
        </span>
      ))}
    </>
  );
}

export function BadgeSoftDemo() {
  return (
    <>
      {colors.map(value => (
        <span key={value} className={`badge badge-soft-${value}`}>
          {capitalize(value)}
        </span>
      ))}
    </>
  );
}

export function BadgeSoftPillDemo() {
  return (
    <>
      {colors.map(value => (
        <span key={value} className={`badge rounded-pill badge-soft-${value}`}>
          {capitalize(value)}
        </span>
      ))}
    </>
  );
}
