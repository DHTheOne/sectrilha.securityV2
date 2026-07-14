import type { Metadata } from 'next';
import Link from 'next/link';
import { ResourceFilters } from '../components/resource-filters';
import { StructuredData } from '../components/structured-data';
import { catalog } from '@/src/lib/curriculum/catalog';

export const revalidate = 86_400;
export const metadata: Metadata = {
  title: 'Recursos de aprendizagem',
  description: 'Cursos, livros, vídeos e laboratórios curados para estudar cibersegurança.',
  alternates: { canonical: '/resources' },
};

export default function ResourcesPage() {
  const portugueseVideos = catalog.resources.filter((resource) => resource.type === 'video' && resource.languages.includes('pt-BR'));
  const legacyResources = catalog.resources.filter((resource) => resource.collection === 'legacy');

  return (
    <div className="page-shell">
      <StructuredData data={{
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Recursos de aprendizagem em cibersegurança',
        itemListElement: catalog.resources.map((item, position) => ({ '@type': 'ListItem', position: position + 1, name: item.title.fallback, url: item.url })),
      }} />
      <section className="page-intro">
        <p className="eyebrow">BIBLIOTECA CURADA</p>
        <h1>Encontre um recurso sem se perder.</h1>
        <p>Comece por um atalho ou busque por assunto, formato, idioma e tema. Os links externos devem ser revisados antes de iniciar uma compra ou compartilhar dados pessoais.</p>
      </section>
      <section className="resource-directory" aria-label="Atalhos da biblioteca">
        <div className="grid grid-3">
          <Link className="card card-link resource-directory-card" href="/resources/videos">
            <p className="eyebrow">VÍDEOS EM PORTUGUÊS</p>
            <h2>Assista e pratique</h2>
            <p>{portugueseVideos.length} vídeos e playlists para começar pelos fundamentos, Linux, Python, segurança e pentest.</p>
            <span className="inline-link">Ver vídeos</span>
          </Link>
          <Link className="card card-link resource-directory-card" href="/resources/previous">
            <p className="eyebrow">CONTEÚDOS ANTERIORES</p>
            <h2>Encontre o acervo do site</h2>
            <p>{legacyResources.length} materiais que já faziam parte da plataforma, organizados por tema e formato.</p>
            <span className="inline-link">Abrir acervo</span>
          </Link>
          <Link className="card card-link resource-directory-card" href="/curriculum/level-0">
            <p className="eyebrow">NÃO SABE POR ONDE COMEÇAR?</p>
            <h2>Comece pelo nível 0</h2>
            <p>Siga a trilha de fundamentos e use os recursos sugeridos em cada módulo.</p>
            <span className="inline-link">Ir para a trilha</span>
          </Link>
        </div>
      </section>
      <ResourceFilters resources={catalog.resources} />
    </div>
  );
}
