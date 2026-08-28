import Link from 'next/link';
import { colors, capitalize } from '@/lib/theme-colors';
import SocialButtons from '@/components/auth/SocialButtons';

export function DropdownOverview() {
  return (
    <>
      <p>
        Dropdowns are toggleable, contextual overlays for displaying lists of
        links and more. They&apos;re made interactive with the included
        Bootstrap dropdown JavaScript plugin. They&apos;re toggled by clicking,
        not by hovering; this is{' '}
        <a href="https://markdotto.com/2012/02/27/bootstrap-explained-dropdowns/">
          an intentional design decision
        </a>
        .
      </p>
      <p>
        Dropdowns are built on a third party library,{' '}
        <a href="https://popper.js.org/">Popper</a>, which provides dynamic
        positioning and viewport detection. Be sure to include{' '}
        <a href="https://cdn.jsdelivr.net/npm/@popperjs/core@2.10.2/dist/umd/popper.min.js">
          popper.min.js
        </a>{' '}
        before Bootstrap&apos;s JavaScript or use{' '}
        <code>bootstrap.bundle.min.js</code> / <code>bootstrap.bundle.js</code>{' '}
        which contains Popper. Popper isn&apos;t used to position dropdowns in
        navbars though as dynamic positioning isn&apos;t required.
      </p>
    </>
  );
}

export function DropdownContent() {
  return (
    <>
      <a className="dropdown-item" href="#">
        Action
      </a>
      <a className="dropdown-item" href="#">
        Another action
      </a>
      <a className="dropdown-item" href="#">
        Something else here
      </a>
      <div className="dropdown-divider" />
      <a className="dropdown-item" href="#">
        Separated link
      </a>
    </>
  );
}

export function DropdownExampleDemo() {
  return (
    <div className="dropdown font-sans-serif d-inline-block">
      <button
        id="dropdownMenuButton"
        className="btn btn-phoenix-secondary dropdown-toggle"
        type="button"
        data-bs-toggle="dropdown"
        aria-haspopup="true"
        aria-expanded="false"
      >
        Dropdown button
      </button>
      <div
        className="dropdown-menu dropdown-menu-end py-0"
        aria-labelledby="dropdownMenuButton"
      >
        <DropdownContent />
      </div>
    </div>
  );
}

export function DropdownLinkDemo() {
  return (
    <div className="dropdown font-sans-serif">
      <a
        id="dropdownMenuLink"
        className="btn btn-falcon-default dropdown-toggle"
        href="#"
        role="button"
        data-bs-toggle="dropdown"
        aria-haspopup="true"
        aria-expanded="false"
      >
        Dropdown link
      </a>
      <div
        className="dropdown-menu dropdown-menu-end py-0"
        aria-labelledby="dropdownMenuLink"
      >
        <DropdownContent />
      </div>
    </div>
  );
}

export function DropdownButtonVarientDemo() {
  return (
    <>
      {colors.map(color => (
        <div key={color} className="btn-group me-1">
          <button
            className={`btn dropdown-toggle mb-1 btn-${color}`}
            type="button"
            data-bs-toggle="dropdown"
            aria-haspopup="true"
            aria-expanded="false"
          >
            {capitalize(color)}
          </button>
          <div className="dropdown-menu">
            <DropdownContent />
          </div>
        </div>
      ))}
    </>
  );
}

export function DropdownButtonSplitDemo() {
  return (
    <>
      {colors.map(color => (
        <div key={color} className="btn-group mb-1 me-1">
          <button className={`btn btn-${color}`} type="button">
            {capitalize(color)}
          </button>
          <button
            className={`btn dropdown-toggle dropdown-toggle-split btn-${color}`}
            type="button"
            data-bs-toggle="dropdown"
            aria-haspopup="true"
            aria-expanded="false"
          >
            <span className="sr-only">Toggle Dropdown</span>
          </button>
          <div className="dropdown-menu">
            <DropdownContent />
          </div>
        </div>
      ))}
    </>
  );
}

