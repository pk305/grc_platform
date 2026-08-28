export function SpacingDocHeaderDescription() {
  return (
    <p>
      Spacing utilities that apply to all breakpoints, from <code>xs</code> to{' '}
      <code>xxl</code>, have no breakpoint abbreviation in them. This is because
      those classes are applied from <code>min-width: 0</code> and up, and thus
      are not bound by a media query. The remaining breakpoints, however, do
      include a breakpoint abbreviation.
    </p>
  );
}

export function SpacingDoc() {
  return (
    <>
      <p>
        Spacing utilities that apply to all breakpoints, from <code>xs</code> to{' '}
        <code>xxl</code>, have no breakpoint abbreviation in them. This is
        because those classes are applied from <code>min-width: 0</code> and up,
        and thus are not bound by a media query. The remaining breakpoints,
        however, do include a breakpoint abbreviation.
      </p>
      <p>
        The classes are named using the format{' '}
        <code>{'{property}{sides}-{size}'}</code> for <code>xs</code> and{' '}
        <code>{'{property}{sides}-{breakpoint}-{size}'}</code> for{' '}
        <code>sm</code>, <code>md</code>, <code>lg</code>, <code>xl</code> and{' '}
        <code>xxl</code>.
      </p>
      <p className="mb-0">
        Where <em>property</em> is one of:
      </p>
      <ul>
        <li>
          <code>m</code> - for classes that set <code>margin</code>
        </li>
        <li>
          <code>p</code> - for classes that set <code>padding</code>
        </li>
      </ul>
      <p className="mb-0">
        Where <em>sides</em> is one of:
      </p>
      <ul>
        <li>
          <code>t</code> - for classes that set <code>margin-top</code> or{' '}
          <code>padding-top</code>
        </li>
        <li>
          <code>b</code> - for classes that set <code>margin-bottom</code> or{' '}
          <code>padding-bottom</code>
        </li>
        <li>
          <code>s</code> - for classes that set <code>margin-left</code> or{' '}
          <code>padding-left</code>
        </li>
        <li>
          <code>e</code> - for classes that set <code>margin-right</code> or{' '}
          <code>padding-right</code>
        </li>
        <li>
          <code>x</code> - for classes that set both <code>*-left</code> and{' '}
          <code>*-right</code>
        </li>
        <li>
          <code>y</code> - for classes that set both <code>*-top</code> and{' '}
          <code>*-bottom</code>
        </li>
        <li>
          blank - for classes that set a <code>margin</code> or{' '}
          <code>padding</code> on all 4 sides of the element
        </li>
      </ul>
      <p className="mb-0">
        Where <em>size</em> is one of: <code>0</code>, <code>1</code>,{' '}
        <code>2</code>, <code>3</code>, <code>4</code>, <code>5</code>,{' '}
        <code>6</code>, <code>7</code>, <code>8</code>, <code>9</code>,{' '}
        <code>10</code>, <code>11</code> &amp; <code>auto</code>
      </p>
    </>
  );
}

export function GapDoc() {
  return (
    <div className="d-grid gap-3">
      <div className="p-2 bg-light border">Grid item 1</div>
      <div className="p-2 bg-light border">Grid item 2</div>
      <div className="p-2 bg-light border">Grid item 3</div>
    </div>
  );
}

export function SpacingExample() {
  return (
    <pre>
      <code>
        {`.mt-0 {
  margin-top: 0 !important;
}

.ms-1 {
  margin-left: ($spacer * .25) !important;
}

.px-2 {
  padding-left: ($spacer * .5) !important;
  padding-right: ($spacer * .5) !important;
}

.p-3 {
  padding: $spacer !important;
}`}
      </code>
    </pre>
  );
}

export function SpacingHorizontalCentering() {
  return (
    <div className="mx-auto bg-100" style={{ width: '200px' }}>
      Centered element
    </div>
  );
}

export function SpacingNegativeMargin() {
  return (
    <pre>
      <code>
        {`.mt-n1 {
  margin-top: -0.25rem !important;
}`}
      </code>
    </pre>
  );
}
