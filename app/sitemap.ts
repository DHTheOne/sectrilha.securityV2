import type { MetadataRoute } from 'next';
import { catalog } from '@/src/lib/curriculum/catalog';
import { SITE_URL as baseUrl } from '@/src/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    '', '/start', '/curriculum', '/curriculum/specializations', '/certifications', '/resources', '/resources/videos', '/resources/previous',
    ...catalog.levels.map((level) => `/curriculum/${level.slug}`),
    ...catalog.modules.map((module) => `/curriculum/${module.levelId}/modules/${module.slug}`),
    ...catalog.specializations.map((specialization) => `/curriculum/specializations/${specialization.slug}`),
    ...catalog.certifications.map((certification) => `/certifications/${certification.slug}`),
    ...catalog.resources.map((resource) => `/resources/${resource.slug}`),
  ];
  return paths.map((path) => ({ url: `${baseUrl}${path}`, lastModified: new Date(catalog.metadata.sourceUpdatedAt), changeFrequency: 'weekly', priority: path === '/curriculum' ? 1 : 0.7 }));
}
