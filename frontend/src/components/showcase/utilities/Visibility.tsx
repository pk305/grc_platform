export function VisibilityExampleDescription() {
  return (
    <>
      <p className="mt-2">
        Set the <code>visibility</code> of elements with our visibility
        utilities. These utility classes do not modify the display value at all
        and do not affect layout &ndash; .invisible elements still take up space
        in the page. Content will be hidden both visually and for assistive
        technology/screen reader users.
      </p>
      <p className="mb-0">
        Apply <code>.visible</code> or <code>.invisible</code> as needed.
      </p>
    </>
  );
}

export function VisibilityExampleDemo() {
  return (
    <>
      <div className="visible">Visible element</div>
      <div className="invisible">Invisible element</div>
    </>
  );
}
