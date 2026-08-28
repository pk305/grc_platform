import { colorsAll } from '@/lib/theme-colors';

export function BorderWidth() {
  return (
    <>
      <span className="border border-1" />
      <span className="border border-2" />
      <span className="border border-3" />
      <span className="border border-4" />
      <span className="border border-5" />
      <hr />
      <span className="border border-top-2" />
      <span className="border border-end-2" />
      <span className="border border-bottom-2" />
      <span className="border border-start-2" />
    </>
  );
}

export function BorderWidthDoc() {
  return (
    <p>
      You can control border width using helper classes{' '}
      <code>border-{'{1|2|3|4|5}'}</code>. In addition, you can also use{' '}
      <code>border-top-2</code>, <code>border-end-2</code>,{' '}
      <code>border-bottom-2</code>, <code>border-start-2</code>.
    </p>
  );
}

export function BorderDoc() {
  return (
    <>
      <p>
        The classes are named using the format <code>border-{'{side}'}</code>{' '}
        for <code>xs</code> and{' '}
        <code>
          border-{'{breakpoint}'}-{'{side}'}
        </code>{' '}
        for <code>sm</code>, <code>md</code>, <code>lg</code>, <code>xl</code>,
        and <code>xxl</code>.
      </p>
      <p>
        Where <em>side</em> is one of:
      </p>
      <ul>
        <li>
          <code>top</code> - for classes that set style for{' '}
          <code>border-top</code>
        </li>
        <li>
          <code>bottom</code> - for classes that set style for{' '}
          <code>border-bottom</code>
        </li>
        <li>
          <code>left</code> - for classes that set style for{' '}
          <code>border-start</code>
        </li>
        <li>
          <code>right</code> - for classes that set style for{' '}
          <code>border-right</code>
        </li>
        <li>
          <code>x</code> - for classes that set both <code>*-left</code> and{' '}
          <code>*-right</code>
        </li>
        <li>
          <code>y</code> - for classes that set both <code>*-top</code> and{' '}
          <code>*-bottom</code>
        </li>
        <li>
          blank - for classes that set the <code>border</code> style on all 4
          side of the element.
        </li>
      </ul>
      <p className="mb-0">
        Use border utilities to quickly style the <code>border</code> of an
        element. Great for images, buttons, or any other element.
      </p>
    </>
  );
}

export function BorderAdditive() {
  return (
    <>
      <span className="border" />
      <span className="border-top" />
      <span className="border-end" />
      <span className="border-bottom" />
      <span className="border-start" />
    </>
  );
}

export function BorderSubtractive() {
  return (
    <>
      <span className="border border-0" />
      <span className="border border-top-0" />
      <span className="border border-end-0" />
      <span className="border border-bottom-0" />
      <span className="border border-start-0" />
    </>
  );
}

export function BorderRadiusHeader() {
  return (
    <>
      <h5 data-anchor>Border Radius &amp; sizes</h5>
      <p className="mb-0">
        Add helper classes to an element to easily round its corners. For the
        rounded border, the class are named using the format{' '}
        <code>rounded-*</code>
      </p>
    </>
  );
}

export function BorderRadius() {
  return (
    <>
      <span className="rounded-0" />
      <span className="rounded-1" />
      <span className="rounded-2" />
      <span className="rounded-3" />
      <span className="rounded-circle" />
      <span
        className="rounded-pill"
        style={{ width: '150px', height: '75px' }}
      />
    </>
  );
}

export function BorderRadiusSizeDescription() {
  return (
    <p>
      You can control top, right, bottom, left border radius of different size,
      using the helper classes. The classes also support responsive behaviors
      like <code>rounded-{'{xxl | xl | lg | md | sm}'}-*</code>. Examples are
      given below
    </p>
  );
}

export function BorderRadiusSizeDemo() {
  return (
    <>
      <span className="rounded-top" />
      <span className="rounded-top-lg" />
      <span className="rounded-end" />
      <span className="rounded-end-lg" />
      <span className="rounded-bottom" />
      <span className="rounded-bottom-lg" />
      <span className="rounded-start" />
      <span className="rounded-start-lg" />
    </>
  );
}

export function BorderStyleHeader() {
  return (
    <>
      <h5 data-anchor>Border Style</h5>
      <p className="mb-0">
        For the dashed border, the classes are named using the format,{' '}
        <code>border-dashed-{'{side}'}</code> for <code>xs</code> and{' '}
        <code>
          border-{'{breakpoint}'}-dashed-{'{side}'}
        </code>{' '}
        for <code>sm</code>, <code>md</code>, <code>lg</code>, <code>xl</code>{' '}
        and <code>xxl</code>.
      </p>
      <p className="mb-0">
        Where <em>side</em> is same as documented before.
      </p>
    </>
  );
}

export function BorderStyle() {
  return (
    <>
      <span className="border-dashed" />
      <span className="border-dashed-top" />
      <span className="border-dashed-right" />
      <span className="border-dashed-bottom" />
      <span className="border-dashed-left" />
    </>
  );
}

export function BorderColorWidthDoc() {
  return (
    <>
      <p>
        Border color set as <code>currentColor</code> and border width{' '}
        <code>1px</code>. Modifier can be used to change border color and width.
        The modifier classes for color are named using the format{' '}
        <code>border-{'{color}'}</code>.
      </p>
      <p className="mb-0">
        Where <em>color</em> is one of:{' '}
        {colorsAll.map(val => (
          <span key={val}>
            <code>{val}</code>,{' '}
          </span>
        ))}
      </p>
    </>
  );
}

const namedBorderColors = [
  'info',
  'success',
  'warning',
  'danger',
  'cake',
  'facebook',
  'twitter',
  'google-plus',
  'github'
];

const grayBorderColors = [
  'black',
  'dark',
  1100,
  1000,
  900,
  800,
  700,
  600,
  500,
  400,
  300,
  200,
  100,
  'light',
  'white'
];

export function BorderColorWidth() {
  return (
    <>
      {namedBorderColors.map(color => (
        <span key={color} className={`border border-${color}`} />
      ))}
      <div className="w-100" />
      {grayBorderColors.map(color => (
        <span key={color} className={`border border-${color}`} />
      ))}
      <span className="border border-2" />
      <span className="border-top border-top-2" />
      <span className="border-end border-end-2" />
      <span className="border-bottom border-bottom-2" />
      <span className="border-start border-start-2" />
    </>
  );
}
