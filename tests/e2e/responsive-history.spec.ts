import { expect, type Page } from '@playwright/test';
import {
  test,
  historyPassword,
  coursePath,
  type Fixture,
} from './helpers/history-fixtures';
import { revisionSession } from './helpers/revision-session';
import { expectNoDocumentOverflow } from './helpers/responsive-layout';

const viewports = [320, 375, 768, 1024, 1440];
const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

test.use({
  baseURL: process.env.ACCOUNT_TEST_BASE_URL ?? 'http://127.0.0.1:3100',
});
test.skip(
  !process.env.MP4_E2E_SERVICE_ROLE_KEY ||
    !/^http:\/\/(localhost|127\.0\.0\.1):54321$/.test(serviceUrl ?? ''),
  'Requires explicit local synthetic history fixtures.',
);

test('history, grade, progress, and comparison pages fit every target width', async ({
  page,
  historyFixture: data,
}) => {
  test.setTimeout(180_000);
  await patchLongComparisonSource(data);
  await revisionSession(page, data.users[1].email, historyPassword);
  await expectRouteMatrix(page, data, studentRoutes(data));
  await expectLegacyRouteMatrix(page, data);
  await verifyDarkTheme(page, data);
  await revisionSession(page, data.users[0].email, historyPassword);
  await expectRouteMatrix(page, data, instructorRoutes(data));
});

function studentRoutes(data: Fixture) {
  return [
    '/grades',
    '/progress',
    '/xp',
    '/submissions',
    `/assignments/${data.assignments[0]}`,
    `/submissions/${data.rows[0].id}`,
    `/submissions/${data.rows[1].id}/compare`,
  ];
}

function instructorRoutes(data: Fixture) {
  return [
    `/assignments/${data.assignments[0]}/edit`,
    `/assignments/${data.assignments[0]}/practice-tests`,
    `/assignments/${data.assignments[0]}/submissions`,
  ];
}

async function expectLegacyRouteMatrix(page: Page, data: Fixture) {
  const routes = [
    `/student/grades?courseId=${data.courseId}`,
    `/student/progress?courseId=${data.courseId}`,
    `/student/submissions?courseId=${data.courseId}`,
    `/student/submissions/${data.rows[0].id}`,
    `/student/submissions/${data.rows[1].id}/compare?before=1&after=2`,
  ];
  for (const width of viewports) {
    for (const route of routes) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);
      await expect(page.locator('main')).toHaveCount(1, { timeout: 10_000 });
      await expect(page.locator('main')).toBeVisible();
      await expectNoDocumentOverflow(page);
    }
  }
}

async function patchLongComparisonSource(data: Fixture) {
  const serviceKey = process.env.MP4_E2E_SERVICE_ROLE_KEY!;
  const response = await data.admin.patch(
    `${serviceUrl}/rest/v1/submissions?id=eq.${data.rows[1].id}`,
    {
      headers: {
        apikey: serviceKey,
        authorization: `Bearer ${serviceKey}`,
      },
      data: { source: `print("${'L'.repeat(2000)}")` },
    },
  );
  expect(response.ok()).toBeTruthy();
}

async function expectRouteMatrix(page: Page, data: Fixture, routes: string[]) {
  for (const width of viewports) {
    for (const route of routes) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(coursePath(data, route));
      await expect(page.locator('main')).toHaveCount(1, { timeout: 10_000 });
      await expect(page.locator('main')).toBeVisible();
      await expectNoDocumentOverflow(page);
      if (route.endsWith('/compare')) await expectComparisonRegion(page);
    }
  }
}

async function expectComparisonRegion(page: Page) {
  const region = page.getByRole('region', { name: 'Code changes' });
  await expect(region).toBeVisible();
  await region.focus();
  await expect(region).toBeFocused();
  const scroll = await region.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  expect(scroll.scrollWidth).toBeGreaterThan(scroll.clientWidth);
  await region.evaluate((element) => {
    element.scrollLeft = 400;
  });
  await expect
    .poll(() => region.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(0);
  await expectNoDocumentOverflow(page);
}

async function verifyDarkTheme(page: Page, data: Fixture) {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto(coursePath(data, '/progress'));
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect(page.locator('.app-theme')).toHaveAttribute(
    'data-theme',
    'dark',
  );
  await expectNoDocumentOverflow(page);
}
