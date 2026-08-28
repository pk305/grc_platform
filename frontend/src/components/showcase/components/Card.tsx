export function CardOverlayDemo({ img, title, body, className }) {
  return (
    <div
      className={`card bg-dark text-white overflow-hidden light ${className || ''}`.trim()}
    >
      <div className="card-img-top">
        <img
          className="img-fluid"
          src={`/assets/img/${img}`}
          alt="Card image"
        />
      </div>
      <div className="card-img-overlay d-flex align-items-end">
        <div>
          <h5 className="card-title text-white">{title}</h5>
          <p className="card-text">{body}</p>
        </div>
      </div>
    </div>
  );
}

export function CardBasicDemo() {
  return (
    <div className="card overflow-hidden" style={{ width: '20rem' }}>
      <div className="card-img-top">
        <img
          className="img-fluid"
          src="/assets/img/generic/1.jpg"
          alt="Card image cap"
        />
      </div>
      <div className="card-body">
        <h5 className="card-title">Card title</h5>
        <p className="card-text">
          Some quick example text to build on the card title and make up the
          bulk of the card&apos;s content.
        </p>
        <a className="btn btn-primary btn-sm" href="#!">
          Go somewhere
        </a>
      </div>
    </div>
  );
}

export function CardWithImageDemo() {
  return (
    <div className="card overflow-hidden" style={{ width: '20rem' }}>
      <div className="card-img-top">
        <img
          className="img-fluid"
          src="/assets/img/generic/3.jpg"
          alt="Card image cap"
        />
      </div>
      <div className="card-body">
        <h5 className="card-title">Card title</h5>
        <p className="card-text">
          Some quick example text to build on the card title and make up the
          bulk of the card&apos;s content.
        </p>
      </div>
      <ul className="list-group list-group-flush">
        <li className="list-group-item">Cras justo odio</li>
        <li className="list-group-item">Dapibus ac facilisis in</li>
        <li className="list-group-item">Vestibulum at eros</li>
      </ul>
      <div className="card-body">
        <a className="card-link" href="#!">
          Card link
        </a>
        <a className="card-link" href="#!">
          Another link
        </a>
      </div>
    </div>
  );
}

export function CardGroupDemo() {
  return (
    <div className="card-group">
      <div className="card overflow-hidden">
        <div className="card-img-top">
          <img
            className="img-fluid"
            src="/assets/img/generic/10.jpg"
            alt="Card image cap"
          />
        </div>
        <div className="card-body">
          <h5 className="card-title">First card title</h5>
          <p className="card-text">
            This is a wider card with supporting text below as a natural lead-in
            to additional content. This content is a little bit longer.
          </p>
          <p className="card-text">
            <small className="text-muted">Last updated 45 mins ago</small>
          </p>
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="card-img-top">
          <img
            className="img-fluid"
            src="/assets/img/generic/11.jpg"
            alt="Card image cap"
          />
        </div>
        <div className="card-body">
          <h5 className="card-title">Second card title</h5>
          <p className="card-text">
            This card has supporting text below as a natural lead-in to
            additional content.
          </p>
          <p className="card-text">
            <small className="text-muted">Last updated an hour ago</small>
          </p>
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="card-img-top">
          <img
            className="img-fluid"
            src="/assets/img/generic/12.jpg"
            alt="Card image cap"
          />
        </div>
        <div className="card-body">
          <h5 className="card-title">Yet another card title</h5>
          <p className="card-text">
            This is a wider card with supporting text below as a natural lead-in
            to additional content. This card has even longer content than the
            first to show that equal height action.
          </p>
          <p className="card-text">
            <small className="text-muted">Last updated yesterday</small>
          </p>
        </div>
      </div>
    </div>
  );
}

export function CardDeckDemo() {
  return (
    <div className="card-deck">
      <div className="card overflow-hidden">
        <div className="card-img-top">
          <img
            className="img-fluid"
            src="/assets/img/generic/6.jpg"
            alt="Card image cap"
          />
        </div>
        <div className="card-body">
          <h5 className="card-title">Awesome card title</h5>
          <p className="card-text">
            This is a longer card with supporting text below as a natural
            lead-in to additional content. This content is a little bit longer.
          </p>
          <p className="card-text">
            <small className="text-muted">Last updated 22 mins ago</small>
          </p>
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="card-img-top">
          <img
            className="img-fluid"
            src="/assets/img/generic/7.jpg"
            alt="Card image cap"
          />
        </div>
        <div className="card-body">
          <h5 className="card-title">Beautiful card title</h5>
          <p className="card-text">
            This card has supporting text below as a natural lead-in to
            additional content.
          </p>
          <p className="card-text">
            <small className="text-muted">Last updated 3 hours ago</small>
          </p>
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="card-img-top">
          <img
            className="img-fluid"
            src="/assets/img/generic/8.jpg"
            alt="Card image cap"
          />
        </div>
        <div className="card-body">
          <h5 className="card-title">Gorgeous card title</h5>
          <p className="card-text">
            This is a wider card with supporting text below as a natural lead-in
            to additional content. This card has even longer content than the
            first to show that equal height action.
          </p>
          <p className="card-text">
            <small className="text-muted">Last updated on Monday</small>
          </p>
        </div>
      </div>
    </div>
  );
}

export function CardStylesDescription() {
  return (
    <p>
      Cards include various options for customizing their backgrounds, borders,
      and color.
    </p>
  );
}

export function CardStyle({ variant, className }) {
  return (
    <div className={className}>
      <div className="card-body">
        <div className="card-title">{variant} Card</div>
        <p className="card-text">
          Some quick example text to build on the card title and make up the
          bulk of the card&apos;s content.
        </p>
      </div>
    </div>
  );
}

export function CardStyleDemo() {
  const items = [
    { variant: 'Primary', className: 'text-white bg-primary' },
    { variant: 'Secondary', className: 'text-white bg-secondary' },
    { variant: 'Success', className: 'text-white bg-success' },
    { variant: 'Danger', className: 'text-white bg-danger' },
    { variant: 'Warning', className: 'text-white bg-warning' },
    { variant: 'Info', className: 'text-white bg-info' },
    { variant: 'Light', className: 'bg-light' },
    { variant: 'Dark', className: 'text-white bg-dark' }
  ];
  return (
    <div className="row light">
      {items.map(item => (
        <div key={item.variant} className="col-sm-6 col-lg-4 mb-4">
          <CardStyle
            variant={item.variant}
            className={`card ${item.className}`}
          />
        </div>
      ))}
    </div>
  );
}

export function CardBorderDemo() {
  const items = [
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
    <div className="row">
      {items.map(variant => (
        <div key={variant} className="col-sm-6 col-lg-4 mb-4">
          <CardStyle
            variant={`${variant.charAt(0).toUpperCase()}${variant.slice(1)} Border`}
            className={`card border h-100 border-${variant}`}
          />
        </div>
      ))}
    </div>
  );
}
