import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpen, GraduationCap, ListChecks, PlayCircle } from 'lucide-react';
import { notFound } from 'next/navigation';
import { CheckpointChecklist } from '../../components/checkpoint-checklist';
import { ProgressProvider } from '../../components/progress-provider';
import { StructuredData } from '../../components/structured-data';
import { catalog, getLevel, getLevelCheckpoints, getLevelModules, getResourceTypeLabel, label } from '@/src/lib/curriculum/catalog';

export const revalidate = 86_400;

type PageProps = { params: Promise<{ levelId: string }> };

export function generateStaticParams() {
  return catalog.levels.map((level) => ({ levelId: level.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { levelId } = await params;
  const level = getLevel(levelId);
  if (!level) return {};
  return {
    title: `${label(level.title)} — Nível ${level.order}`,
    description: label(level.summary),
    alternates: { canonical: `/curriculum/${level.slug}` },
  };
}

export default async function LevelPage({ params }: PageProps) {
  const { levelId } = await params;
  const level = getLevel(levelId);
  if (!level) notFound();

  const modules = getLevelModules(level.id);
  const checkpoints = getLevelCheckpoints(level.id);
  const resources = catalog.resources.filter((resource) => resource.levelIds.includes(level.id));
  const resourcesById = new Map(catalog.resources.map((resource) => [resource.id, resource]));
  const portugueseVideos = resources.filter((resource) => resource.type === 'video' && resource.languages.includes('pt-BR'));
  const certifications = catalog.certifications.filter((certification) => certification.levelIds.includes(level.id));

  return (
    <ProgressProvider>
      <div className="page-shell">
        <StructuredData data={{
          '@context': 'https://schema.org', '@type': 'Course', name: `${label(level.title)} — SecTrilha`,
          description: label(level.summary), inLanguage: 'pt-BR', educationalLevel: `Level ${level.order}`,
          timeRequired: `P${level.duration.minWeeks}W`, provider: { '@type': 'Organization', name: 'SecTrilha' },
          hasCourseInstance: modules.map((module) => ({ '@type': 'CourseInstance', name: label(module.title), courseMode: 'online' })),
        }} />
        <Link href="/curriculum" className="back-link"><ArrowLeft aria-hidden="true" size={16} /> Voltar às trilhas</Link>
        <section className="level-hero" aria-labelledby="level-title">
          <span className="level-number">Nível {level.order}</span>
          <h1 id="level-title">{label(level.title)}</h1>
          <p>{label(level.summary)}</p>
          <div className="tag-row"><span className="tag">{level.duration.minWeeks}–{level.duration.maxWeeks} semanas</span><span className="tag">{modules.length} módulos</span><span className="tag">{checkpoints.length} checkpoints</span></div>
          <div className="button-row">
            <a className="button button-primary" href="#modules-heading">Escolher um módulo <ArrowRight aria-hidden="true" size={17} /></a>
            {portugueseVideos.length > 0 && <Link className="button button-secondary" href="/resources/videos"><PlayCircle aria-hidden="true" size={17} /> Vídeos em português</Link>}
          </div>
        </section>

        <section aria-labelledby="modules-heading">
          <div className="section-heading"><div><p className="eyebrow">COMECE POR UM TEMA</p><h2 id="modules-heading">Módulos</h2></div><span className="muted">Abra um módulo para ver a sequência de estudo.</span></div>
          <div className="grid grid-2">
            {modules.map((module) => {
              const moduleResources = module.resourceIds.map((resourceId) => resourcesById.get(resourceId)).filter((resource) => resource !== undefined);
              return (
                <article key={module.id} className="card module-card">
                  <div className="module-icon"><BookOpen aria-hidden="true" size={20} /></div>
                  <h3>{label(module.title)}</h3><p>{label(module.summary)}</p>
                  <div className="tag-row">{module.skillIds.slice(0, 4).map((skill) => <span className="tag" key={skill}>{skill.replaceAll('-', ' ')}</span>)}</div>
                  <div className="module-resource-list" aria-label={`Recursos de ${label(module.title)}`}>
                    {moduleResources.slice(0, 3).map((resource) => resource && <Link key={resource.id} href={`/resources/${resource.slug}`}>{label(resource.title)}</Link>)}
                  </div>
                  <div className="module-card-footer"><span className="meta">Estimativa: {module.estimatedHours} h</span><Link className="inline-link" href={`/curriculum/${level.slug}/modules/${module.slug}`}>Estudar este módulo <ArrowRight aria-hidden="true" size={15} /></Link></div>
                </article>
              );
            })}
          </div>
        </section>

        {portugueseVideos.length > 0 && <section aria-labelledby="videos-heading">
          <div className="section-heading"><div><p className="eyebrow">APRENDA ASSISTINDO</p><h2 id="videos-heading">Vídeos em português deste nível</h2></div><Link className="inline-link" href="/resources/videos">Ver todos os vídeos</Link></div>
          <div className="grid grid-3">
            {portugueseVideos.map((resource) => <Link key={resource.id} href={`/resources/${resource.slug}`} className="card card-link resource-quick-card"><span className="tag">Vídeo · PT-BR</span><h3>{label(resource.title)}</h3><p>{label(resource.description)}</p><span className="meta">{resource.provider}</span></Link>)}
          </div>
        </section>}

        <CheckpointChecklist checkpoints={checkpoints} />

        <section aria-labelledby="resources-heading">
          <div className="section-heading"><div><p className="eyebrow">PRÁTICA E REFERÊNCIA</p><h2 id="resources-heading">Todos os recursos deste nível</h2></div><Link className="inline-link" href="/resources">Abrir a biblioteca</Link></div>
          <div className="grid grid-3">
            {resources.map((resource) => <Link key={resource.id} href={`/resources/${resource.slug}`} className="card card-link"><span className="tag">{getResourceTypeLabel(resource.type)}</span><h3>{label(resource.title)}</h3><p>{label(resource.description)}</p><span className="meta">{resource.provider} · {resource.languages.join(', ')}</span></Link>)}
          </div>
        </section>

        {certifications.length > 0 && <section aria-labelledby="certifications-heading">
          <div className="section-heading"><div><p className="eyebrow">CERTIFICAÇÕES OPCIONAIS</p><h2 id="certifications-heading">Marcos possíveis</h2></div></div>
          <div className="grid grid-3">{certifications.map((certification) => <Link key={certification.id} href={`/certifications/${certification.slug}`} className="card card-link certification-mini"><GraduationCap aria-hidden="true" size={20} /><h3>{label(certification.name)}</h3><p>{label(certification.description)}</p></Link>)}</div>
        </section>}
        <aside className="ethical-note"><ListChecks aria-hidden="true" size={18} /><p>Pratique somente em laboratórios próprios, plataformas educacionais ou ambientes com autorização explícita.</p></aside>
      </div>
    </ProgressProvider>
  );
}
