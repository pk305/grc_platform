export default function DashboardDropdown({
  id,
  reveal
}: {
  id: string;
  reveal?: string;
}) {
  return (
    <div className="font-sans-serif btn-reveal-trigger">
      <button
        type="button"
        className={`btn btn-link fs--2 text-600 btn-sm dropdown-toggle dropdown-caret-none transition-none btn-reveal${
          reveal ? `-${reveal}` : ''
        }`}
        id={id}
        data-bs-toggle="dropdown"
        data-boundary="window"
        aria-haspopup="true"
        aria-expanded="false"
        data-bs-reference="parent"
      >
        <span className="fas fa-ellipsis-h fs--2" />
      </button>
      <div
        className="dropdown-menu dropdown-menu-end border py-2"
        aria-labelledby={id}
      >
        <a href="#!" className="dropdown-item">
          View
        </a>
        <a href="#!" className="dropdown-item">
          Export
        </a>
        <div className="dropdown-divider" />
        <a href="#!" className="dropdown-item text-danger">
          Remove
        </a>
      </div>
    </div>
  );
}
