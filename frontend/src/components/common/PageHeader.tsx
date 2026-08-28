import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  descriptionEl?: ReactNode;
  url?: string;
  linkText?: ReactNode;
  headerClass?: string;
  descriptionClass?: string;
}

export default function PageHeader({
  title,
  description,
  descriptionEl,
  url,
  linkText,
  headerClass,
  descriptionClass
}: PageHeaderProps) {
  return (
    <>
      <h2 className={`mb-2 lh-sm ${headerClass || ''}`.trim()} data-anchor>
        {title}
      </h2>
      {description && <p className="text-700 lead mb-2">{description}</p>}
      {descriptionEl && (
        <div
          className={`text-700 fw-semi-bold mb-2 ${descriptionClass || ''}`.trim()}
        >
          {descriptionEl}
        </div>
      )}
      {url && (
        <a
          className="btn btn-link p-0"
          href={url}
          target="_blank"
          rel="noreferrer"
        >
          {linkText}
          <span className="ms-1" data-feather="chevron-right" />
        </a>
      )}
    </>
  );
}
