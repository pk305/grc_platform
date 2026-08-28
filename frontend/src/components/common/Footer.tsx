import { siteConfig } from '@/lib/site-config';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="row g-0 justify-content-between align-items-center h-100 mb-3">
        <div className="col-12 col-sm-auto text-center">
          <p className="mb-0 text-900">
            All rights are reserved {siteConfig.name}
            <span className="d-none d-sm-inline-block" />
            <span className="mx-1">|</span>
            <br className="d-sm-none" />
            {new Date().getFullYear()} &copy;{' '}
            <a href="https://acentriagroup.com">Acentriagroup</a>
          </p>
        </div>
        <div className="col-12 col-sm-auto text-center">
          <p className="mb-0 text-600">{siteConfig.version}</p>
        </div>
      </div>
    </footer>
  );
}