export function DropdownSizingDemo() {
  return (
    <>
      <div className="btn-group mb-1 mb-md-0 me-1">
        <button
          className="btn btn-primary btn-lg dropdown-toggle"
          type="button"
          data-bs-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false"
        >
          Large button
        </button>
        <div className="dropdown-menu">
          <DropdownContent />
        </div>
      </div>
      <div className="btn-group mb-1 mb-md-0 me-1">
        <button
          className="btn btn-primary btn-md dropdown-toggle"
          type="button"
          data-bs-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false"
        >
          Regular button
        </button>
        <div className="dropdown-menu">
          <DropdownContent />
        </div>
      </div>
      <div className="btn-group mb-1 mb-md-0 me-1">
        <button
          className="btn btn-primary btn-sm dropdown-toggle"
          type="button"
          data-bs-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false"
        >
          Small button
        </button>
        <div className="dropdown-menu">
          <DropdownContent />
        </div>
      </div>
      <hr />
      <div className="btn-group mb-1 me-1">
        <button className="btn btn-primary btn-lg" type="button">
          Large split button
        </button>
        <button
          className="btn btn-lg btn-primary dropdown-toggle dropdown-toggle-split"
          type="button"
          data-bs-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false"
        >
          <span className="sr-only">Toggle Dropdown</span>
        </button>
        <div className="dropdown-menu">
          <DropdownContent />
        </div>
      </div>
      <div className="btn-group mb-1 me-1">
        <button className="btn btn-primary btn-md" type="button">
          Regular split button
        </button>
        <button
          className="btn btn-md btn-primary dropdown-toggle dropdown-toggle-split"
          type="button"
          data-bs-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false"
        >
          <span className="sr-only">Toggle Dropdown</span>
        </button>
        <div className="dropdown-menu">
          <DropdownContent />
        </div>
      </div>
      <div className="btn-group mb-1 me-1">
        <button className="btn btn-primary btn-sm" type="button">
          Small split button
        </button>
        <button
          className="btn btn-sm btn-primary dropdown-toggle dropdown-toggle-split"
          type="button"
          data-bs-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false"
        >
          <span className="sr-only">Toggle Dropdown</span>
        </button>
        <div className="dropdown-menu">
          <DropdownContent />
        </div>
      </div>
    </>
  );
}

export function DropdownDirectionsDemo() {
  return (
    <>
      <div className="d-flex flex-column flex-sm-row justify-content-between">
        <div className="btn-group dropend mt-2">
          <button
            className="btn btn-primary dropdown-toggle"
            type="button"
            data-bs-toggle="dropdown"
            aria-haspopup="true"
            aria-expanded="false"
          >
            Dropend
          </button>
          <div className="dropdown-menu">
            <DropdownContent />
          </div>
        </div>
        <div className="btn-group dropup mt-2">
          <button
            className="btn btn-primary dropdown-toggle"
            type="button"
            data-bs-toggle="dropdown"
            aria-haspopup="true"
            aria-expanded="false"
          >
            Dropup
          </button>
          <div className="dropdown-menu">
            <DropdownContent />
          </div>
        </div>
        <div className="btn-group dropstart mt-2">
          <button
            className="btn btn-primary dropdown-toggle"
            type="button"
            data-bs-toggle="dropdown"
            aria-haspopup="true"
            aria-expanded="false"
          >
            Dropstart
          </button>
          <div className="dropdown-menu">
            <DropdownContent />
          </div>
        </div>
      </div>
      <hr />
      <div className="d-flex flex-column flex-md-row justify-content-between">
        <div className="btn-group dropend mt-2">
          <button className="btn btn-primary" type="button">
            Split dropend
          </button>
          <button
            className="btn btn-primary dropdown-toggle dropdown-toggle-split"
            type="button"
            data-bs-toggle="dropdown"
            aria-haspopup="true"
            aria-expanded="false"
          >
            <span className="sr-only">Toggle Dropdown</span>
          </button>
          <div className="dropdown-menu">
            <DropdownContent />
          </div>
        </div>
        <div className="btn-group dropup mt-2">
          <button className="btn btn-primary" type="button">
            Split dropup
          </button>
          <button
            className="btn btn-primary dropdown-toggle dropdown-toggle-split"
            type="button"
            data-bs-toggle="dropdown"
            aria-haspopup="true"
            aria-expanded="false"
          >
            <span className="sr-only">Toggle Dropdown</span>
          </button>
          <div className="dropdown-menu">
            <DropdownContent />
          </div>
        </div>
        <div className="btn-group mt-2">
          <div className="btn-group dropstart" role="group">
            <button
              className="btn btn-primary dropdown-toggle dropdown-toggle-split"
              type="button"
              data-bs-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false"
            >
              <span className="sr-only">Toggle Dropstart</span>
            </button>
            <div className="dropdown-menu">
              <DropdownContent />
            </div>
          </div>
          <button className="btn btn-primary" type="button">
            Split dropstart
          </button>
        </div>
      </div>
    </>
  );
}

export function DropdownMenuItemsDemo() {
  return (
    <>
      <div className="dropdown">
        <button
          id="dropdownMenu2"
          className="btn btn-primary dropdown-toggle"
          type="button"
          data-bs-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false"
        >
          Dropdown
        </button>
        <div className="dropdown-menu" aria-labelledby="dropdownMenu2">
          <button className="dropdown-item" type="button">
            Action
          </button>
          <button className="dropdown-item" type="button">
            Another action
          </button>
          <button className="dropdown-item" type="button">
            Something else here
          </button>
        </div>
      </div>
      <p className="mt-3">
        You can also create non-interactive dropdown items with{' '}
        <code>.dropdown-item-text</code>. Feel free to style further with custom
        CSS or text utilities.
      </p>
      <button
        id="dropdownMenu3"
        className="btn btn-primary dropdown-toggle"
        type="button"
        data-bs-toggle="dropdown"
        aria-haspopup="true"
        aria-expanded="false"
      >
        Dropdown with text
      </button>
      <div className="dropdown-menu" aria-labelledby="dropdownMenu3">
        <span className="dropdown-item-text">Dropdown item text</span>
        <a className="dropdown-item" href="#">
          Action
        </a>
        <a className="dropdown-item" href="#">
          Another action
        </a>
        <a className="dropdown-item" href="#">
          Something else here
        </a>
      </div>
    </>
  );
}

