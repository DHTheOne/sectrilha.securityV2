import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { OfflineServiceWorker } from './components/offline-service-worker';
import { SiteFooter } from './components/site-footer';
import { SiteHeader } from './components/site-header';
import { ThemeProvider } from './components/theme-provider';
import { ThemeSwitcher } from './components/theme-switcher';
import { SITE_URL } from '@/src/lib/site';
import './globals.css';

const siteName = 'SecTrilha';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${siteName} | Currículo de Cibersegurança`,
    template: `%s | ${siteName}`,
  },
  description: 'Currículo guiado de cibersegurança, do fundamento técnico às especializações profissionais.',
  applicationName: siteName,
  keywords: ['cibersegurança', 'cybersecurity', 'pentest', 'blue team', 'red team', 'trilha de aprendizagem'],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName,
    title: 'SecTrilha — Currículo de Cibersegurança',
    description: 'Uma jornada estruturada para aprender cibersegurança com prática e propósito.',
  },
};

export const viewport: Viewport = {
  themeColor: '#07120f',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <OfflineServiceWorker />
          <a className="skip-link" href="#conteudo-principal">Pular para o conteúdo</a>
          <SiteHeader />
          <main id="conteudo-principal">{children}</main>
          <SiteFooter />
          <ThemeSwitcher />
        </ThemeProvider>
      </body>
    </html>
  );
}
