export function DisplayProperty() {
  return (
    <>
      <p>
        Display utility classes that apply to all breakpoints, from{' '}
        <code>xs</code> to <code>xl</code>, have no breakpoint abbreviation in
        them. This is because those classes are applied from{' '}
        <code>min-width: 0;</code> and up, and thus are not bound by a media
        query. The remaining breakpoints, however, do include a breakpoint
        abbreviation.
      </p>
      <p className="mt-3">As such, the classes are named using the format:</p>
      <ul>
        <li>
          <code>.d-{'{value}'}</code> for <code>xs</code>
        </li>
        <li>
          <code>
            .d-{'{breakpoint}'}-{'{value}'}
          </code>{' '}
          for <code>sm</code>, <code>md</code>, <code>lg</code>, and{' '}
          <code>xl</code>,
        </li>
      </ul>
      <p className="mt-3">Where value is one of:</p>
      <ul>
        <li>
          <code>none</code>
        </li>
        <li>
          <code>inline</code>
        </li>
        <li>
          <code>inline-block</code>
        </li>
        <li>
          <code>block</code>
        </li>
        <li>
          <code>table</code>
        </li>
        <li>
          <code>table-cell</code>
        </li>
        <li>
          <code>table-row</code>
        </li>
        <li>
          <code>flex</code>
        </li>
        <li>
          <code>inline-flex</code>
        </li>
      </ul>
      <p>
        The display values can be altered by changing the <code>$displays</code>{' '}
        variable and recompiling the SCSS.
      </p>
      <p>
        The media queries effect screen widths with the given breakpoint or
        larger. For example, <code>.d-lg-none</code> sets{' '}
        <code>display: none;</code> on both <code>lg</code> and <code>xl</code>{' '}
        screens.
      </p>
    </>
  );
}

export function DisplayInHide() {
  const rows = [
    ['Hidden on all', '.d-none'],
    ['Hidden only on xs', '.d-none .d-sm-block'],
    ['Hidden only on sm', '.d-sm-none .d-md-block'],
    ['Hidden only on md', '.d-md-none .d-lg-block'],
    ['Hidden only on lg', '.d-lg-none .d-xl-block'],
    ['Hidden only on xl', '.d-xl-none'],
    ['Visible on all', '.d-block'],
    ['Visible only on xs', '.d-block .d-sm-none'],
    ['Visible only on sm', '.d-none .d-sm-block .d-md-none'],
    ['Visible only on md', '.d-none .d-md-block .d-lg-none'],
    ['Visible only on lg', '.d-none .d-lg-block .d-xl-none'],
    ['Visible only on xl', '.d-none .d-xl-block']
  ];
  return (
    <>
      <p>
        For faster mobile-friendly development, use responsive display classes
        for showing and hiding elements by device. Avoid creating entirely
        different versions of the same site, instead hide elements responsively
        for each screen size.
      </p>
      <p>
        To hide elements simply use the <code>.d-none</code> class or one of the{' '}
        <code>.d-{'{sm,md,lg,xl}'}-none</code> classes for any responsive screen
        variation.
      </p>
      <p>
        To show an element only on a given interval of screen sizes you can
        combine one <code>.d-*-none class</code> with a{' '}
        <code>.d-*-* class</code>, for example{' '}
        <code>.d-none .d-md-block .d-xl-none</code> will hide the element for
        all screen sizes except on medium and large devices.
      </p>
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Screen Size</th>
            <th>Class</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, cls]) => (
            <tr key={label}>
              <td>{label}</td>
              <td>
                <code>{cls}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export function DisplayPrintDescription() {
  const classes = [
    '.d-print-none',
    '.d-print-inline',
    '.d-print-inline-block',
    '.d-print-block',
    '.d-print-table',
    '.d-print-table-row',
    '.d-print-table-cell',
    '.d-print-flex',
    '.d-print-inline-flex'
  ];
  return (
    <>
      <p>
        Change the <code>display</code> value of elements when printing with our
        print display utility classes. Includes support for the same{' '}
        <code>display</code> values as our responsive{' '}
        <code>.d-* utilities.</code>
      </p>
      <ul>
        {classes.map(cls => (
          <li key={cls}>
            <code>{cls}</code>
          </li>
        ))}
      </ul>
      <p className="mb-0">The print and display classes can be combined.</p>
    </>
  );
}

export function DisplayBasicExample() {
  return (
    <>
      <div className="d-inline bg-primary p-2 text-white">d-inline</div>
      <div className="d-block bg-primary p-2 text-white mt-3">d-block</div>
    </>
  );
}

export function DisplayPrintDemo() {
  return (
    <>
      <div className="d-print-none">Screen Only (Hide on print only)</div>
      <div className="d-none d-print-block">
        Print Only (Hide on screen only)
      </div>
      <div className="d-none d-lg-block d-print-block">
        Hide up to large on screen, but always show on print
      </div>
    </>
  );
}
