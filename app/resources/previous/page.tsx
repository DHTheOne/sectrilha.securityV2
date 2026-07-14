import type { Metadata } from 'next';
import Link from 'next/link';
import { ResourceFilters } from '../../components/resource-filters';
import { StructuredData } from '../../components/structured-data';
import { catalog } from '@/src/lib/curriculum/catalog';

export const revalidate = 86_400;
export const metadata: Metadata = {
  title: 'Conteúdos anteriores',
  description: 'Acervo de materiais que já faziam parte da plataforma de aprendizagem em cibersegurança.',
  alternates: { canonical: '/resources/previous' },
};

export default function PreviousResourcesPage() {
  const previousResources = catalog.resources.filter((resource) => resource.collection === 'legacy');

  return (
    <div className="page-shell">
      <StructuredData data={{
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Conteúdos anteriores da biblioteca de cibersegurança',
        itemListElement: previousResources.map((item, position) => ({ '@type': 'ListItem', position: position + 1, name: item.title.fallback, url: item.url })),
      }} />
      <section className="page-intro">
        <p className="eyebrow">BIBLIOTECA · ACERVO</p>
        <h1>Conteúdos anteriores</h1>
        <p>Este é o material que já estava no site, agora reunido em um só lugar. Use os filtros para navegar por vídeo, curso, tema e idioma.</p>
        <Link className="back-link" href="/resources">← Voltar para todos os recursos</Link>
      </section>
      <ResourceFilters resources={catalog.resources} initialCollection="legacy" />
    </div>
  );
}
