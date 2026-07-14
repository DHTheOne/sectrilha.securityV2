'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Filter, Search } from 'lucide-react';
import type {
  CurriculumResource,
  ResourceAccess,
  ResourceCollection,
  ResourceType,
  SupportedLocale,
} from '@/src/lib/curriculum/types';
import {
  getAccessLabel,
  getResourceCollectionLabel,
  getResourceTypeLabel,
  label,
} from '@/src/lib/curriculum/catalog';

const resourceTypes: ResourceType[] = [
  'course', 'book', 'video', 'lab', 'platform', 'tool', 'guide', 'framework', 'community', 'ctf', 'hardware',
];
const accesses: ResourceAccess[] = ['free', 'freemium', 'paid', 'reference'];
const languages: SupportedLocale[] = ['pt-BR', 'en-US', 'es-ES'];
const collections: ResourceCollection[] = ['legacy', 'curated'];

const resourceTopics = [
  { id: 'networking', label: 'Redes e internet', tags: ['redes', 'internet', 'tcp-ip', 'dns', 'protocolos', 'networking', 'http'] },
  { id: 'linux', label: 'Linux e terminal', tags: ['linux', 'terminal', 'shell', 'sistemas-operacionais', 'comandos'] },
  { id: 'programming', label: 'Programação e automação', tags: ['python', 'programação', 'automação', 'documentação', 'scripting'] },
  { id: 'foundations', label: 'Fundamentos e privacidade', tags: ['fundamentos', 'segurança', 'cibersegurança', 'criptografia', 'hash', 'frameworks', 'privacidade', 'boas-práticas'] },
  { id: 'pentest', label: 'Pentest e laboratórios', tags: ['pentest', 'enumeração', 'nmap', 'laboratório', 'ética', 'hands-on', 'lab', 'entry-level', 'active-directory', 'reporting'] },
  { id: 'web', label: 'Web, AppSec e OWASP', tags: ['owasp', 'web', 'appsec', 'burp-suite', 'code-review', 'secure-coding'] },
  { id: 'defense', label: 'Defesa, SOC e DFIR', tags: ['soc', 'dfir', 'incident-response', 'attack', 'detection', 'detections', 'siem', 'cis-controls', 'governança', 'defesa', 'alerts', 'triage'] },
  { id: 'cloud', label: 'Cloud e DevSecOps', tags: ['aws', 'iam', 'cloud', 'kubernetes', 'containers', 'supply-chain', 'devsecops', 'sbom'] },
] as const;

type ResourceTopic = (typeof resourceTopics)[number]['id'];
type SelectAll<T extends string> = T | 'all';

export interface ResourceFiltersProps {
  readonly resources: readonly CurriculumResource[];
  readonly initialType?: ResourceType;
  readonly initialAccess?: ResourceAccess;
  readonly initialLanguage?: SupportedLocale;
  readonly initialTopic?: ResourceTopic;
  readonly initialCollection?: ResourceCollection;
  readonly initialQuery?: string;
}

function normalizeSearchTerm(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim();
}

function matchesTopic(resource: CurriculumResource, topic: SelectAll<ResourceTopic>): boolean {
  if (topic === 'all') return true;

  const topicDefinition = resourceTopics.find((item) => item.id === topic);
  return topicDefinition ? resource.tags.some((tag) => (topicDefinition.tags as readonly string[]).includes(tag)) : true;
}

function hasSearchTerm(resource: CurriculumResource, query: string): boolean {
  if (!query) return true;

  const searchIndex = normalizeSearchTerm([
    label(resource.title),
    label(resource.description),
    resource.provider,
    ...resource.tags,
    getResourceTypeLabel(resource.type),
  ].join(' '));
  return searchIndex.includes(query);
}

