'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
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

/** Retorna o href do item de menu que corresponde à rota atual (prefixo mais específico vence). */
function findActiveHref(pathname: string): string | null {
  let best: string | null = null;
  for (const link of links) {
    const matches = link.href === '/'
      ? pathname === '/'
      : pathname === link.href || pathname.startsWith(`${link.href}/`);
    if (matches && (best === null || link.href.length > best.length)) best = link.href;
  }
  return best;
}

function NavigationLinks({ pathname }: Readonly<{ pathname: string }>) {
  const activeHref = findActiveHref(pathname);
  return links.map((link) => (
    <Link
      key={link.href}
      href={link.href}
      aria-current={link.href === activeHref ? 'page' : undefined}
    >
      {link.label}
    </Link>
  ));
}

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const mobileNavRef = useRef<HTMLDetailsElement>(null);

  // Solidifica o header (fundo + borda + sombra) depois de um pequeno scroll.
  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 8);
    }
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fecha o menu móvel ao navegar para outra rota (o header persiste entre páginas).
  useEffect(() => {
    mobileNavRef.current?.removeAttribute('open');
  }, [pathname]);

  return (
    <header className="site-header" data-scrolled={scrolled || undefined}>
      <div className="site-header-inner">
        <Link href="/" className="brand" aria-label="SecTrilha — início">
          <span className="brand-mark"><Shield aria-hidden="true" size={19} /></span>
          <span>SecTrilha</span>
        </Link>
        <nav className="primary-nav" aria-label="Navegação principal">
          <NavigationLinks pathname={pathname} />
        </nav>
        <details className="mobile-nav" ref={mobileNavRef}>
          <summary aria-label="Abrir menu de navegação">
            <Menu aria-hidden="true" size={18} />
            <span>Menu</span>
          </summary>
          <nav className="mobile-nav-links" aria-label="Navegação principal móvel">
            <NavigationLinks pathname={pathname} />
          </nav>
        </details>
      </div>
    </header>
  );
}
