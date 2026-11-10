import { expect, type Page } from '@playwright/test';
import {
  test,
  historyPassword,
  hideFixtureAssignment,
  coursePath,
} from './helpers/history-fixtures';
import {
  addFilterRevisions,
  renameFilterAssignment,
  literalFilterTitle,
  type FilterFixture,
} from './helpers/list-filter-fixtures';

const assignmentPath = '/assignments';
const historyPath = '/submissions';
const searchLabel = 'Search by assignment title';
const applyName = 'Apply filters';
const clearName = 'Clear filters';
const historyTable = 'My submitted revisions';
const noAssignments = 'No matching assignments';

test.use({
  baseURL: process.env.ACCOUNT_TEST_BASE_URL ?? 'http://127.0.0.1:3100',
  actionTimeout: 15_000,
});
test.skip(
  !process.env.MP4_E2E_SERVICE_ROLE_KEY ||
    !/^http:\/\/(localhost|127\.0\.0\.1):54321$/.test(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    ),
  'Requires explicit local synthetic account credentials.',
);

test('assignment filters combine literal titles and languages, clear, restore history and hide unpublished data', async ({
  page,
  historyFixture: data,
}) => {
  test.setTimeout(120_000);
  await signIn(page, data.users[1].email, data);
  await applyFilters(page, 'hIsToRy', 'java');
  await expect(page.getByRole('table')).toContainText('History Java');
  await expect(page.getByRole('table')).not.toContainText(data.title);
  await page.reload();
  await expect(page.getByLabel(searchLabel)).toHaveValue('hIsToRy');
  await applyFilters(page, 'no-such-title-' + crypto.randomUUID(), 'python');
  await expect(
    page.getByRole('heading', { name: noAssignments }),
  ).toBeVisible();
  await page.goBack();
  await expect(page.getByLabel('Language', { exact: true })).toHaveValue(
    'java',
  );
  await expect(page.getByRole('table')).toContainText('History Java');
  await page.getByRole('link', { name: clearName }).click();
  await expect(page).toHaveURL(coursePath(data, assignmentPath));
  await checkLiteralSearches(page, data);
  await hideFixtureAssignment(data);
  await applyFilters(page, literalFilterTitle, 'python');
  await expect(
    page.getByRole('heading', { name: noAssignments }),
  ).toBeVisible();
  await checkMobileFilters(page);
});

test('history filters run before pagination and preserve own-only hidden-title boundaries', async ({
  page,
  historyFixture: data,
}) => {
  test.setTimeout(120_000);
  await addFilterRevisions(data);
  await signIn(page, data.users[1].email, data);
  await page.goto(coursePath(data, historyPath));
  await applyFilters(page, '<IMG', 'python');
  await expect(
    page.getByRole('table', { name: historyTable }).locator('tbody tr'),
  ).toHaveCount(25);
  await page.getByRole('link', { name: 'Next', exact: true }).click();
  await expect(page).toHaveURL(/language=python.*page=2/);
  await expect(
    page.getByRole('table', { name: historyTable }).locator('tbody tr'),
  ).toHaveCount(2);
  await applyFilters(page, 'history', 'java');
  expect(new URL(page.url()).searchParams.has('page')).toBe(false);
  await expect(
    page.getByRole('table', { name: historyTable }).locator('tbody tr'),
  ).toHaveCount(2);
  await expect(
    page.locator(
      `a[href="${coursePath(data, `${historyPath}/${data.peerRow.id}`)}"]`,
    ),
  ).toHaveCount(0);
  await checkHiddenHistory(page, data);
  await checkInvalidFilters(page, data);
});

async function applyFilters(page: Page, query: string, language: string) {
  await page.getByLabel(searchLabel).fill(query);
  await page.getByLabel('Language', { exact: true }).selectOption(language);
  await page.getByRole('button', { name: applyName }).click();
  await page.waitForURL(
    (url) =>
      url.searchParams.get('q') === query &&
      url.searchParams.get('language') === language,
  );
  await expect(page.getByLabel(searchLabel)).toHaveValue(query.trim());
  await expect(page.getByLabel('Language', { exact: true })).toHaveValue(
    language,
  );
}

async function checkLiteralSearches(page: Page, data: FilterFixture) {
  await renameFilterAssignment(data);
  for (const query of ['100%', '_', '*', '[x]', '(a|b)', '\\', 'résumé']) {
    await applyFilters(page, query, 'python');
    await expect(page.getByRole('table')).toContainText(literalFilterTitle);
    await expect(
      page.locator(
        `a[href="${coursePath(data, `${assignmentPath}/${data.assignments[1]}`)}"]`,
      ),
    ).toHaveCount(0);
  }
  await applyFilters(page, '.*', '');
  await expect(
    page.getByRole('heading', { name: noAssignments }),
  ).toBeVisible();
  await applyFilters(page, '<img src=x onerror=alert(1)>', 'python');
  await expect(page.locator('main img')).toHaveCount(0);
}

async function checkHiddenHistory(page: Page, data: FilterFixture) {
  await hideFixtureAssignment(data);
  await applyFilters(page, '<img', 'python');
  await expect(
    page.getByRole('heading', { name: 'No matching submissions' }),
  ).toBeVisible();
  await applyFilters(page, '', 'python');
  await expect(
    page.getByRole('table', { name: historyTable }).locator('tbody tr'),
  ).toHaveCount(25);
  await expect(page.getByRole('table')).toContainText('Assignment unavailable');
  await page.goto(
    coursePath(
      data,
      `${historyPath}?q=History&language=java&student_id=${data.users[2].id}`,
    ),
  );
  await expect(
    page.getByRole('table', { name: historyTable }).locator('tbody tr'),
  ).toHaveCount(2);
  await expect(
    page.locator(
      `a[href="${coursePath(data, `${historyPath}/${data.peerRow.id}`)}"]`,
    ),
  ).toHaveCount(0);
  expect(await page.locator('main').innerText()).not.toMatch(
    /HISTORY_SOURCE_SENTINEL|HISTORY_RUBRIC_SECRET|HISTORY_UNPUBLISHED_SECRET/,
  );
  await page.getByRole('link', { name: clearName }).click();
  await expect(page).toHaveURL(coursePath(data, historyPath));
}

async function checkInvalidFilters(page: Page, data: FilterFixture) {
  for (const query of [
    'language=javascript',
    'q=a&q=b',
    'language=python&language=java',
    'q=' + 'x'.repeat(161),
  ]) {
    await page.goto(coursePath(data, `${historyPath}?${query}`));
    await expect(page.getByText('This page could not be found.')).toBeVisible();
  }
}

async function checkMobileFilters(page: Page) {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole('button', { name: /Switch to .* mode/ }).click();
  await expect(page.getByRole('button', { name: applyName })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: 'test-results/student-list-filters-mobile.png',
    fullPage: true,
  });
}

async function signIn(page: Page, email: string, data: FilterFixture) {
  await page.goto('/sign-in');
  await page.getByLabel('Email or username').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(historyPassword);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(/\/courses$/);
  await page.goto(coursePath(data, assignmentPath));
  await expect(page).toHaveURL(coursePath(data, assignmentPath));
}
