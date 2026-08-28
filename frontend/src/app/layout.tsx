import type { ReactNode } from 'react';
import { Nunito_Sans, Poppins } from 'next/font/google';
import { Theme } from '@radix-ui/themes';
import ThemeInit from '@/components/ThemeInit';
import ApolloProviderWrapper from '@/lib/apollo/ApolloProviderWrapper';
import { AuthProvider } from '@/features/auth/AuthContext';
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
  title: siteConfig.name,
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
  themeColor: '#ffffff'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-US" dir="ltr" className={poppins.variable}>
      <body className={nunitoSans.className}>
        <Theme
          appearance="light"
          accentColor="blue"
          grayColor="slate"
          radius="small"
          hasBackground={false}
          panelBackground="solid"
        >
          <ApolloProviderWrapper>
            <AuthProvider>
              <main>{children}</main>
            </AuthProvider>
          </ApolloProviderWrapper>
        </Theme>
        <ThemeInit />
      </body>
    </html>
  );
}
