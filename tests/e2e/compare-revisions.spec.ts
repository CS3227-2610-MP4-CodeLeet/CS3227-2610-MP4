import { expect, type Page } from '@playwright/test';
import {
  test,
  comparisonHeaders as headers,
  comparisonSources,
} from './helpers/comparison-fixtures';
import { revisionSession } from './helpers/revision-session';

const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const compareName = 'Compare revisions';
const changesName = 'Revision changes';
const beforeName = 'From revision';
const afterName = 'To revision';
const noChanges = 'No changes between these revisions.';
const unavailable = 'Assignment unavailable';

test.use({
  baseURL: process.env.ACCOUNT_TEST_BASE_URL ?? 'http://127.0.0.1:3100',
  actionTimeout: 10_000,
});
test.skip(
  !process.env.MP4_E2E_SERVICE_ROLE_KEY ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    !/^http:\/\/(localhost|127\.0\.0\.1):54321$/.test(serviceUrl ?? ''),
  'Requires local synthetic accounts.',
);

for (const [index, language] of ['Python', 'Java'].entries()) {
  test(`${language}: compare, select, refresh and go Back without changing source`, async ({
    page,
    draftFixture: data,
    comparisonFixture: fixture,
  }) => {
    await revisionSession(page, data.users[1].email, data.password);
    const id = fixture.ids[index][1];
    await page.goto(`/student/submissions/${id}`);
    await page.getByRole('link', { name: compareName, exact: true }).click();
    await checkInitialComparison(page);
    const table = page.getByRole('table', { name: changesName });
    await selectRevisions(page, '2', '3');
    await expect(page.getByText(noChanges, { exact: true })).toBeVisible();
    await page.reload();
    await checkSelection(page, '2', '3');
    await selectRevisions(page, '3', '1');
    await expect(table).toBeVisible();
    await page.goBack();
    await expect(page.getByText(noChanges, { exact: true })).toBeVisible();
    await expect(page.getByLabel(beforeName, { exact: true })).toHaveValue('2');
    await selectRevisions(page, '1', '1');
    await expect(page.getByText(noChanges, { exact: true })).toBeVisible();
    const stored = await fixture.admin.get(
      `${serviceUrl}/rest/v1/submissions?assignment_id=eq.${data.assignments[index]}&student_id=eq.${data.users[1].id}&select=source,revision&order=revision`,
      { headers },
    );
    expect(await stored.json()).toEqual(
      comparisonSources[index]
        .concat(comparisonSources[index][1])
        .map((source, offset) => ({ source, revision: offset + 1 })),
    );
  });
}

test('default, hidden and single-revision states support mobile and both themes', async ({
  page,
  draftFixture: data,
  comparisonFixture: fixture,
}) => {
  await revisionSession(page, data.users[1].email, data.password);
  const path = comparisonPath(fixture.ids[0][0]);
  await page.goto(path);
  await expect(page.getByLabel(beforeName, { exact: true })).toHaveValue('1');
  await expect(page.getByLabel(afterName, { exact: true })).toHaveValue('3');
  await checkMobileTheme(page);
  const hide = await fixture.admin.patch(
    `${serviceUrl}/rest/v1/assignments?id=eq.${data.assignments[0]}`,
    { headers, data: { publication_status: 'draft' } },
  );
  expect(hide.ok()).toBeTruthy();
  await page.reload();
  await expect(page.getByText(unavailable, { exact: true })).toBeVisible();
  await expect(
    page.getByText(`Draft safeguard python ${data.assignments[0]}`, {
      exact: true,
    }),
  ).toHaveCount(0);
  const remove = await fixture.admin.delete(
    `${serviceUrl}/rest/v1/submissions?assignment_id=eq.${data.assignments[0]}&student_id=eq.${data.users[1].id}&revision=gt.1`,
    { headers },
  );
  expect(remove.ok()).toBeTruthy();
  await page.reload();
  await expect(
    page.getByText('Save another revision to compare changes.', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Compare', exact: true }),
  ).toHaveCount(0);
});

test('denies peer, malformed and unavailable selections and verifies identity and roles', async ({
  page,
  draftFixture: data,
  comparisonFixture: fixture,
}) => {
  await revisionSession(page, data.users[1].email, data.password);
  const path = comparisonPath(fixture.ids[0][1]);
  for (const target of [
    comparisonPath(fixture.peerRevision),
    comparisonPath('bad-id'),
    `${path}?before=1&before=2`,
    `${path}?after=4`,
    `${path}?before=-1`,
    `${path}?after=${fixture.ids[1][0]}`,
  ]) {
    await page.goto(target);
    await expect(page.getByText('This page could not be found.')).toBeVisible();
    await expect(
      page.getByText('private peer code', { exact: false }),
    ).toHaveCount(0);
  }
  await page.goto(`${path}?student_id=${fixture.peerId}&before=1&after=2`);
  await expect(page.getByRole('table', { name: changesName })).toBeVisible();
  await expect(
    page.getByText('private peer code', { exact: false }),
  ).toHaveCount(0);
  await page.context().clearCookies();
  await page.goto(path);
  await expect(page).toHaveURL(/\/sign-in$/);
  await revisionSession(page, data.users[0].email, data.password);
  await page.goto(path);
  await expect(page).toHaveURL(/\/unauthorized$/);
});

function comparisonPath(id: string) {
  return `/student/submissions/${id}/compare`;
}

async function checkInitialComparison(page: Page) {
  await expect(page.getByRole('heading', { name: compareName })).toBeVisible();
  await checkSelection(page, '1', '2');
  const table = page.getByRole('table', { name: changesName });
  await expect(table.getByText('Removed', { exact: true })).toHaveCount(1);
  await expect(table.getByText('Added', { exact: true })).toHaveCount(1);
  await expect(page.locator('img')).toHaveCount(0);
}

async function selectRevisions(page: Page, before: string, after: string) {
  await page.getByLabel(beforeName, { exact: true }).fill(before);
  await page.getByLabel(afterName, { exact: true }).fill(after);
  await page.getByRole('button', { name: 'Compare', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`before=${before}&after=${after}$`));
}

async function checkSelection(page: Page, before: string, after: string) {
  await expect(page.getByLabel(beforeName, { exact: true })).toHaveValue(
    before,
  );
  await expect(page.getByLabel(afterName, { exact: true })).toHaveValue(after);
}

async function checkMobileTheme(page: Page) {
  await page.setViewportSize({ width: 375, height: 812 });
  const region = page.getByRole('region', {
    name: 'Code changes',
    exact: true,
  });
  await region.focus();
  await expect(region).toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole('button', { name: 'Switch to dark mode', exact: true })
    .click();
  await expect(page.locator('.student-workspace')).toHaveAttribute(
    'data-theme',
    'dark',
  );
  await page
    .getByRole('button', { name: 'Switch to light mode', exact: true })
    .click();
  await expect(page.locator('.student-workspace')).toHaveAttribute(
    'data-theme',
    'light',
  );
  await page.screenshot({
    path: '.runtime-cache/compare-revisions-mobile.png',
  });
}
