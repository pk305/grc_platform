import { CardBasicDemo } from './Card';

export function PlaceholeHolderExample() {
  return (
    <div className="d-flex justify-content-center">
      <CardBasicDemo />
      <div
        className="card overflow-hidden ms-3"
        style={{ width: '20rem' }}
        aria-hidden="true"
      >
        <div
          className="card-img-top"
          style={{ width: '320px', height: '180px' }}
        >
          <span className="placeholder w-100 h-100" />
        </div>
        <div className="card-body">
          <h5 className="card-title placeholder-glow">
            <span className="placeholder col-6" />
          </h5>
          <p className="card-text placeholder-glow">
            <span className="placeholder col-7" />
            <span className="placeholder col-4" />
            <span className="placeholder col-4" />
            <span className="placeholder col-6" />
            <span className="placeholder col-8" />
          </p>
          <a
            className="btn btn-primary disabled placeholder col-6"
            href="#"
            tabIndex={-1}
          />
        </div>
      </div>
    </div>
  );
}

export function PlaceholderWidth() {
  return (
    <>
      <span className="placeholder col-6" />
      <span className="placeholder w-75" />
      <span className="placeholder" style={{ width: '25%' }} />
    </>
  );
}

export function PlaceholderColor() {
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
    <>
      {variants.map(variant => (
        <span key={variant} className={`placeholder col-12 bg-${variant}`} />
      ))}
    </>
  );
}

export function PlaceholderSizing() {
  return (
    <>
      <span className="placeholder col-12 placeholder-lg" />
      <span className="placeholder col-12" />
      <span className="placeholder col-12 placeholder-sm" />
      <span className="placeholder col-12 placeholder-xs" />
    </>
  );
}

export function PlaceholderAnimation() {
  return (
    <>
      <p className="placeholder-glow">
        <span className="placeholder col-12" />
      </p>
      <p className="placeholder-wave">
        <span className="placeholder col-12" />
      </p>
    </>
  );
}
