import { expect, type Page } from '@playwright/test';
import { test, type ForumFixture } from './helpers/forum-fixtures';
import { expectNoDocumentOverflow } from './helpers/responsive-layout';

const viewports = [320, 375, 768, 1024, 1440];
const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const title = `Responsive discussion ${'with a deliberately long title '.repeat(3)}`;
const body = `A readable forum message. ${'More discussion text for wrapping. '.repeat(12)}\nhttps://example.test/${'responsive-check-'.repeat(30)}`;

test.use({
  baseURL: process.env.ACCOUNT_TEST_BASE_URL ?? 'http://127.0.0.1:3100',
});
test.skip(
  !process.env.MP4_E2E_SERVICE_ROLE_KEY ||
    !/^http:\/\/(localhost|127\.0\.0\.1):/.test(serviceUrl ?? ''),
  'Requires local synthetic forum fixtures.',
);

async function signIn(
  page: import('@playwright/test').Page,
  data: ForumFixture,
) {
  await page.goto('/sign-in');
  await page
    .getByLabel('Email or username', { exact: true })
    .fill(data.users[0].email);
  await page.getByLabel('Password', { exact: true }).fill(data.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(/\/courses$/);
}

async function expectForumPage(page: Page, path: string, heading: string) {
  await page.goto(path);
  const resolvedUrl = new URL(page.url());
  expect(resolvedUrl.pathname + resolvedUrl.search).toBe(path);
  await expect(page.locator('main')).toHaveCount(1, { timeout: 10_000 });
  await expect(page.locator('main')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: heading, exact: true }),
  ).toBeVisible();
  for (const width of viewports) {
    await page.setViewportSize({ width, height: 900 });
    await expectNoDocumentOverflow(page);
  }
}

test('discussion list, creation form, and long thread remain responsive', async ({
  page,
  forumFixture: data,
}) => {
  test.setTimeout(180_000);
  await signIn(page, data);
  const forumsPath = `/courses/${data.courseId}/forums`;

  await expectForumPage(page, `${forumsPath}/new`, 'New discussion');
  await page.getByLabel('Title').fill(title);
  await page.getByLabel('Message').fill(body);
  await page.getByRole('button', { name: 'Create discussion' }).click();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
  const threadId = new URL(page.url()).pathname.split('/').at(-1);
  expect(threadId).toBeTruthy();
  const threadPath = `${forumsPath}/${threadId}`;

  await expectForumPage(page, forumsPath, 'Discussions');
  await expectForumPage(page, `${forumsPath}/new`, 'New discussion');
  await expectForumPage(page, threadPath, title);
});
