import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <strong>SecTrilha</strong>
        <p>Uma plataforma educacional para prática responsável em cibersegurança.</p>
      </div>
      <div className="footer-links">
        <Link href="/curriculum">Currículo</Link>
        <Link href="/privacy">Privacidade</Link>
        <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.pt-br" rel="license">CC BY-SA 4.0</a>
      </div>
    </footer>
  );
}
