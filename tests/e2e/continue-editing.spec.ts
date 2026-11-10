import { expect, type Page, type APIRequestContext } from '@playwright/test';
import { test as draftTest } from './helpers/draft-fixtures';
import { revisionSession } from './helpers/revision-session';

const appUrl = process.env.ACCOUNT_TEST_BASE_URL ?? 'http://127.0.0.1:3100';
const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const headers = {
  apikey: process.env.MP4_E2E_SERVICE_ROLE_KEY!,
  authorization: `Bearer ${process.env.MP4_E2E_SERVICE_ROLE_KEY!}`,
};
const submitName = 'Submit revision';
const dirtyText = 'Unsaved changes';
const continueName = 'Continue editing';
const endpoint = '/api/submissions';
const savedThird = 'Saved revision 3.';
const revisionOne = 'revision one';
const revisionTwo = 'revision two';
const endKey = 'Control+End';
const notFoundMessage =
  'This assignment could not be found or is not available.';
const fixtures = [
  { language: 'Python', source: 'print("revision one")' },
  {
    language: 'Java',
    source:
      'public class Main { public static void main(String[] args) { System.out.println("revision one"); } }',
  },
] as const;
type RevisionData = {
  revisions: string[][];
  peerRevision: string;
  admin: APIRequestContext;
};

const test = draftTest.extend<{ revisionData: RevisionData }>({
  revisionData: async ({ draftFixture: data, playwright }, provide) => {
    const admin = await playwright.request.newContext();
    let peerId = '';
    try {
      const peer = await admin.post(`${serviceUrl}/auth/v1/admin/users`, {
        headers,
        data: {
          email: `revision-peer-${crypto.randomUUID()}@example.test`,
          password: data.password,
          email_confirm: true,
        },
      });
      expect(peer.ok()).toBeTruthy();
      peerId = (await peer.json()).id;
      const revisions = fixtures.map(() => [
        crypto.randomUUID(),
        crypto.randomUUID(),
      ]);
      const peerRevision = crypto.randomUUID();
      const rows = fixtures.flatMap((fixture, index) =>
        revisions[index].map((id, offset) => ({
          id,
          assignment_id: data.assignments[index],
          student_id: data.users[1].id,
          source: fixture.source.replace(
            revisionOne,
            offset ? revisionTwo : revisionOne,
          ),
          language: fixture.language.toLowerCase(),
          revision: offset + 1,
          request_id: crypto.randomUUID(),
        })),
      );
      rows.push({
        ...rows[0],
        id: peerRevision,
        student_id: peerId,
        source: 'print("private peer source")',
        request_id: crypto.randomUUID(),
      });
      const created = await admin.post(`${serviceUrl}/rest/v1/submissions`, {
        headers,
        data: rows,
      });
      expect(created.ok()).toBeTruthy();
      await provide({ revisions, peerRevision, admin });
    } finally {
      if (peerId) {
        expect(
          (
            await admin.delete(
              `${serviceUrl}/rest/v1/submissions?student_id=eq.${peerId}`,
              { headers },
            )
          ).ok(),
        ).toBeTruthy();
        expect(
          (
            await admin.delete(`${serviceUrl}/auth/v1/admin/users/${peerId}`, {
              headers,
            })
          ).ok(),
        ).toBeTruthy();
      }
      await admin.dispose();
    }
  },
});

test.use({ baseURL: appUrl, actionTimeout: 10_000 });
test.skip(
  !process.env.MP4_E2E_SERVICE_ROLE_KEY ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    !/^http:\/\/(localhost|127\.0\.0\.1):54321$/.test(serviceUrl ?? ''),
  'Requires local synthetic accounts.',
);

