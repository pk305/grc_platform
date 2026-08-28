export function FlexBasic() {
  return (
    <>
      <div className="d-flex p-2 bg-200 mb-2">Flexbox container!</div>
      <div className="d-inline-flex p-2 bg-200">Inline flexbox container!</div>
    </>
  );
}

export function FlexBehaviorsDescription() {
  return (
    <p>
      Apply <code>display</code> utilities to create a flexbox container and
      transform direct children elements into flex items. Flex containers and
      items are able to be modified further with additional flex properties.
    </p>
  );
}

export function FlexDirectionDescription() {
  return (
    <p>
      Use <code>.flex-row</code> to set a horizontal direction (the browser
      default), or .flex-row-reverse to start the horizontal direction from the
      opposite side.
    </p>
  );
}

export function FlexJustifyContentDescription() {
  return (
    <p>
      Use <code>justify-content</code> utilities on flexbox containers to change
      the alignment of flex items on the main axis (the x-axis to start, y-axis
      if <code>flex-direction: column</code>). Choose from start (browser
      default), <code>end</code>, <code>center</code>, <code>between</code>, or{' '}
      <code>around.</code>
    </p>
  );
}

export function FlexDirection({ className }) {
  return (
    <div className={`d-flex bg-200 mb-3 ${className || ''}`.trim()}>
      <div className="p-2 bg-300 border border-400">Flex item 1</div>
      <div className="p-2 bg-300 border border-400">Flex item 2</div>
      <div className="p-2 bg-300 border border-400">Flex item 3</div>
    </div>
  );
}

export function FlexJustifyContent() {
  const variants = ['start', 'end', 'center', 'between', 'around'];
  return (
    <>
      {variants.map(variant => (
        <div
          key={variant}
          className={`d-flex justify-content-${variant} bg-200 mb-2`}
        >
          <div className="p-2 bg-300 border border-400">Flex Item</div>
        </div>
      ))}
    </>
  );
}

export function FlexAlignItemDescription() {
  return (
    <>
      <h5 data-anchor>With align items</h5>
      <p>
        Vertically move one flex item to the top or bottom of a container by
        mixing <code>align-items</code>, <code>flex-direction: column</code>,
        and <code>margin-top: auto or margin-bottom: auto.</code>
      </p>
    </>
  );
}

export function FlexAlignItem() {
  const variants = ['start', 'end', 'center', 'baseline', 'stretch'];
  return (
    <>
      {variants.map(variant => (
        <div
          key={variant}
          className={`d-flex align-items-${variant} bg-200 mb-2`}
          style={{ height: '5rem' }}
        >
          <div className="p-2 bg-300 border border-400">Flex item</div>
        </div>
      ))}
    </>
  );
}

export function FlexAlignSelfDescription() {
  return (
    <p>
      Use <code>align-self</code> utilities on flexbox items to individually
      change their alignment on the cross axis (the y-axis to start, x-axis if{' '}
      <code>flex-direction: column</code>). Choose from the same options as{' '}
      <code>align-items: start,</code> <code>end</code>, <code>center</code>,{' '}
      <code>baseline</code>, or <code>stretch (browser default).</code>
    </p>
  );
}

export function FlexAlignSelf({ config, className }) {
  return (
    <div className="d-flex bg-200 mb-2" style={{ height: '5rem' }}>
      <div className="border border-400 p-2 bg-300">Flex Item</div>
      <div className={`border border-400 p-2 bg-300 ${className || ''}`.trim()}>
        Align self {config}
      </div>
      <div className="border border-400 p-2 bg-300">Flex Item</div>
    </div>
  );
}

export function FlexFillDescription() {
  return (
    <p>
      Use the <code>.flex-fill</code> class on a series of sibling elements to
      force them into widths equal to their content (or equal widths if their
      content does not surpass their border-boxes) while taking up all available
      horizontal space.
    </p>
  );
}

export function FlexFill() {
  return (
    <div className="d-flex bg-200">
      <div className="p-2 flex-fill bg-300 border border-400">
        Flex item with a lot of content
      </div>
      <div className="p-2 flex-fill bg-300 border border-400">Flex item</div>
      <div className="p-2 flex-fill bg-300 border border-400">Flex item</div>
    </div>
  );
}

export function FlexShrink() {
  return (
    <div className="d-flex bg-200">
      <div className="p-2 w-100 bg-300 border border-400">Flex item</div>
      <div className="p-2 flex-shrink-1 bg-300 border border-400">
        Flex item
      </div>
    </div>
  );
}

