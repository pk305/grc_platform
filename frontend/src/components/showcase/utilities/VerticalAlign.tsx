export function VerticalAlignExampleDemo() {
  return (
    <>
      <span className="align-baseline">baseline</span>
      <span className="align-top">top</span>
      <span className="align-middle">middle</span>
      <span className="align-bottom">bottom</span>
      <span className="align-text-top">text-top</span>
      <span className="align-text-bottom">text-bottom</span>
    </>
  );
}

export function VerticalAlignExampleTable() {
  return (
    <div className="table-responsive">
      <table className="table table-bordered" style={{ height: '100px' }}>
        <tbody>
          <tr>
            <td className="align-baseline">baseline</td>
            <td className="align-top">top</td>
            <td className="align-middle">middle</td>
            <td className="align-bottom">bottom</td>
            <td className="align-text-top">text-top</td>
            <td className="align-text-bottom">text-bottom</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
