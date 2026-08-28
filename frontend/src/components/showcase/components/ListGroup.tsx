export function ListGroupBasicExampleDemo() {
  return (
    <ul className="list-group">
      <li className="list-group-item">News Feed</li>
      <li className="list-group-item">Messages</li>
      <li className="list-group-item">Events</li>
      <li className="list-group-item">Groups</li>
      <li className="list-group-item">Pages</li>
    </ul>
  );
}

export function ListGroupActiveItemDemo() {
  return (
    <div className="list-group">
      <a className="list-group-item list-group-item-action active" href="#">
        News Feed
      </a>
      <a className="list-group-item list-group-item-action" href="#">
        Messages
      </a>
      <a className="list-group-item list-group-item-action" href="#">
        Events
      </a>
      <a className="list-group-item list-group-item-action" href="#">
        Groups
      </a>
      <a className="list-group-item list-group-item-action disabled" href="#">
        Pages
      </a>
    </div>
  );
}

export function ListGroupFlushDemo() {
  return (
    <ul className="list-group list-group-flush">
      <li className="list-group-item">Messages</li>
      <li className="list-group-item">Events</li>
      <li className="list-group-item">Groups</li>
      <li className="list-group-item">Pages</li>
    </ul>
  );
}

export function ListGroupBadgeDemo() {
  const items = [
    { label: 'Messages', count: 14 },
    { label: 'Events', count: 2 },
    { label: 'Groups', count: 1 },
    { label: 'Pages', count: 9 }
  ];
  return (
    <ul className="list-group">
      {items.map(item => (
        <li
          key={item.label}
          className="list-group-item d-flex justify-content-between align-items-center"
        >
          {item.label}
          <span className="badge badge-soft-primary rounded-pill">
            {item.count}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function ListGroupBackgroundDemo() {
  const variants = [
    'primary',
    'secondary',
    'success',
    'danger',
    'warning',
    'info',
    'light',
    'dark'
  ];
  return (
    <ul className="list-group">
      <li className="list-group-item py-3">Example with background</li>
      {variants.map(variant => (
        <li
          key={variant}
          className={`list-group-item list-group-item-${variant} py-3`}
        >
          A simple {variant} list group item
        </li>
      ))}
    </ul>
  );
}

export function ListGroupLinkDemo() {
  return (
    <div className="list-group">
      <a
        className="list-group-item list-group-item-action flex-column align-items-start p-3 p-sm-4 light active"
        href="#"
      >
        <div className="d-flex flex-column flex-sm-row justify-content-between mb-1 mb-md-0">
          <h5 className="mb-1 text-white">List group &middot; Bootstrap</h5>
          <small>3 days ago</small>
        </div>
        <p className="mb-1">
          The most basic list group is an unordered list with list items and the
          proper classes. Build upon it with the options that follow, or with
          your own CSS as needed.
        </p>
        <small>The most basic list group</small>
      </a>
      <a
        className="list-group-item list-group-item-action flex-column align-items-start p-3 p-sm-4"
        href="#"
      >
        <div className="d-flex flex-column flex-sm-row justify-content-between mb-1 mb-md-0">
          <h5 className="mb-1">What is list group?</h5>
          <small className="text-muted">3 days ago</small>
        </div>
        <p className="mb-1">
          Creating List Groups with Bootstrap. The list groups are very useful
          and flexible component for displaying lists of elements in a beautiful
          manner.
        </p>
        <small className="text-muted">Donec id elit non mi porta.</small>
      </a>
      <a
        className="list-group-item list-group-item-action flex-column align-items-start p-3 p-sm-4"
        href="#"
      >
        <div className="d-flex flex-column flex-sm-row justify-content-between mb-1 mb-md-0">
          <h5 className="mb-1">What is ordered list?</h5>
          <small className="text-muted">3 days ago</small>
        </div>
        <p className="mb-1">
          An ordered list typically is a numbered list of items. HTML 3.0 gives
          you the ability to control the sequence number - to continue where the
          previous list left off, or to start at a particular number.
        </p>
        <small className="text-muted">An ordered list</small>
      </a>
    </div>
  );
}