export function FlexGrow() {
  return (
    <div className="d-flex bg-200">
      <div className="p-2 flex-grow-1 bg-300 border border-400">Flex item</div>
      <div className="p-2 bg-300 border border-400">Flex item</div>
      <div className="p-2 bg-300 border border-400">Third flex item</div>
    </div>
  );
}

export function FlexMargin() {
  return (
    <>
      <div className="d-flex bg-200 mb-2">
        <div className="p-2 bg-300 border border-400">Flex item</div>
        <div className="p-2 bg-300 border border-400">Flex item</div>
        <div className="p-2 bg-300 border border-400">Flex item</div>
      </div>
      <div className="d-flex bg-200 mb-2">
        <div className="me-auto p-2 bg-300 border border-400">Flex item</div>
        <div className="p-2 bg-300 border border-400">Flex item</div>
        <div className="p-2 bg-300 border border-400">Flex item</div>
      </div>
      <div className="d-flex bg-200 mb-2">
        <div className="p-2 bg-300 border border-400">Flex item</div>
        <div className="p-2 bg-300 border border-400">Flex item</div>
        <div className="ms-auto p-2 bg-300 border border-400">Flex item</div>
      </div>
    </>
  );
}

export function FlexWithAlignItems({ className }) {
  return (
    <div
      className={`d-flex flex-column bg-200 mb-3 ${className || ''}`.trim()}
      style={{ height: '200px' }}
    >
      <div className="mb-auto p-2 bg-300 border border-400">Flex item</div>
      <div className="p-2 bg-300 border border-400">Flex item</div>
      <div className="p-2 bg-300 border border-400">Flex item</div>
    </div>
  );
}

export function FlexWrapDescription() {
  return (
    <p>
      Change how flex items wrap in a flex container. Choose from no wrapping at
      all (the browser default) with <code>.flex-nowrap</code>, wrapping with{' '}
      <code>.flex-wrap</code>, or reverse wrapping with{' '}
      <code>.flex-wrap-reverse</code>.
    </p>
  );
}

export function FlexNoWrap() {
  return (
    <div
      className="d-flex flex-nowrap mb-3 bg-200 border border-300 py-3"
      style={{ width: '8rem' }}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="p-2 bg-300 border border-400">
          Flex item
        </div>
      ))}
    </div>
  );
}

export function FlexWrap({ className }) {
  return (
    <div
      className={`d-flex mb-3 bg-200 border border-300 ${className || ''}`.trim()}
    >
      {Array.from({ length: 14 }, (_, i) => (
        <div key={i} className="p-2 bg-300 border border-400">
          Flex item
        </div>
      ))}
    </div>
  );
}

export function FlexOrderDescription() {
  return (
    <p>
      Change the <em>visual</em> order of specific flex items with a handful of{' '}
      <code>order</code> utilities. We only provide options for making an item
      first or last, as well as a reset to use the DOM order. As{' '}
      <code>order</code> takes any integer value (e.g., <code>5</code>), add
      custom CSS for any additional values needed.
    </p>
  );
}

export function FlexOrder() {
  return (
    <div className="d-flex flex-nowrap bg-200">
      <div className="order-3 p-2 bg-300 border border-400">
        First flex item
      </div>
      <div className="order-2 p-2 bg-300 border border-400">
        Second flex item
      </div>
      <div className="order-1 p-2 bg-300 border border-400">
        Third flex item
      </div>
    </div>
  );
}

export function FlexAlignContentDescription() {
  return (
    <p>
      Use <code>align-content</code> utilities on flexbox containers to align
      flex items <em>together</em> on the cross axis. Choose from{' '}
      <code>start (browser default)</code>, <code>end</code>,{' '}
      <code>center</code>, <code>between</code>, <code>around</code>, or{' '}
      <code>stretch.</code> To demonstrate these utilities, we&apos;ve enforced{' '}
      <code>flex-wrap: wrap</code> and increased the number of flex items.
    </p>
  );
}

export function FlexAlignContent({ className }) {
  return (
    <div
      className={`d-flex flex-wrap bg-200 mb-3 ${className || ''}`.trim()}
      style={{ height: '300px' }}
    >
      {Array.from({ length: 14 }, (_, i) => (
        <div key={i} className="p-2 bg-300 border border-400">
          Flex item
        </div>
      ))}
    </div>
  );
}
