import { expect, type Page } from '@playwright/test';
import {
  test,
  historyPassword,
  hideFixtureAssignment,
  coursePath,
} from './helpers/history-fixtures';

const listName = 'My submissions';
const listPath = '/submissions';
const tableName = 'My submitted revisions';
const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
test.use({
  actionTimeout: 15_000,
  baseURL: process.env.ACCOUNT_TEST_BASE_URL ?? 'http://127.0.0.1:3100',
});
test.skip(
  !process.env.MP4_E2E_SERVICE_ROLE_KEY ||
    !/^http:\/\/(localhost|127\.0\.0\.1):54321$/.test(serviceUrl ?? ''),
  'Requires explicit local Supabase fixtures.',
);

test('My submissions pages only own revisions, links feedback/grades and protects identity', async ({
  page,
  historyFixture: data,
}) => {
  test.setTimeout(120_000);
  await page.goto(coursePath(data, listPath));
  await expect(page).toHaveURL(/\/sign-in$/);
  await signIn(page, data.users[1].email);
  await page.goto(coursePath(data, listPath));
  await checkFirstPage(page, data);
  await checkPagination(
    page,
    data.rows.map((row) => row.id),
  );
  await checkDetails(page, data, data.rows[0], true);
  await checkDetails(page, data, data.rows[1], false);
  await hideFixtureAssignment(data);
  await page.goto(coursePath(data, listPath));
  await expect(
    page
      .getByRole('table', { name: tableName })
      .getByText('Assignment unavailable')
      .first(),
  ).toBeVisible();
  await page.goto(coursePath(data, `${listPath}?page=10000`));
  await expect(
    page.getByRole('heading', { name: listName, exact: true }),
  ).toBeVisible();
  await page.goto(coursePath(data, `${listPath}?page=0`));
  await expect(page.getByText('This page could not be found.')).toBeVisible();
  await page.goto(coursePath(data, listPath));
  await checkOtherAccounts(page, data);
});

type Fixture = Parameters<typeof hideFixtureAssignment>[0];

async function checkFirstPage(page: Page, data: Fixture) {
  await expect(
    page.getByRole('heading', { name: listName, exact: true }),
  ).toBeVisible();
  const nav = page.getByRole('navigation', { name: 'Course section links' });
  const submissionsLink = nav.getByRole('link', {
    name: listName,
    exact: true,
  });
  await expect(submissionsLink).toHaveAttribute('aria-current', 'page');
  await expect(submissionsLink).toHaveAttribute(
    'href',
    coursePath(data, listPath),
  );
  await expect(
    page.getByRole('table', { name: tableName }).locator('tbody tr'),
  ).toHaveCount(25);
  await expect(page.locator('img')).toHaveCount(0);
  expect(await page.content()).not.toMatch(
    /HISTORY_SOURCE_SENTINEL|HISTORY_RUBRIC_SECRET|HISTORY_UNPUBLISHED_SECRET/,
  );
  await page.screenshot({
    path: 'test-results/my-submissions-desktop.png',
    fullPage: true,
  });
  await checkMobileNavigation(page, data);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(
    coursePath(data, `${listPath}?student_id=${data.users[2].id}`),
  );
  await expect(
    page.locator(
      `a[href="${coursePath(data, `${listPath}/${data.peerRow.id}`)}"]`,
    ),
  ).toHaveCount(0);
}

