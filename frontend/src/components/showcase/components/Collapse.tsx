export function CollapseExampleDemo() {
  return (
    <>
      <p>
        <a
          className="btn btn-phoenix-secondary mt-2"
          data-bs-toggle="collapse"
          href="#collapseExample"
          role="button"
          aria-expanded="false"
          aria-controls="collapseExample"
        >
          Link with href
        </a>
        <button
          className="btn btn-phoenix-secondary ms-sm-2 mt-2"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#collapseExample"
          aria-expanded="false"
          aria-controls="collapseExample"
        >
          Button with data-bs-target
        </button>
      </p>
      <div id="collapseExample" className="collapse">
        <div className="border p-3 rounded">
          Anim pariatur cliche reprehenderit, enim eiusmod high life accusamus
          terry richardson ad squid. Nihil anim keffiyeh helvetica, craft beer
          labore wes anderson cred nesciunt sapiente ea proident.
        </div>
      </div>
    </>
  );
}

export function MultipleTargetsDescription() {
  return (
    <p>
      A <code>button</code> or <code>a</code> can show and hide multiple
      elements by referencing them with a selector in its <code>href</code> or{' '}
      <code>data-bs-target</code> attribute.
    </p>
  );
}

export function MultipleTargetsDemo() {
  return (
    <>
      <p>
        <a
          className="btn btn-phoenix-secondary mt-2 me-2"
          data-bs-toggle="collapse"
          href="#multiCollapseExample1"
          role="button"
          aria-expanded="false"
          aria-controls="multiCollapseExample1"
        >
          Toggle first element
        </a>
        <button
          className="btn btn-phoenix-secondary mt-2 me-2"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#multiCollapseExample2"
          aria-expanded="false"
          aria-controls="multiCollapseExample2"
        >
          Toggle second element
        </button>
        <button
          className="btn btn-phoenix-secondary mt-2"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target=".multi-collapse"
          aria-expanded="false"
          aria-controls="multiCollapseExample1 multiCollapseExample2"
        >
          Toggle both elements
        </button>
      </p>
      <div className="row">
        <div className="col-sm-6">
          <div
            id="multiCollapseExample1"
            className="collapse multi-collapse mb-3 mb-sm-0"
          >
            <div className="card border">
              <div className="card-body">
                Anim pariatur cliche reprehenderit, enim eiusmod high life
                accusamus terry richardson ad squid. Nihil anim keffiyeh
                helvetica, craft beer labore wes anderson cred nesciunt sapiente
                ea proident.
              </div>
            </div>
          </div>
        </div>
        <div className="col-sm-6">
          <div id="multiCollapseExample2" className="collapse multi-collapse">
            <div className="card border">
              <div className="card-body">
                Anim pariatur cliche reprehenderit, enim eiusmod high life
                accusamus terry richardson ad squid. Nihil anim keffiyeh
                helvetica, craft beer labore wes anderson cred nesciunt sapiente
                ea proident.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
