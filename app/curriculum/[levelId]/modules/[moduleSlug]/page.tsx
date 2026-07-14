import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ExternalLink, ListChecks } from 'lucide-react';
import { notFound } from 'next/navigation';
import { CheckpointChecklist } from '../../../../components/checkpoint-checklist';
import { ProgressProvider } from '../../../../components/progress-provider';
import { StructuredData } from '../../../../components/structured-data';
import { catalog, getLevel, getModule, getResourceTypeLabel, label } from '@/src/lib/curriculum/catalog';

export const revalidate = 86_400;

type PageProps = { params: Promise<{ levelId: string; moduleSlug: string }> };

export function generateStaticParams() {
  return catalog.modules.map((module) => ({ levelId: module.levelId, moduleSlug: module.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { levelId, moduleSlug } = await params;
  const level = getLevel(levelId);
  const module = getModule(moduleSlug);
  if (!level || !module || module.levelId !== level.id) return {};
  return { title: label(module.title), description: label(module.summary), alternates: { canonical: `/curriculum/${level.slug}/modules/${module.slug}` } };
}

export default async function ModulePage({ params }: PageProps) {
  const { levelId, moduleSlug } = await params;
  const level = getLevel(levelId);
  const module = getModule(moduleSlug);
  if (!level || !module || module.levelId !== level.id) notFound();

  const resourcesById = new Map(catalog.resources.map((resource) => [resource.id, resource]));
  const resources = module.resourceIds.map((resourceId) => resourcesById.get(resourceId)).filter((resource) => resource !== undefined);
  const checkpoints = catalog.checkpoints.filter((checkpoint) => module.checkpointIds.includes(checkpoint.id));

  return (
    <ProgressProvider>
      <div className="page-shell module-page">
        <StructuredData data={{ '@context': 'https://schema.org', '@type': 'Course', name: label(module.title), description: label(module.summary), inLanguage: 'pt-BR', educationalLevel: `Nível ${level.order}`, provider: { '@type': 'Organization', name: 'SecTrilha' } }} />
        <Link href={`/curriculum/${level.slug}`} className="back-link"><ArrowLeft aria-hidden="true" size={16} /> Voltar ao nível {level.order}</Link>
        <section className="level-hero" aria-labelledby="module-title">
          <p className="eyebrow">NÍVEL {level.order} · MÓDULO GUIADO</p>
          <h1 id="module-title">{label(module.title)}</h1>
          <p>{label(module.summary)}</p>
          <div className="tag-row"><span className="tag">{module.estimatedHours} h estimadas</span>{module.skillIds.map((skill) => <span className="tag" key={skill}>{skill.replaceAll('-', ' ')}</span>)}</div>
          <a className="button button-primary" href="#module-resources">Ver recursos para começar <ArrowRight aria-hidden="true" size={17} /></a>
        </section>

        <section className="module-objectives panel" aria-labelledby="objectives-heading">
          <div className="section-heading compact-heading"><div><p className="eyebrow">AO FINAL, VOCÊ DEVE CONSEGUIR</p><h2 id="objectives-heading">Objetivos de aprendizagem</h2></div></div>
          <ul className="objective-list">{module.learningObjectives.map((objective) => <li key={objective.key}><CheckCircle2 aria-hidden="true" size={19} />{label(objective)}</li>)}</ul>
        </section>

        <section id="module-resources" aria-labelledby="module-resources-heading">
          <div className="section-heading"><div><p className="eyebrow">SEQUÊNCIA RECOMENDADA</p><h2 id="module-resources-heading">Recursos para este módulo</h2></div><Link className="inline-link" href="/resources">Pesquisar na biblioteca</Link></div>
          <div className="grid grid-3">
            {resources.map((resource, index) => resource && <article className="card resource-card" key={resource.id}>
              <span className="tag">Passo {index + 1} · {getResourceTypeLabel(resource.type)}</span>
              <h3><Link href={`/resources/${resource.slug}`}>{label(resource.title)}</Link></h3>
              <p>{label(resource.description)}</p>
              <div className="card-spacer" />
              <span className="meta">{resource.provider} · {resource.languages.join(', ')}</span>
              <div className="resource-actions"><Link className="inline-link" href={`/resources/${resource.slug}`}>Ver detalhes</Link>{resource.url && <a className="inline-link" href={resource.url} target="_blank" rel="noreferrer">Acessar <ExternalLink aria-hidden="true" size={14} /></a>}</div>
            </article>)}
          </div>
        </section>

        <CheckpointChecklist checkpoints={checkpoints} />
        <aside className="ethical-note"><ListChecks aria-hidden="true" size={18} /><p>Use ferramentas e técnicas somente em ambientes próprios, laboratórios educacionais ou sistemas com autorização explícita.</p></aside>
        <Link className="button button-secondary module-return" href={`/curriculum/${level.slug}`}><BookOpen aria-hidden="true" size={17} /> Ver outros módulos do nível</Link>
      </div>
    </ProgressProvider>
  );
}