for (const [index, fixture] of fixtures.entries()) {
  test(`${fixture.language}: reopen, run, save a new revision and preserve the original`, async ({
    page,
    draftFixture: data,
    revisionData,
  }) => {
    await signIn(page, data);
    const id = revisionData.revisions[index][0];
    await page
      .getByRole('link', { name: 'My submissions', exact: true })
      .first()
      .click();
    await page
      .locator(`a[href="/courses/${data.courseId}/submissions/${id}"]`)
      .click();
    await expect(page.locator('pre code')).toHaveText(fixture.source);
    await page.getByRole('link', { name: continueName, exact: true }).click();
    await expect(page).toHaveURL(
      editorPath(data.courseId, data.assignments[index], id),
    );
    const editor = page.getByLabel(`${fixture.language} source code`, {
      exact: true,
    });
    await expect(editor).toHaveValue(fixture.source);
    await expect(
      page.getByText('Editing revision 1', { exact: true }),
    ).toBeVisible();
    await expect(page.getByText(dirtyText, { exact: true })).toHaveCount(0);
    await checkMobileWorkspace(page);
    await checkLoadedRun(page);
    const edited = fixture.source.replace(revisionOne, 'edited revision');
    await saveEditedRevision(page, edited);
    await page.getByRole('link', { name: 'Revision 1', exact: true }).click();
    await expect(page.locator('pre code')).toHaveText(fixture.source);
    await checkStoredRevisions(revisionData.admin, {
      courseId: data.courseId,
      assignmentId: data.assignments[index],
      studentId: data.users[1].id,
      source: fixture.source,
      edited,
      language: fixture.language.toLowerCase(),
    });
  });

  test(`${fixture.language}: canceled replacement and delayed save retain the correct draft`, async ({
    page,
    draftFixture: data,
    revisionData,
  }) => {
    await signIn(page, data);
    const [first, second] = revisionData.revisions[index];
    await page.goto(editorPath(data.courseId, data.assignments[index], first));
    await ensureInteractive(page);
    const editor = page.getByLabel(`${fixture.language} source code`, {
      exact: true,
    });
    await expect(editor).toHaveValue(fixture.source);
    await checkReplacement(page, {
      courseId: data.courseId,
      assignmentId: data.assignments[index],
      first,
      second,
      source: fixture.source,
    });
    const loaded = fixture.source.replace(revisionOne, revisionTwo);
    await checkFailedRetries(page, loaded);
    await checkDelayedSave(page, loaded);
    page.once('dialog', (dialog) => void dialog.accept());
    await page
      .getByRole('link', { name: 'All assignments', exact: true })
      .click();
    await page.goto(
      `/courses/${data.courseId}/assignments/${data.assignments[index]}`,
    );
    await expect(editor).toHaveValue('');
  });
}

async function checkStoredRevisions(
  admin: APIRequestContext,
  data: {
    courseId: string;
    assignmentId: string;
    studentId: string;
    source: string;
    edited: string;
    language: string;
  },
) {
  const stored = await admin.get(
    `${serviceUrl}/rest/v1/submissions?assignment_id=eq.${data.assignmentId}&student_id=eq.${data.studentId}&select=source,revision,language&order=revision`,
    { headers },
  );
  expect(await stored.json()).toEqual([
    {
      source: data.source,
      revision: 1,
      language: data.language,
    },
    {
      source: data.source.replace(revisionOne, revisionTwo),
      revision: 2,
      language: data.language,
    },
    { source: data.edited, revision: 3, language: data.language },
  ]);
}

async function checkLoadedRun(page: Page) {
  if (process.env.RUN_AUTHENTICATED_RUNTIME_TESTS !== '1') return;
  await page.getByRole('button', { name: 'Run code', exact: true }).click();
  await expect(page.getByTestId('custom-run-result')).toContainText(
    revisionOne,
    { timeout: 90_000 },
  );
}

