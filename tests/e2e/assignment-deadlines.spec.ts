import { expect, type Page } from '@playwright/test';
import {
  test,
  setDeadline,
  saveRevision,
  dueLabel,
  sources,
  serviceUrl,
  appUrl,
  deadlineHeaders as headers,
} from './helpers/deadline-fixtures';
import { revisionSession } from './helpers/revision-session';

test.use({ baseURL: appUrl, actionTimeout: 10_000 });
test.skip(
  !process.env.MP4_E2E_SERVICE_ROLE_KEY ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    !/^http:\/\/(localhost|127\.0\.0\.1):54321$/.test(serviceUrl ?? ''),
  'Requires local synthetic accounts.',
);
const lateStatus = 'Submitted late';
const noDeadline = 'No deadline';
const overdue = 'Overdue';
const listPath = '/student/assignments';
const futureInput = '2999-01-01T00:30';
const pastInput = '2000-01-01T08:00';

for (const [index, language] of ['Python', 'Java'].entries()) {
  test(`${language}: accepts late saves, retains captured timing on retries and uses extended/cleared deadlines`, async ({
    page,
    draftFixture: data,
    deadlineData: fixture,
  }) => {
    const assignmentId = data.assignments[index];
    await setDeadline(page, data, assignmentId, pastInput);
    await revisionSession(page, data.users[1].email, data.password);
    await checkAssignmentStatus(page, assignmentId, overdue);
    const first = await saveRevision(page, assignmentId, index);
    expect(first.submission.is_late).toBe(true);
    expect(Date.parse(first.submission.due_at_submission)).toBe(
      Date.parse('2000-01-01T00:00:00Z'),
    );
    await expect(page.getByText(lateStatus, { exact: true })).toBeVisible();
    await checkRevisionViews(page, first.submission.id);
    await setDeadline(page, data, assignmentId, futureInput);
    await revisionSession(page, data.users[1].email, data.password);
    await checkRetry(page, first);
    const second = await saveRevision(page, assignmentId, index);
    expect(second.submission.is_late).toBe(false);
    expect(second.submission.revision).toBe(2);
    await checkClearAndHistory(page, {
      data,
      assignmentId,
      firstId: first.submission.id,
    });
    const grades = await fixture.admin.get(
      `${serviceUrl}/rest/v1/grades?submission_id=eq.${first.submission.id}&select=id`,
      { headers },
    );
    expect(await grades.json()).toEqual([]);
  });
}

test('instructor creates an SGT deadline, edits without losing seconds and clears it', async ({
  page,
  draftFixture: data,
}) => {
  await revisionSession(page, data.users[0].email, data.password);
  await page.goto('/instructor/assignments/new');
  await page
    .getByLabel('Title', { exact: true })
    .fill('Deadline authoring example');
  await page
    .getByLabel('Instructions', { exact: true })
    .fill('Print one value.');
  await page.getByLabel('Language', { exact: true }).selectOption('java');
  await page
    .getByRole('combobox', { name: 'Status', exact: true })
    .selectOption('published');
  await page.getByLabel(dueLabel, { exact: true }).fill(futureInput);
  const pending = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/assignments') &&
      response.request().method() === 'POST',
  );
  await page
    .getByRole('button', { name: 'Save assignment', exact: true })
    .click();
  const response = await pending;
  expect(response.status()).toBe(201);
  const { assignment } = await response.json();
  data.assignments.push(assignment.id);
  expect(Date.parse(assignment.due_at)).toBe(
    Date.parse('2998-12-31T16:30:00Z'),
  );
  await checkUnchangedPrecision(
    page,
    assignment.id,
    response.request().postDataJSON(),
  );
  await setDeadline(page, data, assignment.id, '');
  await expect(
    page
      .getByRole('article')
      .filter({
        has: page.getByRole('heading', {
          name: 'Deadline authoring example updated',
        }),
      })
      .getByText(noDeadline, { exact: true }),
  ).toBeVisible();
});

