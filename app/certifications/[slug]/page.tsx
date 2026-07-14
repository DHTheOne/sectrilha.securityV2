import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, GraduationCap } from 'lucide-react';
import { notFound } from 'next/navigation';
import { StructuredData } from '../../components/structured-data';
import { catalog, getCertification, getCostBandLabel, getRecognitionLabel, getSourceUpdatedLabel, label } from '@/src/lib/curriculum/catalog';

export const revalidate = 86_400;
type PageProps = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return catalog.certifications.map((certification) => ({ slug: certification.slug })); }
export async function generateMetadata({ params }: PageProps): Promise<Metadata> { const certification = getCertification((await params).slug); return certification ? { title: label(certification.name), description: label(certification.description), alternates: { canonical: `/certifications/${certification.slug}` } } : {}; }

export default async function CertificationPage({ params }: PageProps) {
  const certification = getCertification((await params).slug);
  if (!certification) notFound();
  const resources = catalog.resources.filter((resource) => certification.resourceIds.includes(resource.id));
  return <div className="page-shell"><StructuredData data={{ '@context': 'https://schema.org', '@type': 'EducationalOccupationalCredential', name: label(certification.name), credentialCategory: 'Certification', recognizedBy: { '@type': 'Organization', name: certification.provider }, description: label(certification.description), url: certification.url }} /><Link href="/certifications" className="back-link"><ArrowLeft aria-hidden="true" size={16} /> Voltar às certificações</Link><section className="credential-hero panel"><GraduationCap aria-hidden="true" size={30} /><div><p className="eyebrow">{certification.provider}</p><h1>{label(certification.name)}</h1><p>{label(certification.description)}</p></div>{certification.url && <a className="button button-primary" href={certification.url} target="_blank" rel="noreferrer" aria-label={`Abrir a página oficial de ${label(certification.name)} (nova aba)`}>Página oficial <ExternalLink aria-hidden="true" size={16} /></a>}</section><p className="external-link-note" role="note">Link oficial revisado em {getSourceUpdatedLabel()}. Taxas, exames e pré-requisitos podem mudar no provedor.</p><dl className="fact-grid"><div><dt>Custo</dt><dd>{getCostBandLabel(certification.costBand)}</dd></div><div><dt>Tempo estimado</dt><dd>{certification.estimatedStudyHours ? `${certification.estimatedStudyHours} horas` : 'A confirmar'}</dd></div><div><dt>Reconhecimento</dt><dd>{getRecognitionLabel(certification.recognition)}</dd></div><div><dt>Pré-requisitos</dt><dd>{certification.prerequisites.length ? certification.prerequisites.map((item) => item.targetId.replace('level-', 'Nível ')).join(', ') : 'Nenhum'}</dd></div></dl><section aria-labelledby="prep-heading"><div className="section-heading"><div><p className="eyebrow">PREPARAÇÃO</p><h2 id="prep-heading">Recursos relacionados</h2></div></div><div className="grid grid-3">{resources.map((resource) => <Link key={resource.id} className="card card-link" href={`/resources/${resource.slug}`}><h3>{label(resource.title)}</h3><p>{label(resource.description)}</p><span className="meta">{resource.provider}</span></Link>)}</div></section></div>;
}
