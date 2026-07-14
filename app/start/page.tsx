import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpenCheck, CheckCircle2, Compass, PlayCircle } from 'lucide-react';

export const revalidate = 86_400;

export const metadata: Metadata = {
  title: 'Comece por aqui',
  description: 'Guia inicial para navegar pela SecTrilha e iniciar o aprendizado em cibersegurança.',
  alternates: { canonical: '/start' },
};

const steps = [
  {
    title: 'Escolha seu ponto de partida',
    description: 'Se você está começando, abra o nível 0. Ele reúne internet, redes, Linux e programação básica.',
    href: '/curriculum/level-0',
    action: 'Abrir o nível 0',
    icon: Compass,
  },
  {
    title: 'Estude um tema de cada vez',
    description: 'Em cada nível, leia o objetivo do módulo e escolha um recurso. Vídeos em português são um bom começo.',
    href: '/resources/videos',
    action: 'Ver vídeos em português',
    icon: PlayCircle,
  },
  {
    title: 'Registre a prática concluída',
    description: 'Marque os checkpoints quando puder demonstrar o que aprendeu. Seu progresso fica neste navegador.',
    href: '/curriculum',
    action: 'Ver todas as trilhas',
    icon: CheckCircle2,
  },
];

export default function StartPage() {
  return (
    <div className="page-shell">
      <section className="page-intro" aria-labelledby="start-title">
        <p className="eyebrow">COMECE POR AQUI</p>
        <h1 id="start-title">Um caminho simples para a sua primeira sessão de estudo.</h1>
        <p>
          Não precisa escolher uma especialização agora. Construa a base, pratique em ambientes autorizados e avance
          quando os checkpoints fizerem sentido para você.
        </p>
      </section>

      <ol className="grid grid-3 start-steps" aria-label="Três passos para começar">
        {steps.map(({ title, description, href, action, icon: Icon }, index) => (
          <li className="card start-step" key={href}>
            <span className="level-number">Passo {index + 1}</span>
            <Icon className="module-icon" aria-hidden="true" size={23} />
            <h2>{title}</h2>
            <p>{description}</p>
            <div className="card-spacer" />
            <Link className="inline-link" href={href}>{action} <ArrowRight aria-hidden="true" size={16} /></Link>
          </li>
        ))}
      </ol>

      <section className="panel start-help" aria-labelledby="navigation-guide-title">
        <p className="eyebrow">COMO NAVEGAR</p>
        <h2 id="navigation-guide-title">O que você encontra em cada área</h2>
        <div className="grid grid-3 start-navigation-grid">
          <div>
            <BookOpenCheck aria-hidden="true" size={20} />
            <h3>Trilhas</h3>
            <p>Os níveis do básico ao avançado, com módulos e checkpoints práticos.</p>
          </div>
          <div>
            <PlayCircle aria-hidden="true" size={20} />
            <h3>Recursos</h3>
            <p>Cursos, vídeos, laboratórios e guias, com filtros por idioma, formato e acesso.</p>
          </div>
          <div>
            <Compass aria-hidden="true" size={20} />
            <h3>Especializações</h3>
            <p>Áreas para aprofundar depois de consolidar a base, como Red Team, Blue Team e cloud.</p>
          </div>
        </div>
        <div className="button-row">
          <Link className="button button-primary" href="/curriculum/level-0">Começar pelo nível 0 <ArrowRight aria-hidden="true" size={17} /></Link>
          <Link className="button button-secondary" href="/resources">Explorar recursos</Link>
        </div>
      </section>
    </div>
  );
}
