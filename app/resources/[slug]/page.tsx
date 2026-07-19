import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, LibraryBig } from 'lucide-react';
import { notFound } from 'next/navigation';
import { StructuredData } from '../../components/structured-data';
import { catalog, getAccessLabel, getResource, getResourceTypeLabel, getSourceUpdatedLabel, label } from '@/src/lib/curriculum/catalog';

export const revalidate = 86_400;
type PageProps = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return catalog.resources.map((resource) => ({ slug: resource.slug })); }
export async function generateMetadata({ params }: PageProps): Promise<Metadata> { const resource = getResource((await params).slug); return resource ? { title: label(resource.title), description: label(resource.description), alternates: { canonical: `/resources/${resource.slug}` } } : {}; }
export default async function ResourcePage({ params }: PageProps) {
  const resource = getResource((await params).slug);
  if (!resource) notFound();
  const levels = catalog.levels.filter((level) => resource.levelIds.includes(level.id));
  return <div className="page-shell"><StructuredData data={{ '@context': 'https://schema.org', '@type': 'LearningResource', name: label(resource.title), description: label(resource.description), provider: { '@type': 'Organization', name: resource.provider }, url: resource.url, inLanguage: resource.languages, isAccessibleForFree: resource.access === 'free' }} /><Link href="/resources" className="back-link"><ArrowLeft aria-hidden="true" size={16} /> Voltar aos recursos</Link><section className="credential-hero panel"><LibraryBig aria-hidden="true" size={30} /><div><p className="eyebrow">{resource.provider}</p><h1>{label(resource.title)}</h1><p>{label(resource.description)}</p></div>{resource.url && <a className="button button-primary" href={resource.url} target="_blank" rel="noreferrer" aria-label={`Abrir ${label(resource.title)} no site de ${resource.provider} (nova aba)`}>Acessar recurso <ExternalLink aria-hidden="true" size={16} /></a>}</section><p className="external-link-note" role="note">Link externo revisado em {getSourceUpdatedLabel()}. O conteúdo e os requisitos podem mudar no provedor.</p><dl className="fact-grid"><div><dt>Tipo</dt><dd>{getResourceTypeLabel(resource.type)}</dd></div><div><dt>Acesso</dt><dd>{getAccessLabel(resource.access)}</dd></div><div><dt>Idioma</dt><dd>{resource.languages.join(', ')}</dd></div><div><dt>Tempo estimado</dt><dd>{resource.estimatedHours ? `${resource.estimatedHours} ${resource.estimatedHours === 1 ? 'hora' : 'horas'}` : 'Variável'}</dd></div></dl><section aria-labelledby="resource-levels"><div className="section-heading"><div><p className="eyebrow">ONDE USAR</p><h2 id="resource-levels">Níveis relacionados</h2></div></div><div className="grid grid-3">{levels.map((level) => <Link className="card card-link" key={level.id} href={`/curriculum/${level.slug}`}><span className="level-number">Nível {level.order}</span><h3>{label(level.title)}</h3><p>{label(level.summary)}</p></Link>)}</div></section></div>;
}
