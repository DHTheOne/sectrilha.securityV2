import { expect, test } from '@playwright/test';

test('curriculum routes are indexable and checkpoints are operable by keyboard', async ({ page }) => {
  await page.goto('/curriculum/level-0');
  await expect(page).toHaveTitle(/Fundamentos de TI/i);
  await expect(page.getByRole('heading', { name: 'Checkpoints' })).toBeVisible();

  const firstCheckpoint = page.getByRole('checkbox').first();
  await expect(firstCheckpoint).toBeEnabled();
  await firstCheckpoint.focus();
  await firstCheckpoint.press('Space');
  await expect(firstCheckpoint).toBeChecked();

  await page.goto('/resources/portswigger-academy');
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
});

test('public pages do not load third-party tracking resources', async ({ page }) => {
  const externalRequests = new Set<string>();
  const localOrigin = 'http://127.0.0.1:3000';

  page.on('request', (request) => {
    const url = new URL(request.url());
    if ((url.protocol === 'http:' || url.protocol === 'https:') && url.origin !== localOrigin) {
      externalRequests.add(url.origin);
    }
  });

  const response = await page.goto('/');
  expect(response?.headers()['content-security-policy']).toContain("connect-src 'self'");
  await expect(page.getByRole('heading', { name: /Aprenda cibersegurança/i })).toBeVisible();
  expect([...externalRequests]).toEqual([]);
});

test('Portuguese resources can be found with the language filter', async ({ page }) => {
  await page.goto('/resources');
  await page.getByLabel('Idioma').selectOption('pt-BR');
  await expect(page.getByText('Curso de Redes de Computadores', { exact: true })).toBeVisible();
  await expect(page.getByText('Controles CIS', { exact: true })).toBeVisible();
});

test('the resource library exposes Portuguese videos, the previous collection, and search', async ({ page }) => {
  await page.goto('/resources/videos');
  await expect(page.getByRole('heading', { name: 'Vídeos em português' })).toBeVisible();
  await expect(page.getByText('Como a Internet funciona?', { exact: true })).toBeVisible();

  await page.getByLabel('Buscar').fill('Nmap');
  await expect(page.getByText('Nmap: introdução', { exact: true })).toBeVisible();

  await page.goto('/resources/previous');
  await expect(page.getByRole('heading', { name: 'Conteúdos anteriores' })).toBeVisible();
  await expect(page.getByText('Curso de Redes de Computadores', { exact: true })).toBeVisible();
});

test('the getting-started guide leads into an interactive module path', async ({ page }) => {
  await page.goto('/start');
  await expect(page.getByRole('heading', { name: /caminho simples/i })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Abrir o nível 0' })).toBeVisible();

  await page.goto('/curriculum/level-0');
  const moduleLink = page.getByRole('link', { name: /Estudar este módulo/i }).first();
  await expect(moduleLink).toBeVisible();
  await moduleLink.click();
  await expect(page).toHaveURL(/\/curriculum\/level-0\/modules\//);
  await expect(page.getByRole('heading', { name: /Redes e internet/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Recursos para este módulo/i })).toBeVisible();
});

test('the mobile menu exposes the learning library without a hidden navigation path', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const menu = page.locator('.mobile-nav summary');
  await expect(menu).toBeVisible();
  await menu.click();
  await page.getByRole('link', { name: 'Vídeos em PT' }).click();
  await expect(page.getByRole('heading', { name: 'Vídeos em português' })).toBeVisible();
});

test('resource shortcut calls to action align in the desktop grid', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/resources');

  const actions = page.locator('.resource-directory-card .inline-link');
  await expect(actions).toHaveCount(3);

  const actionTops = await actions.evaluateAll((elements) =>
    elements.map((element) => element.getBoundingClientRect().top),
  );
  expect(Math.max(...actionTops) - Math.min(...actionTops)).toBeLessThanOrEqual(1);
});
