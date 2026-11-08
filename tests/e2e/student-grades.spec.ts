import { expect, type Page } from '@playwright/test';
import {
  test,
  historyPassword,
  hideFixtureAssignment,
  coursePath,
} from './helpers/history-fixtures';
import { revisionSession } from './helpers/revision-session';

const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const headers = {
  apikey: process.env.MP4_E2E_SERVICE_ROLE_KEY!,
  authorization: `Bearer ${process.env.MP4_E2E_SERVICE_ROLE_KEY!}`,
};
const gradesPath = '/student/grades';
const listName = 'Published grades';
const titleSearch = 'Search by assignment title';
const languageFilter = 'Language';
const applyName = 'Apply filters';
const clearName = 'Clear filters';
const unavailableTitle = 'Assignment unavailable';

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

test('lists only own published feedback, links revision, handles hidden titles and mobile theme', async ({
  page,
  historyFixture: data,
}) => {
  await revisionSession(page, data.users[1].email, historyPassword);
  await page.goto(coursePath(data, '/student/assignments'));
  await page
    .getByRole('link', { name: 'My grades', exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(coursePath(data, gradesPath));
  await expect(
    page.getByRole('list', { name: listName }).locator('article'),
  ).toHaveCount(1);
  await checkPrivateMarkup(page);
  await page.getByText('Instructor feedback', { exact: true }).click();
  await expect(
    page.getByText('Visible published feedback', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Score: 8', { exact: true })).toBeVisible();
  await page
    .getByRole('link', { name: `View ${data.title}, revision 1`, exact: true })
    .click();
  await expect(page).toHaveURL(
    coursePath(data, `/student/submissions/${data.rows[0].id}`),
  );
  await hideFixtureAssignment(data);
  await page.goto(coursePath(data, gradesPath));
  await expect(
    page.getByRole('heading', { name: unavailableTitle, exact: true }),
  ).toBeVisible();
  await checkMobileTheme(page);
  await page.getByLabel(titleSearch).fill('History');
  await page.getByRole('button', { name: applyName }).click();
  await expect(
    page.getByRole('heading', { name: 'No matching grades' }),
  ).toBeVisible();
  await checkRoleBoundaries(page, data);
});

test('filters before stable paging, preserves URL state and never loads draft or peer records', async ({
  page,
  historyFixture: data,
}) => {
  await seedPublishedGrades(data);
  await revisionSession(page, data.users[1].email, historyPassword);
  await page.goto(coursePath(data, gradesPath));
  const cards = page.getByRole('list', { name: listName }).locator('article');
  await expect(cards).toHaveCount(25);
  const expected = data.rows
    .filter((_, index) => index !== 1)
    .sort((a, b) => b.id.localeCompare(a.id));
  // Grade IDs below equal submission IDs, so hand-written tie ordering is testable.
  await expect(
    cards.first().getByRole('link', { name: /^View / }),
  ).toHaveAttribute(
    'href',
    coursePath(data, `/student/submissions/${expected[0].id}`),
  );
  await page.getByRole('link', { name: 'Next', exact: true }).click();
  await expect(page).toHaveURL(coursePath(data, `${gradesPath}?page=2`));
  await expect(cards).toHaveCount(1);
  await applyJavaFilter(page, data);
  await expect(cards).toHaveCount(2);
  await expect(
    page.getByRole('navigation', { name: 'Grade pages' }),
  ).toHaveCount(0);
  await checkFilterState(page, data);
  await checkFilteredPages(page, data);
  await checkInvalidQueries(page, data.users[2].id, data);
});

test('empty accounts and published feedback changes are reflected without exposing drafts', async ({
  page,
  historyFixture: data,
}) => {
  await revisionSession(page, data.users[3].email, historyPassword);
  await page.goto(coursePath(data, gradesPath));
  await expect(
    page.getByRole('heading', { name: 'No published grades yet' }),
  ).toBeVisible();
  await page.context().clearCookies();
  await revisionSession(page, data.users[1].email, historyPassword);
  const response = await data.admin.patch(
    `${serviceUrl}/rest/v1/grades?submission_id=eq.${data.rows[0].id}`,
    {
      headers,
      data: {
        feedback: '<img src=x onerror=alert(1)>\nUpdated feedback',
        total_score: 0,
      },
    },
  );
  expect(response.ok()).toBeTruthy();
  await page.goto(coursePath(data, gradesPath));
  await page.getByText('Instructor feedback', { exact: true }).click();
  await expect(page.getByText('Score: 0', { exact: true })).toBeVisible();
  await expect(
    page.getByText('<img src=x onerror=alert(1)>\nUpdated feedback', {
      exact: true,
    }),
  ).toBeVisible();
  await checkPrivateMarkup(page);
  const hidden = await data.admin.patch(
    `${serviceUrl}/rest/v1/grades?submission_id=eq.${data.rows[0].id}`,
    { headers, data: { published_at: null } },
  );
  expect(hidden.ok()).toBeTruthy();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'No published grades yet' }),
  ).toBeVisible();
});

type HistoryFixture = Parameters<typeof hideFixtureAssignment>[0];

async function seedPublishedGrades(data: HistoryFixture) {
  const renamed = await data.admin.patch(
    `${serviceUrl}/rest/v1/assignments?id=eq.${data.assignments[1]}`,
    { headers, data: { title: 'History [literal]*%_ Java' } },
  );
  expect(renamed.ok()).toBeTruthy();
  const removed = await data.admin.delete(
    `${serviceUrl}/rest/v1/grades?submission_id=eq.${data.rows[0].id}`,
    { headers },
  );
  expect(removed.ok()).toBeTruthy();
  const own = data.rows
    .filter((_, index) => index !== 1)
    .map((row) => ({
      id: row.id,
      submission_id: row.id,
      instructor_id: data.users[0].id,
      feedback: 'Published paging feedback',
      total_score: 7,
      published_at: '2026-11-01T00:00:00Z',
      scores: {},
    }));
  const created = await data.admin.post(`${serviceUrl}/rest/v1/grades`, {
    headers,
    data: [
      ...own,
      {
        id: data.peerRow.id,
        submission_id: data.peerRow.id,
        instructor_id: data.users[0].id,
        feedback: 'PEER_GRADE_SECRET',
        total_score: 99,
        published_at: '2026-11-01T00:00:00Z',
        scores: {},
      },
    ],
  });
  expect(created.ok()).toBeTruthy();
}

async function applyJavaFilter(page: Page, data: HistoryFixture) {
  await page.getByLabel(languageFilter, { exact: true }).selectOption('java');
  await page.getByRole('button', { name: applyName }).click();
  await expect(page).toHaveURL(
    (url) =>
      url.pathname === gradesPath &&
      url.searchParams.get('courseId') === data.courseId &&
      url.searchParams.get('language') === 'java' &&
      !url.searchParams.has('page'),
  );
}

async function checkPrivateMarkup(page: Page) {
  expect(await page.content()).not.toMatch(
    /HISTORY_SOURCE_SENTINEL|HISTORY_RUBRIC_SECRET|HISTORY_UNPUBLISHED_SECRET|PEER_GRADE_SECRET/,
  );
  await expect(page.locator('img')).toHaveCount(0);
}

async function checkMobileTheme(page: Page) {
  await page.setViewportSize({ width: 375, height: 812 });
  const toggle = page.getByRole('button', {
    name: 'Switch to dark mode',
    exact: true,
  });
  await toggle.click();
  await expect(page.locator('.student-workspace')).toHaveAttribute(
    'data-theme',
    'dark',
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: 'test-results/student-grades-mobile.png',
    fullPage: true,
  });
}

