export function SizingWidth() {
  const sizes = ['100', '75', '50', '25', 'auto'];
  return (
    <>
      {sizes.map(size => (
        <div
          key={size}
          className={`bg-light text-dark p-2 border-dashed mb-3 w-${size}`}
        >
          <code>.w-{size}</code>
        </div>
      ))}
    </>
  );
}

export function SizingHeight() {
  const sizes = ['100', '75', '50', '25', 'auto'];
  return (
    <div className="vh-50 text-dark py-3">
      <div className="row h-100">
        {sizes.map(size => (
          <div key={size} className="col">
            <div className={`bg-light p-2 border-dashed mb-3 h-${size}`}>
              <code>.h-{size}</code>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const BREAKPOINTS = ['', 'sm-', 'md-', 'lg-', 'xl-', 'xxl-'];
const VIEWPORT_RULES = ['max-vh', 'min-vh', 'vh'];
const VALUES = ['100', '75', '50', '25'];

function buildSizingCss() {
  const lines = [
    '.mw-100 { max-width: 100%; }',
    '.min-vw-100 { min-width: 100vw; }',
    '.vw-100 { width: 100vw; }'
  ];
  BREAKPOINTS.forEach(bp => {
    VIEWPORT_RULES.forEach(rule => {
      VALUES.forEach(value => {
        const prop = rule.startsWith('max')
          ? 'max-height'
          : rule.startsWith('min')
            ? 'min-height'
            : 'height';
        const important = rule === 'vh' ? ' !important' : '';
        lines.push(
          `.${rule}-${bp}${value} { ${prop}: ${value}vh${important}; }`
        );
      });
    });
  });
  return lines.join('\n');
}

export function SizingSpecial() {
  return (
    <pre className="rounded-3">
      <code className="lang-css">{buildSizingCss()}</code>
    </pre>
  );
}
