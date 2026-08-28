import { colors, grays, themeColor, graysColor } from '@/lib/theme-colors';

export function ColorPalette({
  val,
  index,
  gradient,
  arr
}: {
  val: string | number;
  index: number;
  gradient?: string;
  arr?: Record<string | number, string>;
}) {
  const isLightish =
    val === 'white' ||
    val === 'light' ||
    val === 100 ||
    val === 200 ||
    val === 'soft';
  const textClass = index < 8 && val !== 'light' ? 'text-white' : 'text-black';
  return (
    <div
      className={`p-3 d-flex flex-center bg-${val} ${gradient || ''} ${isLightish ? 'border border-300' : ''}`.trim()}
      style={{ height: '180px' }}
    >
      <pre className="text-center">
        {gradient && <code className={textClass}>.bg-gradient</code>}
        <br />
        <code className={textClass}>.bg-{val}</code>
        {arr && <p className={`mt-2 ${textClass}`}>{arr[val]}</p>}
      </pre>
    </div>
  );
}

export function ThemeColorsDemo() {
  return (
    <div className="row g-0">
      {colors.map((val, index) => (
        <div key={val} className="col-6 col-sm-4 col-lg-3">
          <ColorPalette val={val} index={index} arr={themeColor} />
        </div>
      ))}
    </div>
  );
}

export function GrayShadeDemo() {
  return (
    <div className="row g-0">
      {grays.map((val, index) => (
        <div key={val} className="col-6 col-sm-4 col-lg-3">
          <ColorPalette val={val} index={index} arr={graysColor} />
        </div>
      ))}
    </div>
  );
}

export function BackgroundGradientDescription() {
  return (
    <>
      <p>
        By adding a <code>.bg-gradient</code> class, a linear gradient is added
        as background image to the backgrounds. This gradient starts with a
        semi-transparent white which fades out to the bottom.
      </p>
      <p className="mb-0">
        Do you need a gradient in your custom CSS? Just add{' '}
        <code>background-image: var(--bs-gradient);</code>.
      </p>
    </>
  );
}

export function BackgroundGradientDemo() {
  return (
    <div className="row g-0">
      {colors.map((val, index) => (
        <div key={val} className="col-6 col-sm-4 col-lg-3">
          <ColorPalette val={val} index={index} gradient="bg-gradient" />
        </div>
      ))}
    </div>
  );
}

export function SoftColorsDemo() {
  return (
    <div className="row g-0">
      {colors.map(val => (
        <div key={val} className="col-6 col-sm-4 col-lg-3">
          <div className={`p-3 bg-soft-${val}`} style={{ height: '180px' }}>
            <code className={val !== 'light' ? `text-${val}` : 'text-black'}>
              .text-{val}
            </code>
            <br />
            <code className={val !== 'light' ? `text-${val}` : 'text-black'}>
              .bg-soft-{val}
            </code>
          </div>
        </div>
      ))}
    </div>
  );
}

const brandColors = [
  'facebook',
  'google-plus',
  'twitter',
  'linkedin',
  'youtube',
  'github'
];

export function BrandColorsDemo() {
  return (
    <div className="row g-0">
      {brandColors.map((val, index) => (
        <div key={val} className="col-6 col-sm-4 col-lg-3 light">
          <ColorPalette val={val} index={index} />
        </div>
      ))}
    </div>
  );
}
