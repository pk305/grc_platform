import { siteConfig } from '@/lib/site-config';

export function PositionCenterElementsDemo() {
  return (
    <div className="position-relative bg-200" style={{ height: '200px' }}>
      <div className="light p-3 bg-900 rounded-1 position-absolute top-0 start-50 translate-middle-x" />
      <div className="light p-3 bg-900 rounded-1 position-absolute top-50 start-0 translate-middle-y" />
      <div className="light p-3 bg-900 rounded-1 position-absolute top-50 start-50 translate-middle" />
      <div className="light p-3 bg-900 rounded-1 position-absolute top-50 end-0 translate-middle-y" />
      <div className="light p-3 bg-900 rounded-1 position-absolute bottom-0 start-50 translate-middle-x" />
    </div>
  );
}

export function PositionCenterElementsDescription() {
  return (
    <p>
      In addition, you can also center the elements with the transform utility
      classes <code>.translate-middle</code>, <code>.translate-middle-x</code>,{' '}
      <code>.translate-middle-y</code>. Responsive variations also exist for{' '}
      <code>transform-middle</code>, For example:{' '}
      <code>{'transform-{xxl|xl|lg|md|sm}-middle-{x|y}'}</code>.
    </p>
  );
}

export function PositionArrangeElementsDescription() {
  return (
    <p>
      Arrange elements easily with the edge positioning utilities. The format is{' '}
      <code>{'{property}-{position}.'}</code> {siteConfig.name} has special
      utility class <code>.all-0</code> to give full height/width to child
      element of parent element.
    </p>
  );
}

export function PositionArrangeElementsDemo() {
  return (
    <>
      <div
        className="position-relative bg-200 mb-4"
        style={{ height: '200px' }}
      >
        <div className="light p-3 bg-900 rounded-1 position-absolute top-0 start-0" />
        <div className="light p-3 bg-900 rounded-1 position-absolute top-0 end-0" />
        <div className="light p-3 bg-900 rounded-1 position-absolute top-50 start-50" />
        <div className="light p-3 bg-900 rounded-1 position-absolute bottom-50 end-50" />
        <div className="light p-3 bg-900 rounded-1 position-absolute bottom-0 start-0" />
        <div className="light p-3 bg-900 rounded-1 position-absolute bottom-0 end-0" />
      </div>
      <div
        className="position-relative light"
        style={{ height: '100px', width: '100px' }}
      >
        <div className="bg-900 rounded-1 text-white d-flex flex-center position-absolute all-0">
          .all-0
        </div>
      </div>
    </>
  );
}

export function PositionCommonValuesDescription() {
  return (
    <>
      <p className="mb-2">
        Quick positioning classes are available, though they responsive.
      </p>
      <p className="mb-0">
        The classes are named using the format{' '}
        <code>position-{'{option}'}</code> for <code>xs</code> and{' '}
        <code>
          position-{'{breakpoint}'}-{'{option}'}
        </code>{' '}
        for <code>sm</code>, <code>md</code>, <code>lg,</code> <code>xl</code>,
        and <code>xxl</code>.
      </p>
    </>
  );
}

export function PositionDemo() {
  return (
    <pre className="rounded-3">
      <code className="lang-css">
        {`.position-static
.position-relative
.position-absolute
.position-sticky
.fixed-top
.fixed-bottom`}
      </code>
    </pre>
  );
}
