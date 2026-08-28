export function PhoenixButtonsDemo() {
  return (
    <>
      <button className="btn btn-phoenix-primary me-1 mb-1" type="button">
        Primary
      </button>
      <button className="btn btn-phoenix-secondary me-1 mb-1" type="button">
        Secondary
      </button>
      <button className="btn btn-phoenix-success me-1 mb-1" type="button">
        Success
      </button>
      <button className="btn btn-phoenix-danger me-1 mb-1" type="button">
        Danger
      </button>
      <button className="btn btn-phoenix-warning me-1 mb-1" type="button">
        Warning
      </button>
      <button className="btn btn-phoenix-info me-1 mb-1" type="button">
        Info
      </button>
    </>
  );
}

export function SolidButtonsDemo() {
  return (
    <>
      <button className="btn btn-primary me-1 mb-1" type="button">
        Primary
      </button>
      <button className="btn btn-secondary me-1 mb-1" type="button">
        Secondary
      </button>
      <button className="btn btn-success me-1 mb-1" type="button">
        Success
      </button>
      <button className="btn btn-danger me-1 mb-1" type="button">
        Danger
      </button>
      <button className="btn btn-warning me-1 mb-1" type="button">
        Warning
      </button>
      <button className="btn btn-info me-1 mb-1" type="button">
        Info
      </button>
      <button className="btn btn-link me-1 mb-1" type="button">
        Link
      </button>
    </>
  );
}

export function SoftButtonsDemo() {
  return (
    <>
      <button className="btn btn-soft-primary me-1 mb-1" type="button">
        Primary
      </button>
      <button className="btn btn-soft-secondary me-1 mb-1" type="button">
        Secondary
      </button>
      <button className="btn btn-soft-success me-1 mb-1" type="button">
        Success
      </button>
      <button className="btn btn-soft-danger me-1 mb-1" type="button">
        Danger
      </button>
      <button className="btn btn-soft-warning me-1 mb-1" type="button">
        Warning
      </button>
      <button className="btn btn-soft-info me-1 mb-1" type="button">
        Info
      </button>
    </>
  );
}

export function ButtonOutlineDemo() {
  return (
    <>
      <button className="btn btn-outline-primary me-1 mb-1" type="button">
        Primary
      </button>
      <button className="btn btn-outline-secondary me-1 mb-1" type="button">
        Secondary
      </button>
      <button className="btn btn-outline-success me-1 mb-1" type="button">
        Success
      </button>
      <button className="btn btn-outline-danger me-1 mb-1" type="button">
        Danger
      </button>
      <button className="btn btn-outline-warning me-1 mb-1" type="button">
        Warning
      </button>
      <button className="btn btn-outline-info me-1 mb-1" type="button">
        Info
      </button>
    </>
  );
}

export function ButtonSizesDemo() {
  return (
    <>
      <button className="btn btn-primary btn-sm me-1 mb-1" type="button">
        Request Payout
      </button>
      <button className="btn btn-primary me-1 mb-1" type="button">
        Request Payout
      </button>
      <button className="btn btn-primary btn-lg me-1 mb-1" type="button">
        Request Payout
      </button>
    </>
  );
}

export function ButtonIconDemo() {
  return (
    <>
      <button
        type="button"
        className="btn btn-phoenix-secondary btn-sm me-1 mb-1"
      >
        <span className="fas fa-plus me-1" data-fa-transform="shrink-3" />
        Small
      </button>
      <button type="button" className="btn btn-phoenix-secondary me-1 mb-1">
        <span className="fas fa-plus me-1" data-fa-transform="shrink-3" />
        Regular
      </button>
      <button
        type="button"
        className="btn btn-phoenix-secondary btn-lg me-1 mb-1"
      >
        <span className="fas fa-plus me-1" data-fa-transform="shrink-3" />
        Large
      </button>
      <hr />
      <button type="button" className="btn btn-primary me-1 mb-1">
        <span className="fas fa-plus me-1" data-fa-transform="shrink-3" />
        Regular
      </button>
      <button type="button" className="btn btn-outline-primary me-1 mb-1">
        <span className="fas fa-plus me-1" data-fa-transform="shrink-3" />
        Outline
      </button>
      <hr />
      <button type="button" className="btn btn-primary me-1 mb-1">
        Delete
        <span className="fas fa-trash ms-1" data-fa-transform="shrink-3" />
      </button>
    </>
  );
}

