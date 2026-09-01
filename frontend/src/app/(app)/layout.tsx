import type { ReactNode } from 'react';
import NavbarVertical from '@/components/layout/NavbarVertical';
import NavbarTop from '@/components/layout/NavbarTop';
import Footer from '@/components/common/Footer';
import AuthGuard from '@/features/auth/AuthGuard';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatDock from '@/components/chat/ChatDock';
import { ChatProvider } from '@/features/chat/ChatContext';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      {/* Chat wraps the whole signed-in shell because the navbar's unread
          badge and the docked windows read the same contact list. */}
      <ChatProvider>
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
          <ChatSidebar />
          <ChatDock />
        </div>
      </ChatProvider>
    </AuthGuard>
  );
}
