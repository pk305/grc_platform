export default function Search({
  placeholder = 'Search...',
  inputClass = '',
  className
}: {
  placeholder?: string;
  inputClass?: string;
  className?: string;
}) {
  return (
    <div className={`search-box ${className || ''}`.trim()}>
      <form
        className="position-relative"
        data-bs-toggle="search"
        data-bs-display="static"
      >
        <input
          className={`form-control form-control-sm search-input search ${inputClass}`.trim()}
          type="search"
          placeholder={placeholder}
          aria-label="Search"
        />
        <span className="fas fa-search search-box-icon" />
      </form>
    </div>
  );
}
