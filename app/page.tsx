import Link from 'next/link';
import { ArrowRight, BookOpenCheck, Compass, PlayCircle, ShieldCheck } from 'lucide-react';

export const revalidate = 86_400;

export default function HomePage() {
  return (
    <section className="hero-shell" aria-labelledby="home-title">
      <div className="hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">CURRÍCULO ABERTO · CC-BY-SA-4.0</p>
          <h1 id="home-title">Aprenda cibersegurança com uma rota clara, prática e ética.</h1>
          <p className="hero-description">
            Da base de redes e sistemas às especializações de Red Team, Blue Team, cloud e pesquisa.
            Siga um começo simples, use recursos curados e acompanhe os seus próprios checkpoints.
          </p>
          <div className="button-row">
            <Link className="button button-primary" href="/start">
              Começar por aqui <ArrowRight aria-hidden="true" size={18} />
            </Link>
            <Link className="button button-secondary" href="/curriculum/level-0">
              Começar pelo nível 0
            </Link>
          </div>
        </div>
        <aside className="hero-panel" aria-label="Primeiros passos na SecTrilha">
          <p className="eyebrow">SEU PRIMEIRO ACESSO</p>
          <div className="feature-line"><Compass aria-hidden="true" size={20} /><span><strong>1. Escolha seu ponto de partida.</strong><br />Comece pelo nível 0 se ainda está criando a base.</span></div>
          <div className="feature-line"><BookOpenCheck aria-hidden="true" size={20} /><span><strong>2. Estude um módulo por vez.</strong><br />Use os recursos curados para aprofundar cada tema.</span></div>
          <div className="feature-line"><PlayCircle aria-hidden="true" size={20} /><span><strong>Quer estudar em português?</strong><br /><Link className="inline-link" href="/resources/videos">Abrir vídeos em português</Link></span></div>
          <div className="feature-line"><ShieldCheck aria-hidden="true" size={20} /><span>Prática responsável, apenas em laboratórios e ambientes autorizados.</span></div>
        </aside>
      </div>
    </section>
  );
}
