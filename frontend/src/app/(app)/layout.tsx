import type { ReactNode } from 'react';
import NavbarVertical from '@/components/layout/NavbarVertical';
import NavbarTop from '@/components/layout/NavbarTop';
import Footer from '@/components/common/Footer';
import AuthGuard from '@/features/auth/AuthGuard';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="container-fluid px-0">
        <NavbarVertical className="navbar-expand-lg" />
        <NavbarTop
          toggleID="navbarVerticalCollapse"
          search
          className="navbar-expand"
        />
        <div className="content">
          {children}
          <Footer />
        </div>
      </div>
    </AuthGuard>
  );
}