export function DropdownActiveLinkDemo() {
  return (
    <>
      <button
        id="activeLinkExample"
        className="btn btn-primary dropdown-toggle"
        type="button"
        data-bs-toggle="dropdown"
        aria-haspopup="true"
        aria-expanded="false"
      >
        Dropdown
      </button>
      <div className="dropdown-menu" aria-labelledby="activeLinkExample">
        <a className="dropdown-item" href="#">
          Regular link
        </a>
        <a className="dropdown-item active" href="#">
          Active link
        </a>
        <a className="dropdown-item" href="#">
          Another link
        </a>
      </div>
    </>
  );
}

export function DropdownDisabledLinkDemo() {
  return (
    <>
      <button
        id="disabledLinkExample"
        className="btn btn-primary dropdown-toggle"
        type="button"
        data-bs-toggle="dropdown"
        aria-haspopup="true"
        aria-expanded="false"
      >
        Dropdown
      </button>
      <div className="dropdown-menu" aria-labelledby="disabledLinkExample">
        <a className="dropdown-item" href="#">
          Regular link
        </a>
        <a className="dropdown-item disabled" href="#">
          Disabled link
        </a>
        <a className="dropdown-item" href="#">
          Another link
        </a>
      </div>
    </>
  );
}

export function DropdownAlignmentDemo() {
  return (
    <div className="btn-group">
      <button
        className="btn btn-primary dropdown-toggle"
        type="button"
        data-bs-toggle="dropdown"
        data-display="static"
        aria-haspopup="true"
        aria-expanded="false"
      >
        Right-aligned menu
      </button>
      <div className="dropdown-menu dropdown-menu-end">
        <DropdownContent />
      </div>
    </div>
  );
}

export function DropdownHeaderDemo() {
  return (
    <>
      <button
        id="headerExample"
        className="btn btn-primary dropdown-toggle"
        type="button"
        data-bs-toggle="dropdown"
        aria-haspopup="true"
        aria-expanded="false"
      >
        Dropdown
      </button>
      <div className="dropdown-menu" aria-labelledby="headerExample">
        <h6 className="dropdown-header">Dropdown Header</h6>
        <a className="dropdown-item" href="#">
          Regular link
        </a>
        <a className="dropdown-item" href="#">
          Another action link
        </a>
        <div className="dropdown-divider" />
        <a className="dropdown-item" href="#">
          Another link
        </a>
      </div>
    </>
  );
}

export function DropdownDividerDemo() {
  return (
    <>
      <button
        id="dividerExample"
        className="btn btn-primary dropdown-toggle"
        type="button"
        data-bs-toggle="dropdown"
        aria-haspopup="true"
        aria-expanded="false"
      >
        Dropdown
      </button>
      <div className="dropdown-menu" aria-labelledby="dividerExample">
        <DropdownContent />
      </div>
    </>
  );
}

export function DropdownFormsDemo() {
  return (
    <div className="btn-group">
      <button
        className="btn btn-primary dropdown-toggle"
        type="button"
        data-bs-toggle="dropdown"
        data-display="static"
        aria-haspopup="true"
        aria-expanded="false"
      >
        Forms in dropdown
      </button>
      <div className="dropdown-menu py-0">
        <div className="card shadow-none border-0" style={{ width: '22rem' }}>
          <div className="card-body">
            <div className="row text-start justify-content-between align-items-center mb-2">
              <div className="col-auto">
                <h5 className="mb-0">Log in</h5>
              </div>
              <div className="col-auto">
                <p className="fs--1 text-600 mb-0">
                  or <Link href="/sign-up">Create an account</Link>
                </p>
              </div>
            </div>
            <form>
              <div className="mb-3">
                <input
                  className="form-control"
                  type="email"
                  placeholder="Email address"
                />
              </div>
              <div className="mb-3">
                <input
                  className="form-control"
                  type="password"
                  placeholder="Password"
                />
              </div>
              <div className="form-check mb-3">
                <input
                  id="basic-checkbox"
                  className="form-check-input"
                  type="checkbox"
                  defaultChecked
                />
                <label className="form-check-label" htmlFor="basic-checkbox">
                  Remember me
                </label>
              </div>
              <button className="btn btn-primary w-100" type="submit">
                Log in
              </button>
            </form>
            <SocialButtons title="log in" className="mt-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
