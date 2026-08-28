import Link from 'next/link';
import Logo from '@/components/common/Logo';
import Search from './Search';
import NavbarIcons from './NavbarIcons';

export default function NavbarTop({
  toggleID = 'navbarVerticalCollapse',
  search = true,
  className
}: {
  toggleID?: string;
  search?: boolean;
  className?: string;
}) {
  return (
    <nav className={`navbar navbar-light navbar-top ${className || ''}`.trim()}>
      <div className="navbar-logo">
        <button
          className="btn navbar-toggler navbar-toggler-humburger-icon"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target={`#${toggleID}`}
          aria-controls={toggleID}
          aria-expanded="false"
          aria-label="Toggle Navigation"
        >
          <span className="navbar-toggle-icon">
            <span className="toggle-line" />
          </span>
        </button>
        <Link href="/" className="navbar-brand me-1 me-sm-3">
          <div className="d-flex align-items-center">
            <Logo textClass="d-none d-sm-block" href={null} />
          </div>
        </Link>
      </div>
      <div className="collapse navbar-collapse">
        {search && (
          <Search
            placeholder="Search..."
            inputClass="min-h-auto"
            className="d-none d-lg-block"
          />
        )}
        <NavbarIcons />
      </div>
    </nav>
  );
}
//
