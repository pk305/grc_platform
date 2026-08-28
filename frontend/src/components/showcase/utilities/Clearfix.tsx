export function Clearfix() {
  return (
    <div className="bg-primary progress-bar-striped clearfix">
      <button className="btn btn-secondary float-start" type="button">
        Example Button floated left
      </button>
      <button className="btn btn-secondary float-end" type="button">
        Example Button floated right
      </button>
    </div>
  );
}

export function ClearfixExampleDescription() {
  return (
    <p>
      Easily clear floats by adding <code>.clearfix</code> to the parent
      element. Can also be used as a mixin.
    </p>
  );
}

export function ClearfixDemoDescription() {
  return (
    <p>
      The following example shows how the clearfix can be used. Without the
      clearfix the wrapping div would not span around the buttons which would
      cause a broken layout.
    </p>
  );
}
