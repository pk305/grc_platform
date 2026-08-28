import type { ReactNode } from 'react';
import Link from 'next/link';
import Logo from '@/components/common/Logo';

export default function AuthShell({
  columnClass = 'col-xl-5 col-xxl-3',
  logo = true,
  children
}: {
  columnClass?: string;
  logo?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="container">
      <div className="row flex-center min-vh-100 py-5">
        <div className={`col-sm-10 col-md-8 col-lg-5 ${columnClass}`}>
          {logo && (
            <Link
              href="/"
              className="d-flex flex-center text-decoration-none mb-4"
            >
              <Logo
                text={false}
                width={58}
                href={null}
                className="fw-bolder fs-5 d-inline-block"
              />
            </Link>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