test('latest own status ignores peer saves and forged identity, with mobile and timing privacy', async ({
  page,
  draftFixture: data,
  deadlineData: fixture,
}) => {
  const assignmentId = data.assignments[0];
  await setDeadline(page, data, assignmentId, pastInput);
  const seeded = await fixture.admin.post(`${serviceUrl}/rest/v1/submissions`, {
    headers,
    data: {
      id: fixture.peerRevision,
      assignment_id: assignmentId,
      student_id: fixture.peerId,
      source: 'print("private peer timing")',
      revision: 1,
      request_id: crypto.randomUUID(),
    },
  });
  expect(seeded.ok()).toBeTruthy();
  await revisionSession(page, data.users[1].email, data.password);
  await page.goto(`${listPath}?student_id=${fixture.peerId}`);
  const row = page
    .getByRole('row')
    .filter({ has: page.locator(`a[href="${listPath}/${assignmentId}"]`) });
  await expect(
    row.getByRole('cell').nth(2).getByText(overdue, { exact: true }),
  ).toBeVisible();
  await checkAssignmentStatus(page, data.assignments[1], 'Not submitted');
  await page.goto(`${listPath}/${assignmentId}`);
  await checkMobileTheme(page);
  const denied = await page.request.get(
    `/api/submissions/${fixture.peerRevision}`,
  );
  expect(denied.status()).toBe(404);
  const forged = await page.request.post('/api/submissions', {
    headers: { origin: appUrl },
    data: {
      assignmentId,
      source: sources[0],
      requestId: crypto.randomUUID(),
      is_late: false,
      created_at: '1900-01-01T00:00:00Z',
    },
  });
  expect(forged.status()).toBe(400);
  await expect(
    page.getByText('private peer timing', { exact: false }),
  ).toHaveCount(0);
});

async function checkAssignmentStatus(page: Page, id: string, status: string) {
  await page.goto(listPath);
  const row = page
    .getByRole('row')
    .filter({ has: page.locator(`a[href="${listPath}/${id}"]`) });
  await expect(
    row.getByRole('cell').nth(2).getByText(status, { exact: true }),
  ).toBeVisible();
}

async function checkRevisionViews(page: Page, id: string) {
  await page.goto(`/student/submissions/${id}`);
  await expect(page.getByText('Late', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Due when submitted:', { exact: false }),
  ).toBeVisible();
  await page.goto('/student/submissions');
  const row = page
    .getByRole('row')
    .filter({ has: page.locator(`a[href="/student/submissions/${id}"]`) });
  await expect(row.getByText('Late', { exact: true })).toBeVisible();
}

async function checkRetry(
  page: Page,
  first: {
    payload: unknown;
    submission: { id: string; created_at: string; due_at_submission: string };
  },
) {
  const retried = await page.request.post('/api/submissions', {
    headers: { origin: appUrl },
    data: first.payload,
  });
  expect(retried.status()).toBe(201);
  const { submission } = await retried.json();
  expect(submission.id).toBe(first.submission.id);
  expect(submission.created_at).toBe(first.submission.created_at);
  expect(submission.due_at_submission).toBe(first.submission.due_at_submission);
  expect(submission.is_late).toBe(true);
}

async function checkClearAndHistory(
  page: Page,
  context: {
    data: { users: Array<{ email: string }>; password: string };
    assignmentId: string;
    firstId: string;
  },
) {
  await setDeadline(page, context.data, context.assignmentId, '');
  await page.goto(`/instructor/submissions/${context.firstId}`);
  await expect(page.getByText('Late', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Due when submitted:', { exact: false }),
  ).toBeVisible();
  await revisionSession(
    page,
    context.data.users[1].email,
    context.data.password,
  );
  await page.goto(`${listPath}/${context.assignmentId}`);
  await expect(page.getByText(noDeadline, { exact: true })).toBeVisible();
  await expect(page.getByText('Submitted', { exact: true })).toBeVisible();
}

async function checkUnchangedPrecision(
  page: Page,
  id: string,
  payload: Record<string, unknown>,
) {
  const dueAt = '2998-12-31T16:30:45.123Z';
  const updated = await page.request.patch(`/api/assignments/${id}`, {
    headers: { origin: appUrl },
    data: { ...payload, dueAt, expectedVersion: 1 },
  });
  expect(updated.status()).toBe(200);
  await page.goto(`/instructor/assignments/${id}/edit`);
  await expect(page.getByLabel(dueLabel, { exact: true })).toHaveValue(
    futureInput,
  );
  await page
    .getByLabel('Title', { exact: true })
    .fill('Deadline authoring example updated');
  const response = page.waitForResponse(
    (result) =>
      result.url().endsWith(`/api/assignments/${id}`) &&
      result.request().method() === 'PATCH',
  );
  await page
    .getByRole('button', { name: 'Save assignment', exact: true })
    .click();
  const result = await response;
  expect(result.status()).toBe(200);
  expect(Date.parse((await result.json()).assignment.due_at)).toBe(
    Date.parse(dueAt),
  );
  await expect(page).toHaveURL('/instructor');
}

async function checkMobileTheme(page: Page) {
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(
    page.getByText('You can still submit.', { exact: true }),
  ).toBeVisible();
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
  await page.screenshot({
    path: '.runtime-cache/assignment-deadlines-mobile.png',
  });
}
