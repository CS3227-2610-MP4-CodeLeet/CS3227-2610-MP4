import { expect, type Page } from '@playwright/test';
import { test as forumTest } from './helpers/forum-fixtures';
import { revisionSession } from './helpers/revision-session';

const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const path = '/forums';
const discussionRegion = 'Discussions';
const searchName = 'Search discussions';
const clearName = 'Clear search';
const olderTitle = 'An older question';
const literal = 'a",b\\c.*%_([x]): é <img src=x>';
type SearchData = {
  prefix: string;
  bodyId: string;
  titleTerm: string;
  bodyTerm: string;
  replyTerm: string;
  literalTerm: string;
};

const test = forumTest.extend<{ searchData: SearchData }>({
  searchData: async ({ forumFixture: data }, provide) => {
    const prefix = `Search-${crypto.randomUUID()}`;
    const bodyId = crypto.randomUUID();
    const titleTerm = `${prefix}-title`;
    const bodyTerm = `${prefix}-body`;
    const replyTerm = `${prefix}-reply-only`;
    const literalTerm = `${prefix} ${literal}`;
    const author = {
      author_id: data.users[0].id,
      author_name: 'Search student',
      author_role: 'student',
    };
    const rows = Array.from({ length: 27 }, (_, index) => ({
      ...author,
      id: crypto.randomUUID(),
      request_id: crypto.randomUUID(),
      title: `${prefix} topic ${index}`,
      body: index === 0 ? literalTerm : 'A general opening post.',
      created_at: '2026-11-01T00:00:00Z',
    }));
    await data.write('forum_threads', [
      ...rows,
      {
        ...author,
        id: bodyId,
        request_id: crypto.randomUUID(),
        title: olderTitle,
        body: bodyTerm,
        created_at: '2010-01-01T00:00:00Z',
      },
      {
        ...author,
        id: crypto.randomUUID(),
        request_id: crypto.randomUUID(),
        title: titleTerm,
        body: 'Title search example.',
        created_at: '2009-01-01T00:00:00Z',
      },
      {
        ...author,
        id: crypto.randomUUID(),
        request_id: crypto.randomUUID(),
        title: 'Unrelated newest discussion',
        body: 'Not a match.',
        created_at: '2030-01-01T00:00:00Z',
      },
    ]);
    await data.write('forum_replies', {
      ...author,
      id: crypto.randomUUID(),
      request_id: crypto.randomUUID(),
      thread_id: bodyId,
      body: replyTerm,
    });
    await provide({
      prefix,
      bodyId,
      titleTerm,
      bodyTerm,
      replyTerm,
      literalTerm,
    });
  },
});

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

test('members find title/opening-post matches before paging and retain search navigation', async ({
  page,
  forumFixture: data,
  searchData: search,
}) => {
  await revisionSession(page, data.users[0].email, data.password);
  await page.goto(path);
  await applySearch(page, search.prefix);
  await expect(threads(page)).toHaveCount(25);
  await checkPaging(page, search.prefix);
  await checkSearchBack(page, search);
  await page.getByRole('link', { name: clearName, exact: true }).click();
  await expect(page).toHaveURL(path);
  await page.context().clearCookies();
  await revisionSession(page, data.users[1].email, data.password);
  await page.goto(path);
  await applySearch(page, search.titleTerm);
  await expect(threads(page)).toHaveCount(1);
  await checkMobileSearch(page);
});

test('search treats query grammar as literal text and keeps unauthorized access denied', async ({
  page,
  forumFixture: data,
  searchData: search,
}) => {
  await revisionSession(page, data.users[0].email, data.password);
  await page.goto(path);
  await applySearch(page, search.literalTerm);
  await expect(threads(page)).toHaveCount(1);
  await expect(page.locator('img')).toHaveCount(0);
  await applySearch(page, search.replyTerm);
  await expect(
    page.getByText('No discussions match your search.', { exact: true }),
  ).toBeVisible();
  await applySearch(page, '",id.not.is.null,title.imatch."');
  await expect(threads(page)).toHaveCount(0);
  await expect(
    page.getByText('No discussions match your search.', { exact: true }),
  ).toBeVisible();
  await checkInvalidSearches(page);
  await page.context().clearCookies();
  await page.goto(searchPath(search.prefix));
  await expect(page).toHaveURL(/\/sign-in$/);
  await revisionSession(page, data.users[2].email, data.password);
  await page.goto(searchPath(search.prefix));
  await expect(page).toHaveURL(/\/unauthorized$/);
});

function threads(page: Page) {
  return page
    .getByRole('region', { name: discussionRegion, exact: true })
    .locator('article');
}
function searchBox(page: Page) {
  return page.getByRole('searchbox', { name: searchName, exact: true });
}
function searchPath(query: string) {
  return `${path}?${new URLSearchParams({ q: query })}`;
}
async function applySearch(page: Page, query: string) {
  await searchBox(page).fill(query);
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page).toHaveURL(
    (url) =>
      url.pathname === path &&
      url.searchParams.get('q') === query &&
      !url.searchParams.has('page'),
  );
}

async function checkPaging(page: Page, query: string) {
  const next = page.getByRole('link', { name: 'Next', exact: true });
  await expect(next).toHaveAttribute('href', `${searchPath(query)}&page=2`);
  await next.click();
  await expect(page).toHaveURL(`${searchPath(query)}&page=2`);
  await expect(threads(page)).toHaveCount(4);
  await expect(
    threads(page).getByText(olderTitle, { exact: true }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Previous', exact: true }).click();
  await expect(page).toHaveURL(`${searchPath(query)}&page=1`);
  await expect(threads(page)).toHaveCount(25);
}

async function checkMobileSearch(page: Page) {
  await page.setViewportSize({ width: 375, height: 812 });
  await page
    .getByRole('button', { name: 'Switch to dark mode', exact: true })
    .click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(searchBox(page)).toBeVisible();
  await page.screenshot({
    path: 'test-results/forum-search-mobile.png',
    fullPage: true,
  });
}

async function checkSearchBack(page: Page, search: SearchData) {
  await applySearch(page, search.bodyTerm.toUpperCase());
  await expect(threads(page)).toHaveCount(1);
  await threads(page)
    .getByRole('link', { name: olderTitle, exact: true })
    .click();
  await expect(page).toHaveURL(`/forums/${search.bodyId}`);
  await page.goBack();
  await expect(searchBox(page)).toHaveValue(search.bodyTerm.toUpperCase());
  await page.reload();
  await expect(threads(page)).toHaveCount(1);
}

async function checkInvalidSearches(page: Page) {
  for (const query of [
    'q=a&q=b',
    'q=%0A',
    `q=${'a'.repeat(161)}`,
    'q=ok&page=0',
  ]) {
    await page.goto(`${path}?${query}`);
    await expect(
      page.getByRole('heading', {
        name: 'Discussion unavailable',
        exact: true,
      }),
    ).toBeVisible();
  }
  await page.goto(`${path}?q=+++`);
  await expect(searchBox(page)).toHaveValue('');
  await expect(threads(page)).toHaveCount(25);
}
