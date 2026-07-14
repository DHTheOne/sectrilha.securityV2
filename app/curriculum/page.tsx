import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Layers3, Sparkles } from 'lucide-react';
import { CurriculumTree } from '../components/curriculum-tree';
import { LevelCardGrid } from '../components/level-card-grid';
import { NextActionCard } from '../components/next-action-card';
import { ProgressProvider } from '../components/progress-provider';
import { StructuredData } from '../components/structured-data';
import { catalog, label } from '@/src/lib/curriculum/catalog';

export const revalidate = 86_400;

export const metadata: Metadata = {
  title: 'Currículo de Cibersegurança',
  description: 'Trilha estruturada de cibersegurança dos fundamentos à pesquisa e liderança técnica.',
  alternates: { canonical: '/curriculum' },
};

export default function CurriculumPage() {
  return (
    <ProgressProvider><div className="page-shell">
      <StructuredData data={{
        '@context': 'https://schema.org', '@type': 'Course', name: 'Currículo de Cibersegurança SecTrilha',
        description: label(catalog.metadata.description), provider: { '@type': 'Organization', name: 'SecTrilha' },
        inLanguage: 'pt-BR', educationalLevel: 'Beginner to Advanced', isAccessibleForFree: true,
      }} />
      <section className="page-intro" aria-labelledby="curriculum-title">
        <p className="eyebrow">MAPA CURRICULAR · VERSÃO {catalog.metadata.version}</p>
        <h1 id="curriculum-title">Uma trilha, várias direções profissionais.</h1>
        <p>
          O currículo organiza fundamentos, prática guiada e especializações. Cada nível combina objetivos,
          recursos e checkpoints verificáveis — sem perder de vista a prática legal e ética.
        </p>
      </section>

      <div className="section-heading">
        <div><p className="eyebrow">SELECIONE UM ESTÁGIO</p><h2>Níveis do currículo</h2></div>
        <span className="muted">Do básico à liderança técnica</span>
      </div>
      <LevelCardGrid levels={catalog.levels} />

      <details className="optional-planner panel">
        <summary>Quero planejar meu ritmo de estudo</summary>
        <NextActionCard levels={catalog.levels} checkpoints={catalog.checkpoints} certifications={catalog.certifications} />
      </details>

      <div className="section-heading">
        <div><p className="eyebrow">VISÃO CONECTADA</p><h2>Seu caminho de aprendizagem</h2></div>
      </div>
      <CurriculumTree levels={catalog.levels} />

      <section className="explore-specializations panel" aria-labelledby="specializations-title">
        <div><p className="eyebrow">APROFUNDE A PRÁTICA</p><h2 id="specializations-title">Especializações</h2><p>Escolha uma ou duas frentes depois de consolidar os fundamentos. Você pode evoluir em paralelo sem tentar fazer tudo ao mesmo tempo.</p></div>
        <div className="specialization-link-grid">
          {catalog.specializations.map((specialization) => (
            <Link key={specialization.id} href={`/curriculum/specializations/${specialization.slug}`}>
              <Layers3 aria-hidden="true" size={17} /><span>{label(specialization.title)}</span><ArrowRight aria-hidden="true" size={15} />
            </Link>
          ))}
        </div>
        <div className="button-row"><Link className="button button-secondary" href="/curriculum/specializations"><Layers3 aria-hidden="true" size={17} /> Ver todas as especializações</Link><Link className="button button-primary" href="/certifications"><Sparkles aria-hidden="true" size={17} /> Comparar certificações</Link></div>
      </section>
    </div></ProgressProvider>
  );
}
