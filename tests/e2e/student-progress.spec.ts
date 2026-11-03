import { expect, type Page, type APIRequestContext } from '@playwright/test';
import {
  test,
  historyPassword,
  hideFixtureAssignment,
} from './helpers/history-fixtures';
import { revisionSession } from './helpers/revision-session';

const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const headers = {
  apikey: process.env.MP4_E2E_SERVICE_ROLE_KEY!,
  authorization: `Bearer ${process.env.MP4_E2E_SERVICE_ROLE_KEY!}`,
};
const progressPath = '/student/progress';
const submittedLabel = 'Submitted assignments';
const outstandingLabel = 'Outstanding assignments';
const overdueLabel = 'Overdue assignments';
const totalsLabel = 'Assignment submission progress';
test.use({
  baseURL: process.env.ACCOUNT_TEST_BASE_URL ?? 'http://127.0.0.1:3100',
  actionTimeout: 10_000,
});
test.skip(
  !process.env.MP4_E2E_SERVICE_ROLE_KEY ||
    !/^http:\/\/(localhost|127\.0\.0\.1):54321$/.test(serviceUrl ?? ''),
  'Requires local synthetic accounts.',
);

async function cardValue(page: Page, label: string) {
  const text = await page
    .getByRole('article', { name: label, exact: true })
    .locator('p')
    .innerText();
  return Number(text.replaceAll(',', ''));
}

test('exact published assignment counts exceed the REST row limit and revisions count once', async ({
  page,
  historyFixture: data,
}) => {
  test.setTimeout(120_000);
  await revisionSession(page, data.users[1].email, historyPassword);
  await page.goto(progressPath);
  const baseline = {
    submitted: await cardValue(page, submittedLabel),
    outstanding: await cardValue(page, outstandingLabel),
    overdue: await cardValue(page, overdueLabel),
  };
  const total = Number(
    await page
      .getByRole('progressbar', { name: totalsLabel })
      .getAttribute('max'),
  );
  const extra = Array.from({ length: 1002 }, (_, index) => ({
    id: crypto.randomUUID(),
    instructor_id: data.users[0].id,
    title: `Progress count fixture ${index}`,
    instructions: 'Synthetic overview acceptance.',
    language: index % 2 ? 'java' : 'python',
    publication_status: 'published',
    due_at: index === 0 ? '2020-01-01T00:00:00Z' : null,
  }));
  try {
    const inserted = await data.admin.post(
      `${serviceUrl}/rest/v1/assignments`,
      { headers, data: extra },
    );
    expect(inserted.ok()).toBeTruthy();
    await page.reload();
    await expect(
      page.getByRole('progressbar', { name: totalsLabel }),
    ).toHaveAttribute('max', String(total + extra.length));
    expect(await cardValue(page, outstandingLabel)).toBe(
      baseline.outstanding + extra.length,
    );
    expect(await cardValue(page, overdueLabel)).toBe(baseline.overdue + 1);
    expect(await cardValue(page, submittedLabel)).toBe(2);
    await hideFixtureAssignment(data);
    await page.reload();
    await expect(
      page.getByRole('progressbar', { name: totalsLabel }),
    ).toHaveAttribute('max', String(total + extra.length - 1));
    expect(await cardValue(page, submittedLabel)).toBe(1);
    await verifyRecentPrivacy(page, data.rows);
  } finally {
    await removeExtra(data.admin, extra);
  }
});

