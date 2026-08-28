export function BasicExample() {
  return (
    <>
      <a
        className="btn btn-primary me-1"
        data-bs-toggle="offcanvas"
        href="#offcanvasExample"
        role="button"
        aria-controls="offcanvasExample"
      >
        Link with href
      </a>
      <button
        className="btn btn-primary"
        type="button"
        data-bs-toggle="offcanvas"
        data-bs-target="#offcanvasExample"
        aria-controls="offcanvasExample"
      >
        Button with data-bs-target
      </button>
      <div
        id="offcanvasExample"
        className="offcanvas offcanvas-start"
        tabIndex={-1}
        aria-labelledby="offcanvasExampleLabel"
      >
        <div className="offcanvas-header">
          <h5 id="offcanvasExampleLabel" className="offcanvas-title">
            Offcanvas
          </h5>
          <button
            className="btn-close text-reset"
            type="button"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          />
        </div>
        <div className="offcanvas-body">
          <div>
            Some text as placeholder. In real life you can have the elements you
            have chosen. Like, text, images, lists, etc.
          </div>
          <div className="dropdown mt-3">
            <button
              id="dropdownMenuButton"
              className="btn btn-secondary dropdown-toggle"
              type="button"
              data-bs-toggle="dropdown"
            >
              Dropdown button
            </button>
            <ul className="dropdown-menu" aria-labelledby="dropdownMenuButton">
              <li>
                <a className="dropdown-item" href="#">
                  Action
                </a>
              </li>
              <li>
                <a className="dropdown-item" href="#">
                  Another action
                </a>
              </li>
              <li>
                <a className="dropdown-item" href="#">
                  Something else here
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

export function OffcanvasPlacement() {
  const placements = [
    {
      id: 'offcanvasTop',
      className: 'offcanvas-top',
      label: 'Top Offcanvas',
      title: 'Offcanvas top'
    },
    {
      id: 'offcanvasRight',
      className: 'offcanvas-end',
      label: 'Right Offcanvas',
      title: 'Offcanvas right'
    },
    {
      id: 'offcanvasLeft',
      className: 'offcanvas-start',
      label: 'Left Offcanvas',
      title: 'Offcanvas left'
    },
    {
      id: 'offcanvasBottom',
      className: 'offcanvas-bottom',
      label: 'Bottom offcanvas',
      title: 'Offcanvas bottom',
      bodyClass: 'small'
    }
  ];
  return (
    <>
      {placements.map(p => (
        <div key={p.id}>
          <button
            className="btn btn-primary mb-1"
            type="button"
            data-bs-toggle="offcanvas"
            data-bs-target={`#${p.id}`}
            aria-controls={p.id}
          >
            {p.label}
          </button>
          <div
            id={p.id}
            className={`offcanvas ${p.className}`}
            tabIndex={-1}
            aria-labelledby={`${p.id}Label`}
          >
            <div className="offcanvas-header">
              <h5 id={`${p.id}Label`} className="offcanvas-title">
                {p.title}
              </h5>
              <button
                className="btn-close text-reset"
                type="button"
                data-bs-dismiss="offcanvas"
                aria-label="Close"
              />
            </div>
            <div className={`offcanvas-body ${p.bodyClass || ''}`.trim()}>
              ...
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export function OffcanvasBackDrop() {
  return (
    <>
      <button
        className="btn btn-primary mb-1"
        type="button"
        data-bs-toggle="offcanvas"
        data-bs-target="#offcanvasScrolling"
        aria-controls="offcanvasScrolling"
      >
        Enable body scrolling
      </button>
      <div
        id="offcanvasScrolling"
        className="offcanvas offcanvas-start"
        data-bs-scroll="true"
        data-bs-backdrop="false"
        tabIndex={-1}
        aria-labelledby="offcanvasScrollingLabel"
      >
        <div className="offcanvas-header">
          <h5 id="offcanvasScrollingLabel" className="offcanvas-title">
            Colored with scrolling
          </h5>
          <button
            className="btn-close text-reset"
            type="button"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          />
        </div>
        <div className="offcanvas-body">
          <p>
            Try scrolling the rest of the page to see this option in action.
          </p>
        </div>
      </div>

      <button
        className="btn btn-primary mb-1"
        type="button"
        data-bs-toggle="offcanvas"
        data-bs-target="#offcanvasWithBackdrop"
        aria-controls="offcanvasWithBackdrop"
      >
        Enable backdrop (default)
      </button>
      <div
        id="offcanvasWithBackdrop"
        className="offcanvas offcanvas-start"
        tabIndex={-1}
        aria-labelledby="offcanvasWithBackdropLabel"
      >
        <div className="offcanvas-header">
          <h5 id="offcanvasWithBackdropLabel" className="offcanvas-title">
            Offcanvas with backdrop
          </h5>
          <button
            className="btn-close text-reset"
            type="button"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          />
        </div>
        <div className="offcanvas-body">
          <p>.....</p>
        </div>
      </div>

      <button
        className="btn btn-primary mb-1"
        type="button"
        data-bs-toggle="offcanvas"
        data-bs-target="#offcanvasWithBothOptions"
        aria-controls="offcanvasWithBothOptions"
      >
        Enable both scrolling &amp; backdrop
      </button>
      <div
        id="offcanvasWithBothOptions"
        className="offcanvas offcanvas-start"
        data-bs-scroll="true"
        tabIndex={-1}
        aria-labelledby="offcanvasWithBothOptionsLabel"
      >
        <div className="offcanvas-header">
          <h5 id="offcanvasWithBothOptionsLabel" className="offcanvas-title">
            Backdroped with scrolling
          </h5>
          <button
            className="btn-close text-reset"
            type="button"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          />
        </div>
        <div className="offcanvas-body">
          <p>
            Try scrolling the rest of the page to see this option in action.
          </p>
        </div>
      </div>
    </>
  );
}