async function checkMobileNavigation(page: Page, data: Fixture) {
  for (const width of [320, 375]) {
    await page.setViewportSize({ width, height: 812 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const opener = page.getByLabel('Open navigation menu', { exact: true });
    await opener.click();
    const mobileDrawer = page.getByRole('dialog', {
      name: 'Course navigation',
    });
    const mobileTitle = await mobileDrawer.getByRole('heading').boundingBox();
    const close = mobileDrawer.getByRole('button', {
      name: 'Close navigation menu',
    });
    const closeButton = await close.boundingBox();
    expect(
      mobileTitle &&
        closeButton &&
        mobileTitle.x + mobileTitle.width < closeButton.x,
    ).toBe(true);
    await expect(close).toBeFocused();
    await expect(
      mobileDrawer
        .getByRole('navigation', { name: 'Course section links' })
        .getByRole('link', { name: listName, exact: true }),
    ).toHaveAttribute('href', coursePath(data, listPath));
    await page.keyboard.press('Escape');
    await expect(mobileDrawer).not.toBeVisible();
    await expect(opener).toBeFocused();
  }
  await page.screenshot({
    path: 'test-results/my-submissions-mobile.png',
    fullPage: true,
  });
}

async function checkPagination(page: Page, ids: string[]) {
  const table = page.getByRole('table', { name: tableName });
  await expect(table.locator('tbody tr')).toHaveCount(25);
  const expected = ids.toSorted((a, b) => b.localeCompare(a));
  expect(
    await table
      .locator('tbody a')
      .evaluateAll((links) =>
        links.map((node) => node.getAttribute('href')?.split('/').at(-1)),
      ),
  ).toEqual(expected.slice(0, 25));
  await page.getByRole('link', { name: 'Next', exact: true }).click();
  await expect(page).toHaveURL(/page=2&after=/);
  await expect(table.locator('tbody tr')).toHaveCount(2);
  expect(
    await table
      .locator('tbody a')
      .evaluateAll((links) =>
        links.map((node) => node.getAttribute('href')?.split('/').at(-1)),
      ),
  ).toEqual(expected.slice(25));
  await expect(
    page.getByRole('link', { name: 'Next', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('link', { name: 'Previous', exact: true }).click();
  await expect(table.locator('tbody tr')).toHaveCount(25);
}

async function checkDetails(
  page: Page,
  data: Fixture,
  row: Fixture['rows'][number],
  published: boolean,
) {
  await page.goto(coursePath(data, `${listPath}/${row.id}`));
  await expect(page.locator('pre code')).toHaveText(row.source);
  await expect(
    page.getByRole('heading', { name: 'Learning feedback' }),
  ).toBeVisible();
  if (published)
    await expect(
      page.getByRole('heading', { name: 'Published grade: 8' }),
    ).toBeVisible();
  else
    await expect(
      page.getByText('No grade has been published for this revision.'),
    ).toBeVisible();
  await expect(page.getByText('HISTORY_UNPUBLISHED_SECRET')).toHaveCount(0);
  await page
    .getByRole('link', { name: 'All submissions', exact: true })
    .click();
  await expect(page).toHaveURL(coursePath(data, listPath));
}

async function checkOtherAccounts(page: Page, data: Fixture) {
  await signOut(page);
  await signIn(page, data.users[2].email);
  await page.goto(
    coursePath(data, `${listPath}?student_id=${data.users[1].id}`),
  );
  await expect(
    page.getByRole('table', { name: tableName }).locator('tbody tr'),
  ).toHaveCount(1);
  await expect(
    page.locator(
      `a[href="${coursePath(data, `${listPath}/${data.rows[0].id}`)}"]`,
    ),
  ).toHaveCount(0);
  await page.goto(coursePath(data, `${listPath}/${data.rows[0].id}`));
  await expect(page.getByText('This page could not be found.')).toBeVisible();
  await expect(page.locator('pre code')).toHaveCount(0);
  expect(
    (
      await page.request.get(
        `/api/submissions/${data.rows[0].id}?courseId=${data.courseId}`,
      )
    ).status(),
  ).toBe(404);
  await page.goto(coursePath(data, listPath));
  await signOut(page);
  await signIn(page, data.users[3].email);
  await page.goto(coursePath(data, listPath));
  await expect(
    page.getByRole('heading', { name: 'No submissions yet' }),
  ).toBeVisible();
  await signOut(page);
  await signIn(page, data.users[0].email);
  await page.goto(coursePath(data, listPath));
  await expect(
    page.getByRole('heading', { name: 'Submissions' }),
  ).toBeVisible();
  await expect(page.getByRole('table', { name: tableName })).toHaveCount(0);
}

async function signIn(page: Page, email: string) {
  await page.goto('/sign-in');
  await page.getByLabel('Email or username').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(historyPassword);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).not.toHaveURL(/\/sign-in$/);
}
async function signOut(page: Page) {
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
}
