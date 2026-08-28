export function ToastBasicExampleDemo() {
  return (
    <div
      className="toast show"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      data-bs-autohide="false"
    >
      <div className="toast-header">
        <strong className="me-auto">Bootstrap</strong>
        <small>11 mins ago</small>
        <button
          className="ms-2 btn-close"
          type="button"
          data-bs-dismiss="toast"
          aria-label="Close"
        />
      </div>
      <div className="toast-body">Hello, world! This is a toast message.</div>
    </div>
  );
}

export function ToastPlacement() {
  return (
    <>
      <form>
        <div className="mb-3">
          <label htmlFor="selectToastPlacement">Toast placement</label>
          <select
            id="selectToastPlacement"
            className="form-select mt-2"
            defaultValue=""
          >
            <option value="">Select a position...</option>
            <option value="top-0 start-0">Top left</option>
            <option value="top-0 start-50 translate-middle-x">
              Top center
            </option>
            <option value="top-0 end-0">Top right</option>
            <option value="top-50 start-0 translate-middle-y">
              Middle left
            </option>
            <option value="top-50 start-50 translate-middle">
              Middle center
            </option>
            <option value="top-50 end-0 translate-middle-y">
              Middle right
            </option>
            <option value="bottom-0 start-0">Bottom left</option>
            <option value="bottom-0 start-50 translate-middle-x">
              Bottom center
            </option>
            <option value="bottom-0 end-0">Bottom right</option>
          </select>
        </div>
      </form>
      <div
        className="bg-dark position-relative bd-example-toasts"
        aria-live="polite"
        aria-atomic="true"
      >
        <div
          id="toastPlacement"
          className="toast-container position-absolute p-3"
        >
          <div className="toast">
            <div className="toast-header">
              <img
                className="rounded me-2"
                src="/assets/img/icons/logo.png"
                alt="..."
              />
              <strong className="me-auto">Bootstrap</strong>
              <small>11 mins ago</small>
            </div>
            <div className="toast-body">
              Hello, world! This is a toast message.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function ToastStackingDescription() {
  return (
    <p>
      When you have multiple toasts, we default to vertically stacking them in a
      readable manner.
    </p>
  );
}

export function ToastStackingDemo() {
  return (
    <>
      <div
        className="toast show mb-2"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        <div className="toast-header">
          <strong className="me-auto">Bootstrap</strong>
          <small className="text-muted">just now</small>
          <button
            className="ms-2 btn-close"
            type="button"
            data-bs-dismiss="toast"
            aria-label="Close"
          />
        </div>
        <div className="toast-body">See? Just like this.</div>
      </div>
      <div
        className="toast show"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        <div className="toast-header">
          <strong className="me-auto">Bootstrap</strong>
          <small className="text-muted">2 seconds ago</small>
          <button
            className="ms-2 btn-close"
            type="button"
            data-bs-dismiss="toast"
            aria-label="Close"
          />
        </div>
        <div className="toast-body">
          Heads up, toasts will stack automatically
        </div>
      </div>
    </>
  );
}

export function ToastRightPlaceDemo() {
  return (
    <div
      className="position-relative mb-4"
      aria-live="polite"
      aria-atomic="true"
      style={{ minHeight: '130px' }}
    >
      <div className="toast show position-absolute top-0 end-0">
        <div className="toast-header">
          <strong className="me-auto">Bootstrap</strong>
          <small>11 mins ago</small>
          <button
            className="ms-2 btn-close"
            type="button"
            data-bs-dismiss="toast"
            aria-label="Close"
          />
        </div>
        <div className="toast-body">Hello, world! This is a toast message.</div>
      </div>
    </div>
  );
}

export function ToastMiddlePlaceDemo() {
  return (
    <div
      className="d-flex flex-center"
      aria-live="polite"
      aria-atomic="true"
      style={{ minHeight: '300px' }}
    >
      <div
        className="toast show"
        role="alert"
        data-bs-autohide="false"
        aria-live="assertive"
        aria-atomic="true"
      >
        <div className="toast-header">
          <strong className="me-auto">Bootstrap</strong>
          <small>11 mins ago</small>
          <button
            className="ms-2 btn-close"
            type="button"
            data-bs-dismiss="toast"
            aria-label="Close"
          />
        </div>
        <div className="toast-body">Hello, world! This is a toast message.</div>
      </div>
    </div>
  );
}

export function LiveToastDemo() {
  return (
    <>
      <button id="liveToastBtn" className="btn btn-primary" type="button">
        Show live toast
      </button>
      <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 5 }}>
        <div
          id="liveToast"
          className="toast fade"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <div className="toast-header">
            <strong className="me-auto">Bootstrap</strong>
            <small>11 mins ago</small>
            <button
              className="btn-close btn-close-white"
              type="button"
              data-bs-dismiss="toast"
              aria-label="Close"
            />
          </div>
          <div className="toast-body">
            Hello, world! This is a toast message.
          </div>
        </div>
      </div>
    </>
  );
}

export function TranslucentDemo() {
  return (
    <div
      className="toast show"
      role="alert"
      data-bs-autohide="false"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="toast-header">
        <strong className="me-auto">Bootstrap</strong>
        <small className="text-muted">11 mins ago</small>
        <button
          className="btn-close"
          type="button"
          data-bs-dismiss="toast"
          aria-label="Close"
        />
      </div>
      <div className="toast-body">Hello, world! This is a toast message.</div>
    </div>
  );
}

export function ToastColorSchemesDemo() {
  return (
    <div className="d-flex">
      <div
        className="toast show align-items-center text-white bg-primary border-0"
        role="alert"
        data-bs-autohide="false"
        aria-live="assertive"
        aria-atomic="true"
      >
        <div className="d-flex">
          <div className="toast-body">
            Hello, world! This is a toast message.
          </div>
          <button
            className="btn-close btn-close-white ms-2 m-auto"
            type="button"
            data-bs-dismiss="toast"
            aria-label="Close"
          />
        </div>
      </div>
    </div>
  );
}

export function CustomContentDemo() {
  return (
    <div
      className="toast show align-items-center"
      role="alert"
      data-bs-autohide="false"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="d-flex">
        <div className="toast-body">Hello, world! This is a toast message.</div>
        <button
          className="btn-close m-auto"
          type="button"
          data-bs-dismiss="toast"
          aria-label="Close"
        />
      </div>
      <div className="py-3 border-top">
        <button className="btn btn-primary btn-sm" type="button">
          Take action
        </button>
        <button
          className="btn btn-secondary btn-sm ms-2"
          type="button"
          data-bs-dismiss="toast"
        >
          Close
        </button>
      </div>
    </div>
  );
}
