import Link from 'next/link';
import { Menu, Shield } from 'lucide-react';

const links = [
  { href: '/', label: 'Início' },
  { href: '/start', label: 'Começar' },
  { href: '/curriculum', label: 'Trilhas' },
  { href: '/resources', label: 'Recursos' },
  { href: '/resources/videos', label: 'Vídeos em PT' },
  { href: '/certifications', label: 'Certificações' },
  { href: '/curriculum/specializations', label: 'Especializações' },
];

function NavigationLinks() {
  return links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>);
}

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="brand" aria-label="SecTrilha — início">
          <span className="brand-mark"><Shield aria-hidden="true" size={19} /></span>
          <span>SecTrilha</span>
        </Link>
        <nav className="primary-nav" aria-label="Navegação principal">
          <NavigationLinks />
        </nav>
        <details className="mobile-nav">
          <summary aria-label="Abrir menu de navegação">
            <Menu aria-hidden="true" size={18} />
            <span>Menu</span>
          </summary>
          <nav className="mobile-nav-links" aria-label="Navegação principal móvel">
            <NavigationLinks />
          </nav>
        </details>
      </div>
    </header>
  );
}
