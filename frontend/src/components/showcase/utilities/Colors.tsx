import type { CSSProperties } from 'react';
import { colors } from '@/lib/theme-colors';

export function ColorExample() {
  return (
    <>
      {colors.map(color => (
        <p
          key={color}
          className={`text-${color}${color === 'light' ? ' bg-dark' : ''}`}
        >
          text-{color}
        </p>
      ))}
    </>
  );
}

export function ColorOpacity() {
  return (
    <>
      <h3>How it works</h3>
      <pre>
        <code className="language-css">
          {`.text-primary {
  --bs-text-opacity: 1;
  color: rgba(var(--bs-primary-rgb), var(--bs-text-opacity)) !important;
}`}
        </code>
      </pre>
    </>
  );
}

export function ColorOpacityExample() {
  return (
    <>
      <div className="text-primary mb-1">This is default primary text</div>
      <div
        className="text-primary mb-1"
        style={{ '--bs-text-opacity': 0.5 } as CSSProperties}
      >
        This is 50% opacity primary text using inline css
      </div>
      <div className="text-primary text-opacity-75 mb-1">
        This is 75% opacity primary text using utility class
      </div>
      <div className="text-primary text-opacity-50 mb-1">
        This is 50% opacity primary text using utility class
      </div>
      <div className="text-primary text-opacity-25 mb-1">
        This is 25% opacity primary text using utility class
      </div>
    </>
  );
}
