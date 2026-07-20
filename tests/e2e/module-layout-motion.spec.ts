import { expect, test, type Page } from '@playwright/test';
import { catalog } from '../../src/lib/curriculum/catalog';

const modulePaths = catalog.modules.map(
  (module) => `/curriculum/${module.levelId}/modules/${module.slug}`,
);

const themeIds = [
  'original',
  'sentinela-ciano',
  'zero-trust-violeta',
  'firewall-rubi',
  'criptografia-esmeralda',
  'grafite-ambar',
  'azul-forense',
  'light-pro',
  'dark-minimal',
  'dark-premium',
] as const;

async function expectComfortableCtaGap(page: Page) {
  const tags = page.locator('.module-page .level-hero > .tag-row');
  const cta = page.getByRole('link', { name: /Ver recursos para começar/i });
  const [tagsBox, ctaBox] = await Promise.all([tags.boundingBox(), cta.boundingBox()]);

  expect(tagsBox).not.toBeNull();
  expect(ctaBox).not.toBeNull();
  expect(ctaBox!.y - (tagsBox!.y + tagsBox!.height)).toBeGreaterThanOrEqual(24);
}

test.describe('module hero layout', () => {
  test('all generated module routes keep the metadata away from the CTA', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1280, height: 900 });

    for (const path of modulePaths) {
      await page.goto(path);
      await expectComfortableCtaGap(page);
    }
  });

  for (const width of [320, 390, 768, 1024, 1440]) {
    test(`the networking module keeps the CTA spacing at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/curriculum/level-0/modules/foundations-networking');
      await expectComfortableCtaGap(page);

      const dimensions = await page.locator('html').evaluate((element) => ({
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
      }));
      expect(dimensions.scrollWidth).toBe(dimensions.clientWidth);
    });
  }

  test('the CTA target clears the sticky header', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/curriculum/level-0/modules/foundations-networking');
    await page.getByRole('link', { name: /Ver recursos para começar/i }).click();
    await expect(page).toHaveURL(/#module-resources$/);

    const [headerBox, targetBox] = await Promise.all([
      page.locator('.site-header').boundingBox(),
      page.locator('#module-resources').boundingBox(),
    ]);
    expect(headerBox).not.toBeNull();
    expect(targetBox).not.toBeNull();
    expect(targetBox!.y).toBeGreaterThanOrEqual(headerBox!.y + headerBox!.height - 1);
  });

  test('every theme preserves the module layout on mobile and desktop', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/curriculum/level-0/modules/foundations-networking');

    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });

      for (const themeId of themeIds) {
        await page.locator('html').evaluate(
          (element, theme) => element.setAttribute('data-theme', theme),
          themeId,
        );
        await expect(page.locator('html')).toHaveAttribute('data-theme', themeId);
        await expectComfortableCtaGap(page);

        const dimensions = await page.locator('html').evaluate((element) => ({
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
        }));
        expect(
          dimensions.scrollWidth,
          `${themeId} at ${width}px should not overflow horizontally`,
        ).toBe(dimensions.clientWidth);
      }
    }
  });
});

test.describe('motion accessibility and reveal behavior', () => {
  test('a selected panel does not also animate its selected descendants', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 520 });
    await page.goto('/curriculum/level-0/modules/foundations-networking');

    const panel = page.locator('.module-objectives');
    const nestedHeading = panel.locator('.section-heading');
    await expect(panel).toHaveClass(/reveal-pending/);
    await expect(nestedHeading).not.toHaveClass(/reveal-pending|reveal-in/);

    await panel.scrollIntoViewIfNeeded();
    await expect(panel).not.toHaveClass(/reveal-pending/, { timeout: 2_000 });
    await expect(panel).not.toHaveCSS('opacity', '0');
  });

  test('reduced motion never hides reveal candidates', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 390, height: 520 });
    await page.goto('/curriculum/level-0/modules/foundations-networking');

    await expect(page.locator('.reveal-pending')).toHaveCount(0);
    await expect(page.locator('.module-objectives')).not.toHaveCSS('opacity', '0');
    await expect(page.locator('.page-shell')).toHaveCSS('animation-name', 'none');
  });

  test('all reveal candidates become visible after a full-page scroll', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 600 });
    await page.goto('/curriculum/level-0/modules/foundations-networking');
    await page.evaluate(async () => {
      const step = Math.max(1, Math.floor(window.innerHeight * 0.75));
      for (let top = 0; top < document.documentElement.scrollHeight; top += step) {
        window.scrollTo(0, top);
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      }
      window.scrollTo(0, document.documentElement.scrollHeight);
    });
    await page.waitForTimeout(700);

    await expect(page.locator('.reveal-pending')).toHaveCount(0);
    await expect(page.locator('.reveal-in')).toHaveCount(0);
  });
});

test.describe('compositor-friendly state motion', () => {
  test('progress visuals use scaleX instead of animating width', async ({ page }) => {
    await page.goto('/curriculum');
    const progress = page.locator('.progress-track > span').first();

    await expect(progress).toHaveAttribute('style', /transform:\s*scaleX\(/);
    await expect(progress).not.toHaveAttribute('style', /width:/);
    const transformOrigin = await progress.evaluate((element) => {
      const [x, y] = getComputedStyle(element)
        .transformOrigin.split(' ')
        .map(Number.parseFloat);

      return {
        x,
        y,
        height: element.getBoundingClientRect().height,
      };
    });

    expect(transformOrigin.x).toBe(0);
    expect(transformOrigin.y).toBeCloseTo(transformOrigin.height / 2, 1);
  });

  test('the brand signal uses a transform-and-opacity ring', async ({ page }) => {
    await page.goto('/');
    await page.locator('.brand').hover();

    const signal = await page.locator('.brand-mark').evaluate((element) => {
      const style = getComputedStyle(element, '::after');
      return {
        animationName: style.animationName,
        content: style.content,
      };
    });
    expect(signal.content).toBe('""');
    expect(signal.animationName).toBe('signal-ring');
  });

  test('the brand signal is disabled with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.locator('.brand').hover();

    const animationName = await page.locator('.brand-mark').evaluate(
      (element) => getComputedStyle(element, '::after').animationName,
    );
    expect(animationName).toBe('none');
  });
});
