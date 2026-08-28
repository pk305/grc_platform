export function TextAlignmentDemo() {
  return (
    <>
      <p className="text-start">Start aligned text on all viewport sizes.</p>
      <p className="text-center">Center aligned text on all viewport sizes.</p>
      <p className="text-end">End aligned text on all viewport sizes.</p>
      <p className="text-sm-start">
        Start aligned text on viewports sized SM (small) or wider.
      </p>
      <p className="text-md-start">
        Start aligned text on viewports sized MD (medium) or wider.
      </p>
      <p className="text-lg-start">
        Start aligned text on viewports sized LG (large) or wider.
      </p>
      <p className="text-xl-start">
        Start aligned text on viewports sized XL (extra-large) or wider.
      </p>
    </>
  );
}

export function TextWrappingOverflowDemo() {
  return (
    <>
      <div
        className="badge bg-primary text-wrap mb-3"
        style={{ width: '6rem' }}
      >
        This text should wrap.
      </div>
      <div className="text-nowrap bg-300" style={{ width: '8rem' }}>
        This text should overflow the parent.
      </div>
    </>
  );
}

export function WordBreakDemo() {
  return (
    <p className="text-break">
      mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm
    </p>
  );
}

export function TextTransformationDemo() {
  return (
    <>
      <p className="text-lowercase">Lowercased text.</p>
      <p className="text-uppercase">Uppercased text.</p>
      <p className="text-capitalize">CapiTaliZed text.</p>
    </>
  );
}

export function FontSizeDemo() {
  const sizes = ['-2', '-1', '0', '1', '2', '3', '4', '5', '6', '7', '8'];
  return (
    <>
      {sizes.map(size => (
        <h6 key={size} className={`fs-${size}`}>
          .fs-{size}
        </h6>
      ))}
      <div className="mt-3">
        <h6 className="fs-sm-0">.fs-sm-0</h6>
        <h6 className="fs-md-1">.fs-md-1</h6>
        <h6 className="fs-lg-2">.fs-lg-2</h6>
        <h6 className="fs-xl-3">.fs-xl-3</h6>
      </div>
    </>
  );
}

export function FontWeightDemo() {
  return (
    <>
      <div className="fw-light">Font weight 300</div>
      <div className="fw-normal">Font weight 400</div>
      <div className="fw-medium">Font weight 500</div>
      <div className="fw-semi-bold">Font weight 600</div>
      <div className="fw-bold">Font weight 700</div>
      <div className="fw-bolder">Font weight 800</div>
      <div className="fw-black">Font weight 900</div>
    </>
  );
}

const LH_TEXT =
  'This is a long paragraph written to show how the line-height of an element is affected by our utilities. Classes are applied to the element itself or sometimes the parent element. These classes can be customized as needed with our utility API.';

export function LineHeightDemo() {
  return (
    <>
      <p className="lh-1">{LH_TEXT}</p>
      <p className="lh-sm">{LH_TEXT}</p>
      <p className="lh-base">{LH_TEXT}</p>
      <p className="lh-lg">{LH_TEXT}</p>
    </>
  );
}

export function FontFamilyDemo() {
  return (
    <>
      <div className="font-sans-serif">Nunit sans</div>
      <div className="font-base">Open Sans</div>
      <code className="text-monospace">Monospace</code>
    </>
  );
}

export function ResetColorDemo() {
  return (
    <p className="text-muted">
      Muted text with a{' '}
      <a className="text-reset" href="#">
        reset link
      </a>
      .
    </p>
  );
}

export function TextDecorationDemo() {
  return (
    <>
      <p className="text-decoration-underline">
        This text has a line underneath it.
      </p>
      <p className="text-decoration-line-through">
        This text has a line going through it.
      </p>
      <a className="text-decoration-none" href="#">
        This link has its text decoration removed
      </a>
    </>
  );
}

export function TypographyHeadingDemo() {
  return (
    <>
      <h1>h1. Heading</h1>
      <h2>h2. Heading</h2>
      <h3>h3. Heading</h3>
      <h4>h4. Heading</h4>
      <h5>h5. Heading</h5>
      <h6>h6. Heading</h6>
    </>
  );
}

export function TypographyHeadingClassDemo() {
  return (
    <>
      <p className="h1">h1. Heading</p>
      <p className="h2">h2. Heading</p>
      <p className="h3">h3. Heading</p>
      <p className="h4">h4. Heading</p>
      <p className="h5">h5. Heading</p>
      <p className="h6">h6. Heading</p>
    </>
  );
}

export function TypographyDisplayHeadingDemo() {
  return (
    <>
      <h1 className="display-1 mb-3">Display 1</h1>
      <h1 className="display-2 mb-3">Display 2</h1>
      <h1 className="display-3 mb-3">Display 3</h1>
      <h1 className="display-4 mb-3">Display 4</h1>
      <h1 className="display-5 mb-3">Display 5</h1>
      <h1 className="display-6 mb-3">Display 6</h1>
    </>
  );
}