test('own grades and upcoming work, mobile themes and existing navigation stay private', async ({
  page,
  historyFixture: data,
}) => {
  const future = new Date(Date.now() + 86_400_000).toISOString();
  expect(
    (
      await data.admin.patch(
        `${serviceUrl}/rest/v1/assignments?id=eq.${data.assignments[0]}`,
        { headers, data: { due_at: future } },
      )
    ).ok(),
  ).toBeTruthy();
  await revisionSession(page, data.users[3].email, historyPassword);
  await page.goto(progressPath);
  const comingUp = page.getByRole('region', { name: 'Coming up', exact: true });
  await expect(
    comingUp.getByRole('link', { name: data.title, exact: true }),
  ).toBeVisible();
  expect(await cardValue(page, submittedLabel)).toBe(0);
  await expect(
    page.getByText('No submissions yet.', { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText('No published grades yet.', { exact: false }),
  ).toBeVisible();
  await verifyLateSubmission(
    page,
    data.admin,
    data.assignments[1],
    data.users[3].id,
  );
  await revisionSession(page, data.users[1].email, historyPassword);
  await page.goto(`${progressPath}?student_id=${data.users[2].id}`);
  await expect(
    comingUp.getByRole('link', { name: data.title, exact: true }),
  ).toHaveCount(0);
  const grades = page.getByRole('list', { name: 'Recent published grades' });
  await expect(grades.locator('li')).toHaveCount(1);
  await expect(grades).toContainText('Score: 8');
  await expect(
    page.getByRole('article', { name: 'Total XP', exact: true }),
  ).toContainText('0');
  expect(await page.content()).not.toContain(data.peerRow.id);
  await verifyMobileNavigation(page);
});

async function verifyMobileNavigation(page: Page) {
  await page.screenshot({
    path: '.runtime-cache/progress-desktop.png',
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect(page.locator('.student-workspace[data-theme]')).toHaveAttribute(
    'data-theme',
    'dark',
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: '.runtime-cache/progress-mobile-dark.png',
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  await expect(page.locator('.student-workspace[data-theme]')).toHaveAttribute(
    'data-theme',
    'light',
  );
  await page.getByLabel('Workspace menu', { exact: true }).focus();
  await page.keyboard.press('Enter');
  await page
    .getByRole('navigation', { name: 'Student navigation' })
    .getByRole('link', { name: 'My progress', exact: true })
    .click();
  await expect(page).toHaveURL(progressPath);
  await page.getByRole('link', { name: 'View all recent submissions' }).click();
  await expect(page).toHaveURL('/student/submissions');
}

async function verifyRecentPrivacy(page: Page, rows: Array<{ id: string }>) {
  const revisions = page.getByRole('list', { name: 'Recent saved revisions' });
  await expect(revisions.locator('li')).toHaveCount(5);
  const expectedOrder = [...rows]
    .sort((a, b) => b.id.localeCompare(a.id))
    .slice(0, 5);
  for (const [index, row] of expectedOrder.entries())
    await expect(
      revisions.locator('li').nth(index).getByRole('link'),
    ).toHaveAttribute('href', `/student/submissions/${row.id}`);
  expect(await page.content()).not.toMatch(
    /HISTORY_SOURCE_SENTINEL|HISTORY_UNPUBLISHED_SECRET|HISTORY_RUBRIC_SECRET/,
  );
}

async function removeExtra(
  admin: APIRequestContext,
  rows: Array<{ id: string }>,
) {
  for (let offset = 0; offset < rows.length; offset += 100) {
    const ids = rows
      .slice(offset, offset + 100)
      .map((row) => row.id)
      .join(',');
    const removed = await admin.delete(
      `${serviceUrl}/rest/v1/assignments?id=in.(${ids})`,
      { headers },
    );
    expect(removed.ok()).toBeTruthy();
  }
}

async function verifyLateSubmission(
  page: Page,
  admin: APIRequestContext,
  assignmentId: string,
  studentId: string,
) {
  const deadline = await admin.patch(
    `${serviceUrl}/rest/v1/assignments?id=eq.${assignmentId}`,
    { headers, data: { due_at: '2020-01-01T00:00:00Z' } },
  );
  expect(deadline.ok()).toBeTruthy();
  const saved = await admin.post(`${serviceUrl}/rest/v1/submissions`, {
    headers,
    data: {
      id: crypto.randomUUID(),
      assignment_id: assignmentId,
      student_id: studentId,
      revision: 1,
      language: 'java',
      source: 'public class Main { public static void main(String[] args) {} }',
      request_id: crypto.randomUUID(),
    },
  });
  expect(saved.ok()).toBeTruthy();
  await page.reload();
  expect(await cardValue(page, submittedLabel)).toBe(1);
  await expect(
    page.getByRole('list', { name: 'Recent saved revisions' }),
  ).toContainText('Late');
}

test('signed-out and instructor accounts cannot access student progress', async ({
  page,
  historyFixture: data,
}) => {
  await page.goto(progressPath);
  await expect(page).toHaveURL('/sign-in');
  await revisionSession(page, data.users[0].email, historyPassword);
  await page.goto(progressPath);
  await expect(page).toHaveURL('/unauthorized');
});
