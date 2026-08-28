import { colors } from '@/lib/theme-colors';

export function SpinnerBasicExampleDemo() {
  return (
    <div className="spinner-border" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  );
}

export function SpinnerColorsDemo() {
  return (
    <>
      {colors.map(val => (
        <div key={val} className={`spinner-border text-${val}`} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      ))}
    </>
  );
}

export function SpinnerGrowingDemo() {
  return (
    <div className="spinner-grow" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  );
}

export function SpinnerGrowingColorDemo() {
  return (
    <>
      {colors.map(val => (
        <div key={val} className={`spinner-grow text-${val}`} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      ))}
    </>
  );
}

export function SpinnerSizeDemo() {
  return (
    <>
      <div className="spinner-border spinner-border-sm" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      <div className="spinner-border" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      <div className="spinner-grow spinner-grow-sm" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      <div className="spinner-grow" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </>
  );
}

export function SpinnerButtonDemo() {
  return (
    <>
      <button className="btn btn-primary me-1" type="button" disabled>
        <span
          className="spinner-border spinner-border-sm"
          role="status"
          aria-hidden="true"
        />
        <span className="visually-hidden">Loading...</span>
      </button>
      <button className="btn btn-primary" type="button" disabled>
        <span
          className="spinner-border spinner-border-sm"
          role="status"
          aria-hidden="true"
        />{' '}
        Loading...
      </button>
    </>
  );
}
