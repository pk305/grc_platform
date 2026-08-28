export function InteractionsTextSelection() {
  return (
    <>
      <p className="user-select-all">
        This paragraph will be entirely selected when clicked by the user.
      </p>
      <p className="user-select-auto">
        This paragraph has default select behavior.
      </p>
      <p className="user-select-none">
        This paragraph will not be selectable when clicked by the user.
      </p>
    </>
  );
}

export function InteractionsPointerEvents() {
  return (
    <>
      <p>
        <a className="pe-none" href="#" tabIndex={-1} aria-disabled="true">
          This link
        </a>{' '}
        can not be clicked.
      </p>
      <p>
        <a className="pe-auto" href="#">
          This link
        </a>{' '}
        can be clicked (this is default behavior).
      </p>
      <p className="pe-none">
        <a href="#" tabIndex={-1} aria-disabled="true">
          This link
        </a>{' '}
        can not be clicked because the <code>pointer-events</code> property is
        inherited from its parent. However,{' '}
        <a className="pe-auto" href="#">
          this link
        </a>{' '}
        has a <code>pe-auto</code> class and can be clicked.
      </p>
    </>
  );
}