async function checkMobileWorkspace(page: Page) {
  await page.setViewportSize({ width: 375, height: 812 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}

async function saveEditedRevision(page: Page, source: string) {
  await sourceEditor(page).press('Control+a');
  await page.keyboard.insertText(source);
  await expect(page.getByText(dirtyText, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: submitName, exact: true }).click();
  await expect(page.getByText(savedThird, { exact: true })).toBeVisible();
  await expect(sourceEditor(page)).toHaveValue(source);
  await expect(page.getByText(dirtyText, { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: 'Revision 3', exact: true }),
  ).toBeVisible();
}

async function checkReplacement(
  page: Page,
  data: {
    courseId: string;
    assignmentId: string;
    first: string;
    second: string;
    source: string;
  },
) {
  const editor = sourceEditor(page);
  await expect(editor).toBeEnabled();
  await editor.press(endKey);
  await editor.press('Enter');
  await expect(editor).toHaveValue(data.source + '\n');
  await expect(page.getByText(dirtyText, { exact: true })).toBeVisible();
  const editSecond = page.getByRole('link', {
    name: 'Continue editing revision 2',
    exact: true,
  });
  const shown = page.waitForEvent('dialog');
  const canceled = editSecond.click();
  const dialog = await shown;
  expect(dialog.type()).toBe('confirm');
  await dialog.dismiss();
  await canceled;
  await expect(page).toHaveURL(
    editorPath(data.courseId, data.assignmentId, data.first),
  );
  await expect(editor).toHaveValue(data.source + '\n');
  page.once('dialog', (dialog) => void dialog.accept());
  await editSecond.click();
  await expect(page).toHaveURL(
    editorPath(data.courseId, data.assignmentId, data.second),
  );
  await expect(editor).toHaveValue(
    data.source.replace(revisionOne, revisionTwo),
  );
  await expect(page.getByText(dirtyText, { exact: true })).toHaveCount(0);
}

async function checkFailedRetries(page: Page, loaded: string) {
  await sourceEditor(page).press(endKey);
  await sourceEditor(page).press('Enter');
  await expect(sourceEditor(page)).toHaveValue(loaded + '\n');
  const attempts: string[] = [];
  await page.route(endpoint, async (route) => {
    attempts.push(route.request().postDataJSON().requestId);
    await route.fulfill({
      status: 503,
      json: { error: { message: 'Try saving again.' } },
    });
  });
  for (let retry = 0; retry < 2; retry++) {
    await page.getByRole('button', { name: submitName }).click();
    await expect(
      page.getByText('Try saving again.', { exact: true }),
    ).toBeVisible();
  }
  expect(attempts[0]).toBe(attempts[1]);
  await page.unroute(endpoint);
}

async function checkDelayedSave(page: Page, loaded: string) {
  const editor = sourceEditor(page);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(endpoint, async (route) => {
    await gate;
    await route.continue();
  });
  await page.getByRole('button', { name: submitName }).click();
  await expect(page.getByRole('button', { name: 'Saving…' })).toBeDisabled();
  await editor.press(endKey);
  await editor.press('Enter');
  release();
  await expect(page.getByText(savedThird, { exact: true })).toBeVisible();
  await expect(editor).toHaveValue(loaded + '\n\n');
  await expect(page.getByText(dirtyText, { exact: true })).toBeVisible();
  await page.unroute(endpoint);
}

test('prefilled editor waits for hydration before accepting edits', async ({
  page,
  draftFixture: data,
  revisionData,
}) => {
  await signIn(page, data);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const chunks = '**/_next/static/chunks/*.js';
  await page.route(chunks, async (route) => {
    await gate;
    await route.continue();
  });
  try {
    await page.goto(
      editorPath(
        data.courseId,
        data.assignments[0],
        revisionData.revisions[0][0],
      ),
      { waitUntil: 'commit' },
    );
    await expect(sourceEditor(page)).toBeDisabled();
    await expect(sourceEditor(page)).toHaveValue(fixtures[0].source);
  } finally {
    release();
    await page.waitForLoadState('load');
    await page.unroute(chunks);
  }
  await expect(sourceEditor(page)).toBeEnabled();
  await sourceEditor(page).press(endKey);
  await sourceEditor(page).press('Enter');
  await expect(sourceEditor(page)).toHaveValue(fixtures[0].source + '\n');
});

test('denies peer, mismatched, invalid, unpublished and unauthorized revision loads', async ({
  page,
  draftFixture: data,
  revisionData,
}) => {
  await signIn(page, data);
  const own = revisionData.revisions[0][0];
  await checkDeniedSelections(page, {
    courseId: data.courseId,
    assignmentId: data.assignments[0],
    own,
    peer: revisionData.peerRevision,
    other: revisionData.revisions[1][0],
  });
  const updated = await revisionData.admin.patch(
    `${serviceUrl}/rest/v1/assignments?id=eq.${data.assignments[0]}`,
    { headers, data: { publication_status: 'draft' } },
  );
  expect(updated.ok()).toBeTruthy();
  await page.goto(`/courses/${data.courseId}/submissions/${own}`);
  await expect(page.locator('pre code')).toHaveText(fixtures[0].source);
  await expect(
    page.getByRole('link', { name: continueName, exact: true }),
  ).toHaveCount(0);
  await page.goto(editorPath(data.courseId, data.assignments[0], own));
  await expect(page.getByText(notFoundMessage)).toBeVisible();
  await checkUnauthorized(page, {
    courseId: data.courseId,
    assignmentId: data.assignments[1],
    revisionId: revisionData.revisions[1][0],
    email: data.users[0].email,
    password: data.password,
  });
});

async function checkDeniedSelections(
  page: Page,
  data: {
    courseId: string;
    assignmentId: string;
    own: string;
    peer: string;
    other: string;
  },
) {
  const path = `/courses/${data.courseId}/assignments/${data.assignmentId}`;
  for (const query of [
    data.peer,
    data.other,
    crypto.randomUUID(),
    'invalid',
    '',
    `${data.own}&fromRevision=${data.own}`,
  ]) {
    await page.goto(`${path}?fromRevision=${query}`);
    await expect(page.getByText(notFoundMessage)).toBeVisible();
    await expect(
      page.getByLabel('Python source code', { exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByText('private peer source', { exact: false }),
    ).toHaveCount(0);
  }
}

async function checkUnauthorized(
  page: Page,
  data: {
    courseId: string;
    assignmentId: string;
    revisionId: string;
    email: string;
    password: string;
  },
) {
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await page.goto(
    editorPath(data.courseId, data.assignmentId, data.revisionId),
  );
  await expect(page).toHaveURL(/\/sign-in$/);
  await revisionSession(page, data.email, data.password);
  await page.goto(`/courses/${data.courseId}/assignments`);
  await expect(page).toHaveURL(
    new RegExp(`/courses/${data.courseId}/assignments$`),
  );
  await page.goto(
    editorPath(data.courseId, data.assignmentId, data.revisionId),
  );
  await expect(page.getByText(notFoundMessage)).toBeVisible();
}

function editorPath(
  courseId: string,
  assignmentId: string,
  revisionId: string,
) {
  return `/courses/${courseId}/assignments/${assignmentId}?fromRevision=${revisionId}`;
}

async function signIn(
  page: Page,
  data: { courseId: string; users: Array<{ email: string }>; password: string },
) {
  await revisionSession(page, data.users[1].email, data.password);
  await page.goto(`/courses/${data.courseId}/assignments`);
  await expect(page).toHaveURL(
    new RegExp(`/courses/${data.courseId}/assignments$`),
  );
}

function sourceEditor(page: Page) {
  return page.getByLabel(/^(Python|Java) source code$/);
}

async function ensureInteractive(page: Page) {
  const button = page.getByRole('button', {
    name: /^Switch to (dark|light) mode$/,
  });
  const label = await button.getAttribute('aria-label');
  await button.click();
  await expect(button).toHaveAttribute(
    'aria-label',
    label === 'Switch to dark mode'
      ? 'Switch to light mode'
      : 'Switch to dark mode',
  );
}
