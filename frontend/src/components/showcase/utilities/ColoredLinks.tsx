import { grays } from '@/lib/theme-colors';
import { siteConfig } from '@/lib/site-config';

export function ColoredLinksExampleDescription() {
  return (
    <p>
      You can use the <code>.link-*</code> classes to colorize links. Unlike the{' '}
      <a
        href={`https://getbootstrap.com/docs/${siteConfig.bootstrapVersion}/helpers/colored-links/`}
      >
        <code>.text-*</code> classes
      </a>
      , these classes have a <code>:hover</code> and <code>:focus</code> state.
    </p>
  );
}

const linkColors = [
  'primary',
  'secondary',
  'success',
  'danger',
  'warning',
  'info',
  'light',
  'dark'
];

export function ColoredLinksDemo() {
  return (
    <>
      {linkColors.map(color => (
        <a key={color} className={`link-${color} d-block`} href="#!">
          {color.charAt(0).toUpperCase() + color.slice(1)} link
        </a>
      ))}
    </>
  );
}

export function GraysColoredLinksDemo() {
  return (
    <>
      {grays.map(val => (
        <a key={val} className={`d-block link-${val}`} href="#!">
          Link {val}
        </a>
      ))}
    </>
  );
}