async function checkRoleBoundaries(page: Page, data: HistoryFixture) {
  await page.context().clearCookies();
  await page.goto(coursePath(data, gradesPath));
  await expect(page).toHaveURL(/\/sign-in$/);
  await revisionSession(page, data.users[0].email, historyPassword);
  await page.goto(coursePath(data, gradesPath));
  await expect(page).toHaveURL(/\/unauthorized$/);
}

async function checkFilterState(page: Page, data: HistoryFixture) {
  await page.reload();
  await expect(page.getByLabel(languageFilter, { exact: true })).toHaveValue(
    'java',
  );
  await page.getByLabel(titleSearch).fill('HISTORY [literal]*%_ JAVA');
  await page.getByRole('button', { name: applyName }).click();
  await expect(page).toHaveURL(
    (url) =>
      url.searchParams.get('q') === 'HISTORY [literal]*%_ JAVA' &&
      url.searchParams.get('courseId') === data.courseId &&
      url.searchParams.get('language') === 'java',
  );
  await expect(
    page.getByRole('list', { name: listName }).locator('article'),
  ).toHaveCount(2);
  await page.getByRole('link', { name: clearName }).click();
  await expect(page).toHaveURL(coursePath(data, gradesPath));
}

async function checkFilteredPages(page: Page, data: HistoryFixture) {
  await page.getByLabel(titleSearch).fill('History');
  await page.getByRole('button', { name: applyName }).click();
  const next = page.getByRole('link', { name: 'Next', exact: true });
  await expect(next).toHaveAttribute(
    'href',
    coursePath(data, `${gradesPath}?q=History&page=2`),
  );
  await next.click();
  await expect(page).toHaveURL(
    coursePath(data, `${gradesPath}?q=History&page=2`),
  );
  await expect(
    page.getByRole('list', { name: listName }).locator('article'),
  ).toHaveCount(1);
  await page.getByRole('link', { name: 'Previous', exact: true }).click();
  await expect(page).toHaveURL(coursePath(data, `${gradesPath}?q=History`));
  await expect(
    page.getByRole('list', { name: listName }).locator('article'),
  ).toHaveCount(25);
}

async function checkInvalidQueries(
  page: Page,
  peerId: string,
  data: HistoryFixture,
) {
  for (const query of [
    'page=0',
    'page=1&page=2',
    'language=ruby',
    'language=python&language=java',
    `q=${'a'.repeat(161)}`,
  ]) {
    await page.goto(coursePath(data, `${gradesPath}?${query}`));
    await expect(
      page.getByRole('heading', {
        name: 'Grades page unavailable',
        exact: true,
      }),
    ).toBeVisible();
  }
  await page.goto(
    coursePath(data, `${gradesPath}?studentId=${peerId}&user_id=${peerId}`),
  );
  await expect(
    page.getByRole('list', { name: listName }).locator('article'),
  ).toHaveCount(25);
  await checkPrivateMarkup(page);
}
