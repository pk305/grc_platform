export function FloatHeaderDescription() {
  return (
    <>
      <p>
        These utility classes float an element to the left or right, or disable
        floating, based on the current viewport size using the{' '}
        <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/float">
          CSS <code>float</code> property
        </a>
        . <code>!important</code> is included to avoid specificity issues. These
        use the same viewport breakpoints as our grid system. Please be aware
        float utilities have no effect on flex items.
      </p>
      <p className="mb-0">
        The classes are named using the format <code>float-{'{option}'}</code>{' '}
        for <code>xs</code> and{' '}
        <code>
          float-{'{breakpoint}'}-{'{option}'}
        </code>{' '}
        for <code>sm</code>, <code>md</code>, <code>lg,</code> <code>xl</code>,
        and <code>xxl</code>.
      </p>
    </>
  );
}

export function FloatDemo() {
  return (
    <>
      <div className="float-start">Float left on all viewport sizes</div>
      <br />
      <div className="float-end">Float right on all viewport sizes</div>
      <br />
      <div className="float-none">Don&apos;t float on all viewport sizes</div>
    </>
  );
}

export function FloatResponsiveDemo() {
  return (
    <>
      <div className="float-sm-start">
        Float start on viewports sized SM (small) or wider
      </div>
      <br />
      <div className="float-md-start">
        Float start on viewports sized MD (medium) or wider
      </div>
      <br />
      <div className="float-lg-start">
        Float start on viewports sized LG (large) or wider
      </div>
      <br />
      <div className="float-xl-start">
        Float start on viewports sized XL (extra-large) or wider
      </div>
      <br />
    </>
  );
}
