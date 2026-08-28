export function GridOptionsDescription() {
  return (
    <p>
      While Bootstrap uses <code>.col-</code>, <code>.col-sm-</code>,{' '}
      <code>.col-md-</code>, <code>.col-lg-</code> and <code>.col-xl-</code>, we
      introduced a new breakpoint, <code>.col-xxl-</code> for the massive screen
      size.
    </p>
  );
}

export function GridTable() {
  return (
    <div className="table-responsive">
      <table className="table table-bordered table-striped mb-0">
        <thead>
          <tr>
            <th />
            <th className="text-center">
              Extra small
              <br />
              <small>&lt;576px</small>
            </th>
            <th className="text-center">
              Small
              <br />
              <small>&ge;576px</small>
            </th>
            <th className="text-center">
              Medium
              <br />
              <small>&ge;768px</small>
            </th>
            <th className="text-center">
              Large
              <br />
              <small>&ge;992px</small>
            </th>
            <th className="text-center">
              Extra large
              <br />
              <small>&ge;1200px</small>
            </th>
            <th className="text-center">
              Massive
              <br />
              <small>&ge;1400px</small>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th className="text-nowrap" scope="row">
              Max container width
            </th>
            <td>None (auto)</td>
            <td>540px</td>
            <td>720px</td>
            <td>960px</td>
            <td>1140px</td>
            <td>1320px</td>
          </tr>
          <tr>
            <th className="text-nowrap" scope="row">
              Class prefix
            </th>
            <td>
              <code>.col-</code>
            </td>
            <td>
              <code>.col-sm-</code>
            </td>
            <td>
              <code>.col-md-</code>
            </td>
            <td>
              <code>.col-lg-</code>
            </td>
            <td>
              <code>.col-xl-</code>
            </td>
            <td>
              <code>.col-xxl-</code>
            </td>
          </tr>
          <tr>
            <th className="text-nowrap" scope="row">
              # of columns
            </th>
            <td colSpan={6}>12</td>
          </tr>
          <tr>
            <th className="text-nowrap" scope="row">
              Gutter width
            </th>
            <td colSpan={6}>30px (15px on each side of a column)</td>
          </tr>
          <tr>
            <th className="text-nowrap" scope="row">
              Nestable
            </th>
            <td colSpan={6}>Yes</td>
          </tr>
          <tr>
            <th className="text-nowrap" scope="row">
              Column ordering
            </th>
            <td colSpan={6}>Yes</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