export function ButtonCapsuleDemo() {
  return (
    <>
      <button
        type="button"
        className="btn btn-phoenix-secondary rounded-pill me-1 mb-1"
      >
        Example
      </button>
      <button
        type="button"
        className="btn btn-phoenix-secondary rounded-pill me-1 mb-1"
      >
        <span className="fas fa-align-left me-2" data-fa-transform="shrink-3" />
        Icon Left
      </button>
      <button
        type="button"
        className="btn btn-phoenix-secondary rounded-pill me-1 mb-1"
      >
        Icon Right
        <span
          className="fas fa-align-right ms-2"
          data-fa-transform="shrink-3"
        />
      </button>
      <button
        type="button"
        className="btn btn-outline-primary rounded-pill me-1 mb-1"
      >
        Outline
      </button>
      <hr />
      <button
        type="button"
        className="btn btn-sm btn-phoenix-secondary rounded-pill me-1 mb-1"
      >
        Capsule Small
      </button>
      <button
        type="button"
        className="btn btn-phoenix-secondary rounded-pill me-1 mb-1"
      >
        Capsule Regular
      </button>
      <button
        type="button"
        className="btn btn-lg btn-phoenix-secondary rounded-pill me-1 mb-1"
      >
        Capsule Large
      </button>
    </>
  );
}

export function ButtonGroupDemo() {
  return (
    <div className="btn-group" role="group" aria-label="Basic example">
      <button className="btn btn-secondary" type="button">
        Left
      </button>
      <button className="btn btn-secondary" type="button">
        Middle
      </button>
      <button className="btn btn-secondary" type="button">
        Right
      </button>
    </div>
  );
}

export function ButtonToolbarDemo() {
  return (
    <div
      className="btn-toolbar"
      role="toolbar"
      aria-label="Toolbar with button groups"
    >
      <div
        className="btn-group me-2 mb-2"
        role="group"
        aria-label="First group"
      >
        <button className="btn btn-secondary" type="button">
          1
        </button>
        <button className="btn btn-secondary" type="button">
          2
        </button>
        <button className="btn btn-secondary" type="button">
          3
        </button>
        <button className="btn btn-secondary" type="button">
          4
        </button>
      </div>
      <div
        className="btn-group mb-2 me-2"
        role="group"
        aria-label="Second group"
      >
        <button className="btn btn-secondary" type="button">
          5
        </button>
        <button className="btn btn-secondary" type="button">
          6
        </button>
        <button className="btn btn-secondary" type="button">
          7
        </button>
      </div>
      <div className="btn-group mb-2" role="group" aria-label="Third group">
        <button className="btn btn-secondary" type="button">
          8
        </button>
      </div>
    </div>
  );
}

export function ButtonToolbarWithInputGroupDemo() {
  return (
    <>
      <div
        className="btn-toolbar mb-3"
        role="toolbar"
        aria-label="Toolbar with button groups"
      >
        <div
          className="btn-group mb-2 me-2"
          role="group"
          aria-label="First group"
        >
          <button className="btn btn-secondary" type="button">
            1
          </button>
          <button className="btn btn-secondary" type="button">
            2
          </button>
          <button className="btn btn-secondary" type="button">
            3
          </button>
          <button className="btn btn-secondary" type="button">
            4
          </button>
        </div>
        <div className="input-group mb-2">
          <span id="btnGroupAddon" className="input-group-text">
            @
          </span>
          <input
            className="form-control"
            type="text"
            placeholder="Input group example"
            aria-label="Input group example"
            aria-describedby="btnGroupAddon"
          />
        </div>
      </div>
      <div
        className="btn-toolbar justify-content-between"
        role="toolbar"
        aria-label="Toolbar with button groups"
      >
        <div className="btn-group mb-2" role="group" aria-label="First group">
          <button className="btn btn-secondary" type="button">
            1
          </button>
          <button className="btn btn-secondary" type="button">
            2
          </button>
          <button className="btn btn-secondary" type="button">
            3
          </button>
          <button className="btn btn-secondary" type="button">
            4
          </button>
        </div>
        <div className="input-group mb-2">
          <span id="btnGroupAddon2" className="input-group-text">
            @
          </span>
          <input
            className="form-control"
            type="text"
            placeholder="Input group example"
            aria-label="Input group example"
            aria-describedby="btnGroupAddon2"
          />
        </div>
      </div>
    </>
  );
}

export function ButtonGroupVerticalDemo({ className }) {
  return (
    <div
      className={`btn-group-vertical ${className || ''}`.trim()}
      role="group"
      aria-label="Vertical button group"
    >
      <button className="btn btn-secondary" type="button">
        Button
      </button>
      <button className="btn btn-secondary" type="button">
        Button
      </button>
      <button className="btn btn-secondary" type="button">
        Button
      </button>
      <button className="btn btn-secondary" type="button">
        Button
      </button>
      <button className="btn btn-secondary" type="button">
        Button
      </button>
      <button className="btn btn-secondary" type="button">
        Button
      </button>
    </div>
  );
}

