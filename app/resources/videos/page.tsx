import type { Metadata } from 'next';
import Link from 'next/link';
import { ResourceFilters } from '../../components/resource-filters';
import { StructuredData } from '../../components/structured-data';
import { catalog } from '@/src/lib/curriculum/catalog';

export const revalidate = 86_400;
export const metadata: Metadata = {
  title: 'Vídeos em português',
  description: 'Vídeos e playlists em português para estudar cibersegurança com segurança e no seu ritmo.',
  alternates: { canonical: '/resources/videos' },
};

export default function PortugueseVideosPage() {
  const videos = catalog.resources.filter((resource) => resource.type === 'video' && resource.languages.includes('pt-BR'));

  return (
    <div className="page-shell">
      <StructuredData data={{
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Vídeos de cibersegurança em português',
        itemListElement: videos.map((item, position) => ({ '@type': 'ListItem', position: position + 1, name: item.title.fallback, url: item.url })),
      }} />
      <section className="page-intro">
        <p className="eyebrow">BIBLIOTECA · VÍDEOS</p>
        <h1>Vídeos em português</h1>
        <p>Uma seleção de vídeos e playlists para acompanhar a trilha. Comece por redes, Linux e programação antes de avançar para os temas práticos de segurança.</p>
        <Link className="back-link" href="/resources">← Voltar para todos os recursos</Link>
      </section>
      <ResourceFilters resources={catalog.resources} initialType="video" initialLanguage="pt-BR" />
    </div>
  );
}