export function ResourceFilters({
  resources,
  initialType,
  initialAccess,
  initialLanguage,
  initialTopic,
  initialCollection,
  initialQuery = '',
}: Readonly<ResourceFiltersProps>) {
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState<SelectAll<ResourceType>>(initialType ?? 'all');
  const [access, setAccess] = useState<SelectAll<ResourceAccess>>(initialAccess ?? 'all');
  const [language, setLanguage] = useState<SelectAll<SupportedLocale>>(initialLanguage ?? 'all');
  const [topic, setTopic] = useState<SelectAll<ResourceTopic>>(initialTopic ?? 'all');
  const [collection, setCollection] = useState<SelectAll<ResourceCollection>>(initialCollection ?? 'all');
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = normalizeSearchTerm(deferredQuery);

  const filtered = useMemo(() => resources.filter((resource) =>
    (type === 'all' || resource.type === type)
    && (access === 'all' || resource.access === access)
    && (language === 'all' || resource.languages.includes(language))
    && (collection === 'all' || resource.collection === collection)
    && matchesTopic(resource, topic)
    && hasSearchTerm(resource, normalizedQuery),
  ), [access, collection, language, normalizedQuery, resources, topic, type]);

  const clearFilters = () => {
    setQuery('');
    setType('all');
    setAccess('all');
    setLanguage('all');
    setTopic('all');
    setCollection('all');
  };

  return (
    <section aria-labelledby="resource-heading">
      <h2 id="resource-heading" className="sr-only">Resultados da biblioteca de recursos</h2>
      <div className="filter-bar resource-filter-bar" aria-label="Filtros de recursos">
        <div className="filter-label"><Filter aria-hidden="true" size={18} /><strong>Encontre um recurso</strong></div>
        <label className="resource-search-field" htmlFor="resource-search">
          Buscar
          <span className="search-control"><Search aria-hidden="true" size={16} /><input id="resource-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Assunto, ferramenta ou autor" autoComplete="off" /></span>
        </label>
        <label htmlFor="resource-type">Tipo
          <select id="resource-type" value={type} onChange={(event) => setType(event.target.value as SelectAll<ResourceType>)}>
            <option value="all">Todos</option>{resourceTypes.map((item) => <option value={item} key={item}>{getResourceTypeLabel(item)}</option>)}
          </select>
        </label>
        <label htmlFor="resource-access">Acesso
          <select id="resource-access" value={access} onChange={(event) => setAccess(event.target.value as SelectAll<ResourceAccess>)}>
            <option value="all">Todos</option>{accesses.map((item) => <option value={item} key={item}>{getAccessLabel(item)}</option>)}
          </select>
        </label>
        <label htmlFor="resource-language">Idioma
          <select id="resource-language" value={language} onChange={(event) => setLanguage(event.target.value as SelectAll<SupportedLocale>)}>
            <option value="all">Todos</option>{languages.map((item) => <option value={item} key={item}>{item}</option>)}
          </select>
        </label>
        <label htmlFor="resource-topic">Tema
          <select id="resource-topic" value={topic} onChange={(event) => setTopic(event.target.value as SelectAll<ResourceTopic>)}>
            <option value="all">Todos</option>{resourceTopics.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}
          </select>
        </label>
        <label htmlFor="resource-collection">Coleção
          <select id="resource-collection" value={collection} onChange={(event) => setCollection(event.target.value as SelectAll<ResourceCollection>)}>
            <option value="all">Todas</option>{collections.map((item) => <option value={item} key={item}>{getResourceCollectionLabel(item)}</option>)}
          </select>
        </label>
        <button className="clear-filters" type="button" onClick={clearFilters}>Limpar filtros</button>
      </div>
      <p className="result-count" aria-live="polite" aria-atomic="true">{filtered.length} {filtered.length === 1 ? 'recurso encontrado' : 'recursos encontrados'}</p>
      {filtered.length > 0 ? (
        <div className="grid grid-3">
          {filtered.map((resource) => (
            <article key={resource.id} className="card resource-card">
              <div className="tag-row">
                <span className="tag">{getResourceTypeLabel(resource.type)}</span>
                <span className="tag">{getAccessLabel(resource.access)}</span>
                {resource.collection === 'legacy' && <span className="tag">Conteúdo anterior</span>}
              </div>
              <h3><Link href={`/resources/${resource.slug}`}>{label(resource.title)}</Link></h3>
              <p>{label(resource.description)}</p>
              <div className="card-spacer" />
              <span className="meta">{resource.provider} · {resource.languages.join(', ')}</span>
              <div className="resource-actions">
                <Link className="inline-link" href={`/resources/${resource.slug}`}>Detalhes</Link>
                {resource.url && <a className="inline-link" href={resource.url} target="_blank" rel="noreferrer" aria-label={`Abrir ${label(resource.title)} no site de ${resource.provider} (nova aba)`}>Acessar <ExternalLink aria-hidden="true" size={14} /></a>}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="card resource-empty-state" role="status">
          <h3>Nenhum recurso com esses filtros</h3>
          <p>Tente outro termo de busca ou limpe os filtros para voltar à biblioteca completa.</p>
          <div><button className="clear-filters" type="button" onClick={clearFilters}>Ver todos os recursos</button></div>
        </div>
      )}
    </section>
  );
}
