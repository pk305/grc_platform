export function TextTrunCationExampleDescription() {
  return (
    <p>
      For longer content, you can add a <code>.text-truncate</code> class to
      truncate the text with an ellipsis.{' '}
      <strong>
        Requires <code>display: inline-block</code> or{' '}
        <code>display: block</code>.
      </strong>
    </p>
  );
}

export function TextTruncationExampleDemo() {
  return (
    <>
      <div className="row">
        <div className="col-2 text-truncate">
          Truncate your long text with bootstrap text trancation featuer
        </div>
      </div>
      <span
        className="d-inline-block text-truncate"
        style={{ maxWidth: '150px' }}
      >
        Truncate your long text with bootstrap text trancation featuer.
      </span>
    </>
  );
}
