export function Popover({ placement }) {
  const label = `${placement[0].toUpperCase()}${placement.substring(1)} Popover`;
  return (
    <button
      className="btn btn-secondary m-1"
      type="button"
      data-bs-container="body"
      data-bs-toggle="popover"
      data-bs-placement={placement}
      data-bs-content={label}
    >
      {label}
    </button>
  );
}

export function DismissiblePopover() {
  return (
    <a
      className="btn btn-lg btn-danger"
      tabIndex={0}
      role="button"
      data-bs-toggle="popover"
      data-bs-trigger="focus"
      title="Dismissible popover"
      data-bs-content="And here's some amazing content. It's very engaging. Right?"
    >
      Dismissible popover
    </a>
  );
}
