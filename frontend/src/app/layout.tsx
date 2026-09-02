import type { ReactNode } from 'react';
import { Nunito_Sans, Poppins } from 'next/font/google';
import ThemeInit from '@/components/ThemeInit';
import ApolloProviderWrapper from '@/lib/apollo/ApolloProviderWrapper';
import { AuthProvider } from '@/features/auth/AuthContext';
import SessionWatcher from '@/features/auth/SessionWatcher';
import {
  ThemeProvider,
  THEME_STORAGE_KEY
} from '@/features/theme/ThemeContext';
import { ToastProvider } from '@/components/common/Toast';
import { siteConfig } from '@/lib/site-config';
import '@fortawesome/fontawesome-free/css/all.min.css';
import 'animate.css';
import '@radix-ui/themes/styles.css';
import './globals.scss';

const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700', '800', '900'],
  variable: '--font-nunito-sans',
  display: 'swap'
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-poppins',
  display: 'swap'
});

export const metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`
  },
  icons: {
    icon: [
      { url: '/assets/img/favicons/favicon-32x32.png', sizes: '32x32' },
      { url: '/assets/img/favicons/favicon-16x16.png', sizes: '16x16' }
    ],
    apple: '/assets/img/favicons/apple-touch-icon.png',
    shortcut: '/assets/img/favicons/favicon.ico'
  },
  manifest: '/assets/img/favicons/manifest.json'
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1727' }
  ]
};

const NO_FLASH_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('${THEME_STORAGE_KEY}');
    var dark = stored === 'dark' || (stored === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en-US"
      dir="ltr"
      className={poppins.variable}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />
      </head>
      <body className={nunitoSans.className}>
        <ThemeProvider>
          <ApolloProviderWrapper>
            <AuthProvider>
              <ToastProvider>
                <SessionWatcher />
                <main>{children}</main>
              </ToastProvider>
            </AuthProvider>
          </ApolloProviderWrapper>
        </ThemeProvider>
        <ThemeInit />
      </body>
    </html>
  );
}
