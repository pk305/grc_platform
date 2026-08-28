const dims = { width: '200px', height: '100px' };

export function OverflowExample() {
  return (
    <div className="d-flex">
      <div className="overflow-auto border me-2" style={dims}>
        This is an example of using <code>.overflow-auto</code> on an element
        with set width and height dimensions. By design, this content will
        vertically scroll.
      </div>
      <div className="overflow-hidden border me-2" style={dims}>
        This is an example of using <code>.overflow-hidden</code> on an element
        with set width and height dimensions. By design, this content will
        vertically scroll.
      </div>
      <div className="overflow-visible border me-2" style={dims}>
        This is an example of using <code>.overflow-visible</code> on an element
        with set width and height dimensions. By design, this content will
        vertically scroll.
      </div>
      <div className="overflow-scroll border" style={dims}>
        This is an example of using <code>.overflow-scroll</code> on an element
        with set width and height dimensions. By design, this content will
        vertically scroll.
      </div>
    </div>
  );
}
