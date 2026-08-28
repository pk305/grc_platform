export function TypographyFontFamilyDescription() {
  return (
    <p>
      You have three <code>font-family</code> helper classes available to use.
    </p>
  );
}

export function TypographyFontFamilyDemo() {
  return (
    <>
      <div className="font-sans-serif">Poppins</div>
      <div className="font-base">Open Sans</div>
      <code className="text-monospace">Monospace</code>
    </>
  );
}

export function TypographyHeadingDescription() {
  return (
    <p>
      All HTML headings, <code>h1</code> through <code>h6</code>, are available.
    </p>
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

export function TypographyHeadingClassDescription() {
  return (
    <p>
      <code>.h1</code> through <code>.h6</code> classes are also available, for
      when you want to match the font styling of a heading but cannot use the
      associated HTML element.
    </p>
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

export function TypographyCustomizeHeadingDescription() {
  return (
    <p>
      Use the included utility classes to recreate the small secondary heading
      text from Bootstrap 3.
    </p>
  );
}

export function TypographyCustomizeHeadingDemo() {
  return (
    <h3>
      Fancy display heading{' '}
      <small className="text-muted">With faded secondary text</small>
    </h3>
  );
}

export function TypographyFontWeightsDemo() {
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

export function TypographyDisplayHeadingDescription() {
  return (
    <p>
      Traditional heading elements are designed to work best in the meat of your
      page content. When you need a heading to stand out, consider using a{' '}
      <strong>display heading</strong>&mdash;a larger, slightly more opinionated
      heading style.
    </p>
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

export function TypographyColorsDescription() {
  return <p>Use the following colors to change the text color</p>;
}

export function TypographyColorsDemo() {
  return (
    <>
      <h5 className="text-primary">.text-primary</h5>
      <h5 className="text-info">.text-info</h5>
      <h5 className="text-success">.text-success</h5>
      <h5 className="text-warning">.text-warning</h5>
      <h5 className="text-danger">.text-danger</h5>
      <h5 className="text-black">.text-black</h5>
      <h5 className="text-dark">.text-dark</h5>
      <h5 className="text-1000">.text-1000</h5>
      <h5 className="text-900">.text-900</h5>
      <h5 className="text-800">.text-800</h5>
      <h5 className="text-700">.text-700</h5>
      <h5 className="text-600">.text-600</h5>
      <h5 className="text-500">.text-500</h5>
      <h5 className="text-400">.text-400</h5>
      <h5 className="text-300">
        <span className="bg-black">.text-300</span>
      </h5>
      <h5 className="text-200">
        <span className="bg-dark">.text-200</span>
      </h5>
      <h5 className="text-light">
        <span className="bg-1000">.text-light</span>
      </h5>
      <h5 className="text-white">
        <span className="bg-900">.text-white</span>
      </h5>
    </>
  );
}

export function TypographySizeDescription() {
  return (
    <p>
      If you want different sizes of fonts, you may use the following classes.
    </p>
  );
}

export function TypographySizeDemo() {
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

export function TypographyLeadDescription() {
  return (
    <p>
      Make a paragraph stand out by adding <code>.lead</code>
    </p>
  );
}

export function TypographyLeadDemo() {
  return (
    <p className="lead">
      Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor.
      Duis mollis, est non commodo luctus.
    </p>
  );
}

export function TypographyDropcapDescription() {
  return (
    <p>
      Make a paragraph stand out by adding <code>.dropcap</code> class.
    </p>
  );
}

export function TypographyDropcapDemo() {
  return (
    <p className="dropcap">
      Lorem ipsum dolor sit amet consectetur adipisicing elit. Eius porro hic
      ex. Earum similique laudantium esse nostrum sed corporis. Libero omnis
      quos deleniti amet aliquam nam. Natus voluptas reiciendis eligendi
      reprehenderit, facere tenetur distinctio sunt officia, temporibus aperiam
      voluptatum quo ducimus illum incidunt adipisci doloremque rem est magnam
      in, molestiae excepturi odit. Reprehenderit ullam.
    </p>
  );
}

export function TypographyAlignmentDescription() {
  return (
    <p>
      Align terms and descriptions horizontally by using our grid system&apos;s
      predefined classes (or semantic mixins). For longer terms, you can
      optionally add a <code>.text-truncate</code> class to truncate the text
      with an ellipsis.
    </p>
  );
}

export function TypographyAlignmentDemo() {
  return (
    <>
      <dl className="row">
        <dt className="col-sm-3">Description lists</dt>
        <dd className="col-sm-9">
          A description list is perfect for defining terms.
        </dd>
        <dt className="col-sm-3">Euismod</dt>
        <dd className="col-sm-9">
          <p>
            Vestibulum id ligula porta felis euismod semper eget lacinia odio
            sem nec elit.
          </p>
          <p>Donec id elit non mi porta gravida at eget metus.</p>
        </dd>
        <dt className="col-sm-3">Malesuada porta</dt>
        <dd className="col-sm-9">
          Etiam porta sem malesuada magna mollis euismod.
        </dd>
        <dt className="col-sm-3 text-truncate">Truncated term is truncated</dt>
        <dd className="col-sm-9">
          Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum
          nibh, ut fermentum massa justo sit amet risus.
        </dd>
        <dt className="col-sm-3">Nesting</dt>
        <dd className="col-sm-9" />
      </dl>
      <dl className="row">
        <dt className="col-sm-4">Nested definition list</dt>
        <dd className="col-sm-8">
          Aenean posuere, tortor sed cursus feugiat, nunc augue blandit nunc.
        </dd>
      </dl>
    </>
  );
}

export function TextTransformationDescription() {
  return <p>Transform text in components with text capitalization classes.</p>;
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
