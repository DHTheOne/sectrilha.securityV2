import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Award, BookOpen } from 'lucide-react';
import { notFound } from 'next/navigation';
import { CheckpointChecklist } from '../../../components/checkpoint-checklist';
import { ProgressProvider } from '../../../components/progress-provider';
import { SpecializationPanel } from '../../../components/specialization-panel';
import { StructuredData } from '../../../components/structured-data';
import { catalog, getSpecialization, label } from '@/src/lib/curriculum/catalog';

export const revalidate = 86_400;
type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() { return catalog.specializations.map((specialization) => ({ slug: specialization.slug })); }
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const specialization = getSpecialization((await params).slug);
  return specialization ? { title: label(specialization.title), description: label(specialization.summary), alternates: { canonical: `/curriculum/specializations/${specialization.slug}` } } : {};
}

export default async function SpecializationPage({ params }: PageProps) {
  const specialization = getSpecialization((await params).slug);
  if (!specialization) notFound();
  const modules = catalog.modules.filter((module) => specialization.moduleIds.includes(module.id));
  const resources = catalog.resources.filter((resource) => specialization.resourceIds.includes(resource.id));
  const checkpoints = catalog.checkpoints.filter((checkpoint) => specialization.checkpointIds.includes(checkpoint.id));
  const certifications = catalog.certifications.filter((certification) => specialization.certificationIds.includes(certification.id));

  return <ProgressProvider><div className="page-shell">
    <StructuredData data={{ '@context': 'https://schema.org', '@type': 'Course', name: label(specialization.title), description: label(specialization.summary), provider: { '@type': 'Organization', name: 'SecTrilha' }, inLanguage: 'pt-BR' }} />
    <Link href="/curriculum" className="back-link"><ArrowLeft aria-hidden="true" size={16} /> Voltar ao currículo</Link>
    <section className="level-hero" aria-labelledby="specialization-title"><p className="eyebrow">ESPECIALIZAÇÃO</p><h1 id="specialization-title">{label(specialization.title)}</h1><p>{label(specialization.summary)}</p></section>
    <SpecializationPanel specialization={specialization} skills={catalog.skills} checkpoints={catalog.checkpoints} />
    <section aria-labelledby="modules-heading"><div className="section-heading"><div><p className="eyebrow">COMPETÊNCIAS A DESENVOLVER</p><h2 id="modules-heading">Módulos</h2></div></div><div className="grid grid-2">{modules.map((module) => <article className="card module-card" key={module.id}><BookOpen aria-hidden="true" size={20} /><h3>{label(module.title)}</h3><p>{label(module.summary)}</p><span className="meta">{module.estimatedHours} h estimadas</span></article>)}</div></section>
    <CheckpointChecklist checkpoints={checkpoints} />
    <section aria-labelledby="specialization-resources"><div className="section-heading"><div><p className="eyebrow">RECURSOS CURADOS</p><h2 id="specialization-resources">Para estudar</h2></div></div><div className="grid grid-3">{resources.map((resource) => <Link className="card card-link" key={resource.id} href={`/resources/${resource.slug}`}><span className="tag">{resource.type}</span><h3>{label(resource.title)}</h3><p>{label(resource.description)}</p></Link>)}</div></section>
    {certifications.length > 0 && <section aria-labelledby="specialization-certs"><div className="section-heading"><div><p className="eyebrow">MARCO PROFISSIONAL</p><h2 id="specialization-certs">Certificações relacionadas</h2></div></div><div className="grid grid-3">{certifications.map((certification) => <Link className="card card-link certification-mini" key={certification.id} href={`/certifications/${certification.slug}`}><Award aria-hidden="true" size={20} /><h3>{label(certification.name)}</h3><p>{label(certification.description)}</p></Link>)}</div></section>}
  </div></ProgressProvider>;
}
