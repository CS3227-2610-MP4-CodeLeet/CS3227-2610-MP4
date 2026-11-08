import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const base = new URL(
  process.env.DOCS_SITE_URL ?? 'http://127.0.0.1:3200/CS3227-2610-MP4/',
);
const screenshots = resolve('.runtime-cache/documentation-site');

async function checkContent(page) {
  await expect(page.locator('body')).not.toContainText(/mp3|connecttalent/i);
  const staleLinks = await page
    .locator('a')
    .evaluateAll(
      (links) =>
        links.filter((link) => /mp3|connecttalent/i.test(link.href)).length,
    );
  expect(staleLinks).toBe(0);
}

async function checkGuides(page) {
  await page
    .getByRole('link', { name: 'Read the User Guide', exact: true })
    .click();
  await expect(page).toHaveURL(new URL('docs/UserGuide/', base).href);
  await expect(
    page.getByRole('heading', { name: 'CodeLeet User Guide', exact: true }),
  ).toBeVisible();
  await checkContent(page);
  await page
    .getByRole('link', {
      name: 'Local setup in the Developer Guide',
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(
    new URL('docs/DeveloperGuide/#1-local-setup', base).href,
  );
  await expect(
    page.getByRole('heading', { name: /^1\. Local setup/ }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: '.node-version', exact: true }),
  ).toHaveAttribute('href', /\/blob\/develop\/\.node-version$/);
  await expect(
    page.getByRole('link', { name: 'Edit this page', exact: true }),
  ).toHaveAttribute('href', /\/edit\/develop\/docs\/DeveloperGuide\.md$/);
  await page.reload();
  await expect(
    page.getByRole('heading', {
      name: 'CodeLeet Developer Guide',
      exact: true,
    }),
  ).toBeAttached();
  await checkContent(page);
}

async function checkMobile(page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base.href);
  await page
    .getByRole('button', { name: 'Toggle navigation bar', exact: true })
    .click();
  await page
    .locator('.navbar-sidebar__items--show-secondary .navbar-sidebar__item')
    .last()
    .getByRole('link', { name: 'User Guide', exact: true })
    .click();
  await expect(page).toHaveURL(new URL('docs/UserGuide/', base).href);
  await expect(
    page.getByRole('heading', { name: 'CodeLeet User Guide', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'On this page', exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await expect(page.locator('.navbar-sidebar')).not.toBeInViewport();
  await page.screenshot({ path: resolve(screenshots, 'mobile-guide.png') });
  await checkContent(page);
}

const browser = await chromium.launch();
try {
  await mkdir(screenshots, { recursive: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    colorScheme: 'light',
  });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const response = await page.goto(base.href);
  expect(response.status()).toBe(200);
  await expect(
    page.getByRole('heading', { name: 'CodeLeet', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('navigation', { name: 'Docs sidebar', exact: true }),
  ).toBeVisible();
  await checkContent(page);
  await page.screenshot({ path: resolve(screenshots, 'desktop-overview.png') });
  await checkGuides(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  for (
    let attempt = 0;
    attempt < 2 &&
    (await page.locator('html').getAttribute('data-theme')) !== 'dark';
    attempt++
  ) {
    await page
      .getByRole('button', { name: /Switch between dark and light mode/ })
      .click();
  }
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.screenshot({
    path: resolve(screenshots, 'desktop-dark-guide.png'),
  });
  await checkMobile(page);
  expect(errors).toEqual([]);
  process.stdout.write(
    'Documentation browser checks passed: overview, both guides, anchors, source/edit links, reload, dark mode, mobile navigation and project-only copy.\n',
  );
} finally {
  await browser.close();
}
