import { catalog } from '../src/lib/curriculum/catalog.ts';

type LinkRecord = { label: string; url: string };
type CheckResult = LinkRecord & { status: number | 'network-error'; finalUrl?: string; note?: string };

const links = [
  ...catalog.resources.flatMap((resource) => resource.url ? [{ label: `Recurso: ${resource.title.fallback}`, url: resource.url }] : []),
  ...catalog.certifications.flatMap((certification) => certification.url ? [{ label: `Certificação: ${certification.name.fallback}`, url: certification.url }] : []),
] satisfies LinkRecord[];

const uniqueLinks = Array.from(new Map(links.map((link) => [link.url, link])).values());

async function request(url: string, method: 'HEAD' | 'GET') {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    return await fetch(url, {
      method,
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'SecTrilha-Link-Checker/1.0 (+local verification)' },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function checkLink(link: LinkRecord): Promise<CheckResult> {
  try {
    const response = await request(link.url, 'HEAD');
    // Some providers deliberately do not support HEAD for content routes and
    // answer 404 even though the normal browser GET succeeds.
    const finalResponse = [404, 405, 410].includes(response.status)
      ? await request(link.url, 'GET')
      : response;
    return {
      ...link,
      status: finalResponse.status,
      finalUrl: finalResponse.url,
      note: finalResponse.status === 401 || finalResponse.status === 403 || finalResponse.status === 429
        ? 'acesso restrito por login, limite ou proteção do provedor'
        : undefined,
    };
  } catch (error) {
    return { ...link, status: 'network-error', note: error instanceof Error ? error.message : 'falha de rede' };
  }
}

async function runWithConcurrency<T, R>(items: readonly T[], limit: number, worker: (item: T) => Promise<R>) {
  const results: R[] = [];
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await worker(items[index]);
    }
  }));
  return results;
}

const results = await runWithConcurrency(uniqueLinks, 4, checkLink);
const broken = results.filter((result) => result.status === 404 || result.status === 410);
const warnings = results.filter((result) => result.status === 'network-error' || (typeof result.status === 'number' && result.status >= 500));
const restricted = results.filter((result) => result.status === 401 || result.status === 403 || result.status === 429);

for (const result of results) {
  const destination = result.finalUrl && result.finalUrl !== result.url ? ` → ${result.finalUrl}` : '';
  const detail = result.note ? ` (${result.note})` : '';
  console.log(`[${result.status}] ${result.label}: ${result.url}${destination}${detail}`);
}

console.log(`\nVerificados: ${results.length}; quebrados: ${broken.length}; acesso restrito por provedor: ${restricted.length}; avisos de rede/servidor: ${warnings.length}.`);
if (broken.length) process.exitCode = 1;
