import { expect, type Page } from '@playwright/test';
import { test, type ForumFixture } from './helpers/forum-fixtures';
const signOutLabel = 'Sign out';
const instructorName = 'Forum Instructor';

test.use({
  baseURL: process.env.ACCOUNT_TEST_BASE_URL ?? 'http://127.0.0.1:3100',
});
test.skip(
  !process.env.MP4_E2E_SERVICE_ROLE_KEY ||
    !/^http:\/\/(localhost|127\.0\.0\.1):/.test(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    ),
  'Requires explicit local Supabase fixture credentials.',
);

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/sign-in');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(/\/(student\/assignments|instructor|unauthorized)?$/);
}

test('both roles create and reply, safe text, retained errors, navigation and mobile theme', async ({
  page,
  forumFixture: data,
}) => {
  await page.goto('/forums');
  await expect(page).toHaveURL(/\/sign-in$/);
  await signIn(page, data.users[0].email, data.password);
  await page
    .getByRole('navigation', { name: 'Student navigation' })
    .getByRole('link', { name: 'Forums', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Forums', exact: true }),
  ).toBeVisible();
  const path = await createDiscussion(page);
  await postReply(page, 'Student reply');
  await verifyInstructorReply(page, data, path);
  await mobileCheck(page);
  const badOrigin = await page.request.post('/api/forums/posts', {
    headers: { Origin: 'https://foreign.example' },
    data: { title: 'Bad', body: 'Bad', requestId: crypto.randomUUID() },
  });
  expect(badOrigin.status()).toBe(403);
});

async function createDiscussion(page: Page) {
  await page.getByRole('link', { name: 'New discussion', exact: true }).click();
  const title = `Question ${crypto.randomUUID()} <img src=x onerror=alert(1)>`;
  await page.getByLabel('Title', { exact: true }).fill(title);
  await page
    .getByLabel('Message', { exact: true })
    .fill('<script>alert("text only")</script>\nHow do loops work?');
  await page.route('**/api/forums/posts', (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: { message: 'Try again shortly.' } }),
    }),
  );
  await page.getByRole('button', { name: 'Create discussion' }).click();
  await expect(page.locator('form').getByRole('alert')).toContainText(
    'Try again',
  );
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue(title);
  await page.unroute('**/api/forums/posts');
  await page.getByRole('button', { name: 'Create discussion' }).click();
  await expect(
    page.getByRole('heading', { name: title, exact: true }),
  ).toBeVisible();
  await expect(page.locator('main img')).toHaveCount(0);
  await expect(page.locator('main')).toContainText(
    '<script>alert("text only")</script>',
  );
  const path = new URL(page.url()).pathname;
  await page.reload();
  await expect(
    page.getByRole('heading', { name: title, exact: true }),
  ).toBeVisible();
  return path;
}

async function verifyInstructorReply(
  page: Page,
  data: ForumFixture,
  path: string,
) {
  await page.getByRole('button', { name: signOutLabel, exact: true }).click();
  await signIn(page, data.users[1].email, data.password);
  await page.getByRole('link', { name: 'Forums', exact: true }).click();
  await page.goto(path);
  await postReply(page, 'Instructor reply <b>plain text</b>');
  await expect(
    page.getByRole('region', { name: 'Replies', exact: true }),
  ).toContainText(instructorName);
  await page.getByRole('button', { name: signOutLabel, exact: true }).click();
  await signIn(page, data.users[0].email, data.password);
  await page.goto(path);
}

async function postReply(page: Page, text: string) {
  await page.getByLabel('Your reply', { exact: true }).fill(text);
  const posted = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/forums/posts') &&
      response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Post reply', exact: true }).click();
  expect((await posted).status()).toBe(201);
  await expect(
    page.getByRole('region', { name: 'Replies', exact: true }),
  ).toContainText(text);
  await expect(page.getByLabel('Your reply', { exact: true })).toHaveValue('');
}

async function mobileCheck(page: Page) {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByLabel('Workspace menu').click();
  await expect(
    page
      .getByRole('navigation', { name: 'Student navigation' })
      .getByRole('link', { name: 'Forums', exact: true }),
  ).toBeVisible();
  await page.getByLabel('Workspace menu').click();
  await page
    .getByRole('button', { name: /Switch to (dark|light) mode/ })
    .click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: 'test-results/forums-mobile.png',
    fullPage: true,
  });
}

test('thread and reply paging, missing pages and unprovisioned denial', async ({
  page,
  forumFixture: data,
}) => {
  const threads = Array.from({ length: 26 }, (_, index) => ({
    id: crypto.randomUUID(),
    author_id: data.users[1].id,
    author_name: instructorName,
    author_role: 'instructor',
    title: `Paging discussion ${index + 1}`,
    body: 'Synthetic paging fixture',
    request_id: crypto.randomUUID(),
    created_at: '2040-01-01T00:00:00Z',
  }));
  await data.write('forum_threads', threads);
  await data.write(
    'forum_replies',
    threads.map((_, index) => ({
      id: crypto.randomUUID(),
      thread_id: threads[0].id,
      author_id: data.users[1].id,
      author_name: instructorName,
      author_role: 'instructor',
      body: `Paging reply ${index + 1}`,
      request_id: crypto.randomUUID(),
      created_at: '2040-01-01T00:00:00Z',
    })),
  );
  await signIn(page, data.users[0].email, data.password);
  await page.goto('/forums');
  await expect(
    page.getByRole('region', { name: 'Discussions' }).locator('article'),
  ).toHaveCount(25);
  await page.getByRole('link', { name: 'Next', exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(
    page.getByRole('link', { name: 'Previous', exact: true }),
  ).toBeVisible();
  await page.goto(`/forums/${threads[0].id}`);
  await expect(
    page
      .getByRole('region', { name: 'Replies', exact: true })
      .locator('article'),
  ).toHaveCount(25);
  await page.getByRole('link', { name: 'Next', exact: true }).click();
  await expect(
    page
      .getByRole('region', { name: 'Replies', exact: true })
      .locator('article'),
  ).toHaveCount(1);
  await verifyMissingPages(page);
  await page.goto('/forums');
  await page.getByRole('button', { name: signOutLabel, exact: true }).click();
  await signIn(page, data.users[2].email, data.password);
  await page.goto('/forums');
  await expect(page).toHaveURL(/\/unauthorized$/);
});

async function verifyMissingPages(page: Page) {
  await page.goto('/forums/not-a-uuid');
  await expect(
    page.getByRole('heading', { name: 'Discussion unavailable' }),
  ).toBeVisible();
  await page.goto('/forums?page=0');
  await expect(
    page.getByRole('heading', { name: 'Discussion unavailable' }),
  ).toBeVisible();
}
