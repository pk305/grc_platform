export function StretchedLinkExampleDescription() {
  return (
    <>
      <p>
        Add <code>.stretched-link</code> to a link to make its containing block
        clickable via a <code>::after</code> pseudo element. In most cases, this
        means that an element with <code>position: relative;</code> that
        contains a link with the <code>.stretched-link</code> class is
        clickable.
      </p>
      <p>
        Cards have <code>position: relative</code> by default in Bootstrap, so
        in this case you can safely add the <code>.stretched-link</code> class
        to a link in the card without any other HTML changes.
      </p>
      <p className="mb-0">
        Multiple links and tap targets are not recommended with stretched links.
        However, some <code>position</code> and <code>z-index</code> styles can
        help should this be required.
      </p>
    </>
  );
}

export function StretchedLinkExampleDemo() {
  return (
    <div className="card" style={{ width: '18rem' }}>
      <img className="card-img-top" src="/assets/img/generic/1.jpg" alt="..." />
      <div className="card-body">
        <h5 className="card-title">Card with stretched link</h5>
        <p className="card-text">
          Some quick example text to build on the card title and make up the
          bulk of the card&apos;s content.
        </p>
        <a className="btn btn-primary stretched-link" href="#">
          Go somewhere
        </a>
      </div>
    </div>
  );
}

export function StretchedLinkContainingBlockHeader() {
  return (
    <>
      <h5 data-anchor>Identifying the containing block</h5>
      <p>
        If the stretched link doesn&apos;t seem to work, the{' '}
        <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Containing_block#Identifying_the_containing_block">
          containing block
        </a>{' '}
        will probably be the cause. The following CSS properties will make an
        element the containing block:
      </p>
      <ul className="mb-0">
        <li>
          A <code>position</code> value other than <code>static</code>
        </li>
        <li>
          A <code>transform</code> or <code>perspective</code> value other than{' '}
          <code>none</code>
        </li>
        <li>
          A <code>will-change</code> value of <code>transform</code> or{' '}
          <code>perspective</code>
        </li>
        <li>
          A <code>filter</code> value other than <code>none</code> or a{' '}
          <code>will-change</code> value of <code>filter</code> (only works on
          Firefox)
        </li>
      </ul>
    </>
  );
}

export function StretchedLinkContainingBlockDemo() {
  return (
    <div className="card shadow-lg" style={{ width: '18rem' }}>
      <img className="card-img-top" src="/assets/img/generic/2.jpg" alt="..." />
      <div className="card-body">
        <h6 className="card-title fs-3">Card with stretched links</h6>
        <p className="card-text">
          Some quick example text to build on the card title and make up the
          bulk of the card&apos;s content.
        </p>
        <p className="card-text">
          <a
            className="stretched-link text-info"
            href="#"
            style={{ position: 'relative' }}
          >
            Stretched link will not work here, because{' '}
            <code className="text-danger">position: relative</code> is added to
            the link
          </a>
        </p>
        <p className="card-text bg-light" style={{ transform: 'rotate(0)' }}>
          This{' '}
          <a className="text-warning stretched-link" href="#">
            stretched link
          </a>{' '}
          will only be spread over the <code>p</code>-tag, because a transform
          is applied to it.
        </p>
      </div>
    </div>
  );
}
