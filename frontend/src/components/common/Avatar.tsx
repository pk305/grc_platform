import type { ReactNode } from 'react';
import { getFirstLetter } from '@/lib/text';

export default function Avatar({
  size = '2xl',
  round = 'circle',
  img = 'team/avatar-placeholder.png',
  src,
  contentClass = '',
  name,
  more,
  emoji,
  icon,
  status,
  bordered,
  type,
  className
}: {
  size?: string;
  round?: string;
  img?: string | string[];
  /** Absolute or data URL for an uploaded image; takes precedence over `name` and `img`. */
  src?: string | null;
  contentClass?: string;
  name?: string;
  more?: ReactNode;
  emoji?: ReactNode;
  icon?: ReactNode;
  status?: string;
  bordered?: boolean;
  type?: string;
  className?: string;
}) {
  const wrapperClass =
    `avatar ${status ? `avatar-${size} status-${status}` : `avatar-${size}`} ${
      bordered ? 'avatar-bordered' : ''
    } ${className || ''}`.trim();

  if (src) {
    return (
      <div className={wrapperClass}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={`rounded-${round}`} src={src} alt="" />
      </div>
    );
  }

  if (name) {
    return (
      <div className={wrapperClass}>
        <div className={`avatar-name rounded-${round}`}>
          <span>{getFirstLetter(name)}</span>
        </div>
      </div>
    );
  }

  if (more) {
    return (
      <div className={wrapperClass}>
        <div className={`avatar-name rounded-${round} ${contentClass}`}>
          <span>{more}</span>
        </div>
      </div>
    );
  }

  if (emoji) {
    return (
      <div className={wrapperClass}>
        <div className={`avatar-emoji rounded-${round} ${contentClass}`}>
          <span role="img" aria-label="Emoji">
            {emoji}
          </span>
        </div>
      </div>
    );
  }

  if (icon) {
    return (
      <div className={wrapperClass}>
        <div className={`avatar-name rounded-${round} ${contentClass}`}>
          <span>{icon}</span>
        </div>
      </div>
    );
  }

  if (type === 'group') {
    return (
      <div className={wrapperClass}>
        <div className="rounded-circle overflow-hidden h-100 d-flex">
          <div className="w-50 border-end">
            <img src={`/assets/img/${img[0]}`} alt="" />
          </div>
          <div className="w-50 d-flex flex-column">
            <img
              className="h-50 border-bottom"
              src={`/assets/img/${img[1]}`}
              alt=""
            />
            <img className="h-50" src={`/assets/img/${img[2]}`} alt="" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      <img className={`rounded-${round}`} src={`/assets/img/${img}`} alt="" />
    </div>
  );
}
