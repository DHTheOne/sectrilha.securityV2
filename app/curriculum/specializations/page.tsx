import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Layers3 } from 'lucide-react';
import { StructuredData } from '../../components/structured-data';
import { catalog, label } from '@/src/lib/curriculum/catalog';

export const revalidate = 86_400;

export const metadata: Metadata = {
  title: 'Especializações em cibersegurança',
  description: 'Escolha uma especialização de cibersegurança depois de consolidar seus fundamentos.',
  alternates: { canonical: '/curriculum/specializations' },
};

function prerequisiteText(specialization: (typeof catalog.specializations)[number]) {
  const requiredLevel = specialization.prerequisites.find((prerequisite) => prerequisite.isRequired && prerequisite.targetType === 'level');
  const level = requiredLevel ? catalog.levels.find((item) => item.id === requiredLevel.targetId) : undefined;
  return level ? `Recomendado após o nível ${level.order}` : 'Fundamentos recomendados';
}

export default function SpecializationsPage() {
  return (
    <div className="page-shell">
      <StructuredData data={{
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Especializações em cibersegurança da SecTrilha',
        itemListElement: catalog.specializations.map((specialization, position) => ({
          '@type': 'ListItem',
          position: position + 1,
          name: label(specialization.title),
          url: `/curriculum/specializations/${specialization.slug}`,
        })),
      }} />
      <section className="page-intro" aria-labelledby="specializations-title">
        <p className="eyebrow">APROFUNDE QUANDO ESTIVER PRONTO</p>
        <h1 id="specializations-title">Escolha uma direção sem se perder no mapa.</h1>
        <p>
          As especializações mostram o próximo conjunto de competências, recursos e certificações relacionadas.
          Não é preciso fazer todas: escolha a que combina com o seu objetivo e avance no seu ritmo.
        </p>
      </section>

      <section aria-label="Lista de especializações">
        <div className="grid grid-3">
          {catalog.specializations.map((specialization) => (
            <Link className="card card-link specialization-overview-card" key={specialization.id} href={`/curriculum/specializations/${specialization.slug}`}>
              <Layers3 className="module-icon" aria-hidden="true" size={22} />
              <span className="tag">{prerequisiteText(specialization)}</span>
              <h2>{label(specialization.title)}</h2>
              <p>{label(specialization.summary)}</p>
              <div className="card-spacer" />
              <span className="inline-link">Ver caminho sugerido <ArrowRight aria-hidden="true" size={16} /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="panel start-help" aria-labelledby="specializations-help-title">
        <p className="eyebrow">AINDA ESTÁ COMEÇANDO?</p>
        <h2 id="specializations-help-title">A base vem antes da especialização.</h2>
        <p className="muted">Siga pelo nível 0 se redes, Linux e fundamentos de segurança ainda não fazem parte da sua rotina de estudo.</p>
        <div className="button-row">
          <Link className="button button-primary" href="/start">Ver o guia inicial <ArrowRight aria-hidden="true" size={17} /></Link>
          <Link className="button button-secondary" href="/curriculum/level-0">Abrir o nível 0</Link>
        </div>
      </section>
    </div>
  );
}
