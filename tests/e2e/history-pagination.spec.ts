import {
  test,
  historyPassword,
  addHistoryRevision,
} from './helpers/history-fixtures';
import { expect, type Page } from '@playwright/test';
import { revisionSession } from './helpers/revision-session';
import { addFilterRevisions } from './helpers/list-filter-fixtures';

test.skip(
  !process.env.MP4_E2E_SERVICE_ROLE_KEY ||
    !/^http:\/\/(localhost|127\.0\.0\.1):54321$/.test(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    ),
  'Requires explicit local synthetic Supabase fixtures.',
);

async function visibleIds(page: Page) {
  return page
    .getByRole('table', { name: 'My submitted revisions' })
    .locator('tbody a')
    .evaluateAll((links) =>
      links.map((link) => link.getAttribute('href')!.split('/').at(-1)!),
    );
}

test('new revisions between history pages do not repeat or skip existing revisions', async ({
  page,
  historyFixture: data,
}) => {
  await revisionSession(page, data.users[1].email, historyPassword);
  await page.goto(`/courses/${data.courseId}/submissions`);
  await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(25);
  const firstIds = await visibleIds(page);
  const next = await page
    .getByRole('link', { name: 'Next', exact: true })
    .getAttribute('href');
  const newestId = await addHistoryRevision(data);
  await page.goto(next!);
  await expect(page.getByText('Page 2', { exact: true })).toBeVisible();
  const secondIds = await visibleIds(page);
  expect(secondIds.filter((id) => firstIds.includes(id))).toEqual([]);
  expect([...firstIds, ...secondIds].toSorted()).toEqual(
    data.rows.map((row) => row.id).toSorted(),
  );
  await checkReturnNavigation(page, firstIds, secondIds, newestId);
});

async function checkReturnNavigation(
  page: Page,
  firstIds: string[],
  secondIds: string[],
  newestId: string,
) {
  await page.reload();
  expect(await visibleIds(page)).toEqual(secondIds);
  await page.getByRole('link', { name: 'Previous', exact: true }).click();
  await expect(page.getByText('Page 1', { exact: true })).toBeVisible();
  expect(await visibleIds(page)).toEqual(firstIds);
  await page.goBack();
  await expect(page.getByText('Page 2', { exact: true })).toBeVisible();
  expect(await visibleIds(page)).toEqual(secondIds);
  await page
    .getByRole('link', { name: 'Latest submissions', exact: true })
    .click();
  await expect(page.getByText('Page 1', { exact: true })).toBeVisible();
  expect((await visibleIds(page))[0]).toBe(newestId);
}

// A stable cursor belongs to the filtered result, not to an unfiltered page.
test('history cursors retain title/language filters and discard position on filter changes', async ({
  page,
  historyFixture: data,
}) => {
  await addFilterRevisions(data);
  await revisionSession(page, data.users[1].email, historyPassword);
  await page.goto(
    `/courses/${data.courseId}/submissions?q=%3Cimg&language=python`,
  );
  await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(25);
  const firstIds = await visibleIds(page);
  const next = await page
    .getByRole('link', { name: 'Next', exact: true })
    .getAttribute('href');
  await addHistoryRevision(data);
  await page.goto(next!);
  await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(2);
  const secondIds = await visibleIds(page);
  expect([...firstIds, ...secondIds].toSorted()).toEqual(
    data.rows
      .filter((row) => row.assignment_id === data.assignments[0])
      .map((row) => row.id)
      .toSorted(),
  );
  await page.getByLabel('Search by assignment title').fill('history');
  await page.getByLabel('Language', { exact: true }).selectOption('java');
  await page.getByRole('button', { name: 'Apply filters' }).click();
  await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(2);
  await expect(page.getByRole('table')).toContainText('History Java');
  expect(new URL(page.url()).searchParams.has('after')).toBe(false);
  expect(new URL(page.url()).searchParams.has('before')).toBe(false);
  expect(new URL(page.url()).searchParams.has('page')).toBe(false);
});