export function ButtonGroupSizeDemo() {
  return (
    <>
      <div
        className="btn-group btn-group-lg me-2"
        role="group"
        aria-label="..."
      >
        <button className="btn btn-secondary" type="button">
          Left
        </button>
        <button className="btn btn-secondary" type="button">
          Middle
        </button>
        <button className="btn btn-secondary" type="button">
          Right
        </button>
      </div>
      <div className="btn-group mt-2 me-2" role="group" aria-label="...">
        <button className="btn btn-secondary" type="button">
          Left
        </button>
        <button className="btn btn-secondary" type="button">
          Middle
        </button>
        <button className="btn btn-secondary" type="button">
          Right
        </button>
      </div>
      <div
        className="btn-group btn-group-sm mt-2"
        role="group"
        aria-label="..."
      >
        <button className="btn btn-secondary" type="button">
          Left
        </button>
        <button className="btn btn-secondary" type="button">
          Middle
        </button>
        <button className="btn btn-secondary" type="button">
          Right
        </button>
      </div>
    </>
  );
}

export function ButtonGroupVerticalWithDropdownDemo({ className }) {
  return (
    <div
      className={`btn-group-vertical ${className || ''}`.trim()}
      role="group"
      aria-label="Vertical button group"
    >
      <button className="btn btn-secondary" type="button">
        Button
      </button>
      <button className="btn btn-secondary" type="button">
        Button
      </button>
      <div className="btn-group" role="group">
        <button
          id="btnGroupVerticalDrop1"
          className="btn btn-secondary dropdown-toggle"
          type="button"
          data-bs-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false"
        >
          Dropdown
        </button>
        <div className="dropdown-menu" aria-labelledby="btnGroupVerticalDrop1">
          <a className="dropdown-item" href="#">
            Dropdown link
          </a>
          <a className="dropdown-item" href="#">
            Dropdown
          </a>
        </div>
      </div>
      <button className="btn btn-secondary" type="button">
        Button
      </button>
      <button className="btn btn-secondary" type="button">
        Button
      </button>
      <div className="btn-group" role="group">
        <button
          id="btnGroupVerticalDrop2"
          className="btn btn-secondary dropdown-toggle"
          type="button"
          data-bs-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false"
        >
          Dropdown
        </button>
        <div className="dropdown-menu" aria-labelledby="btnGroupVerticalDrop2">
          <a className="dropdown-item" href="#">
            Dropdown link
          </a>
          <a className="dropdown-item" href="#">
            Dropdown link
          </a>
        </div>
      </div>
      <div className="btn-group" role="group">
        <button
          id="btnGroupVerticalDrop3"
          className="btn btn-secondary dropdown-toggle"
          type="button"
          data-bs-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false"
        >
          Dropdown
        </button>
        <div className="dropdown-menu" aria-labelledby="btnGroupVerticalDrop3">
          <a className="dropdown-item" href="#">
            Dropdown link
          </a>
          <a className="dropdown-item" href="#">
            Dropdown link
          </a>
        </div>
      </div>
      <div className="btn-group" role="group">
        <button
          id="btnGroupVerticalDrop4"
          className="btn btn-secondary dropdown-toggle"
          type="button"
          data-bs-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false"
        >
          Dropdown
        </button>
        <div className="dropdown-menu" aria-labelledby="btnGroupVerticalDrop4">
          <a className="dropdown-item" href="#">
            Dropdown link
          </a>
          <a className="dropdown-item" href="#">
            Dropdown link
          </a>
        </div>
      </div>
    </div>
  );
}

export function ButtonDisableStateDemo() {
  return (
    <>
      <button className="btn btn-lg btn-primary" type="button" disabled>
        Primary button
      </button>
      <button className="btn btn-secondary btn-lg ms-2" type="button" disabled>
        Button
      </button>
    </>
  );
}

export function BlockButtonsDemo() {
  return (
    <div className="d-grid gap-2">
      <button className="btn btn-primary" type="button">
        Button
      </button>
      <button className="btn btn-primary" type="button">
        Button
      </button>
    </div>
  );
}

export function CloseButtonWhiteVariant() {
  return (
    <>
      <button
        className="btn-close btn-close-white"
        type="button"
        aria-label="Close"
      />
      <button
        className="btn-close btn-close-white"
        type="button"
        disabled
        aria-label="Close"
      />
    </>
  );
}

export function CloseButtonExample() {
  return (
    <>
      <button className="btn-close" type="button" aria-label="Close" />
      <button className="btn-close" type="button" disabled aria-label="Close" />
    </>
  );
}
