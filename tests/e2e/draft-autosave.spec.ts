import { expect, type Page, type APIRequestContext } from '@playwright/test';
import { test } from './helpers/draft-fixtures';
import { revisionSession } from './helpers/revision-session';

const appUrl = process.env.ACCOUNT_TEST_BASE_URL ?? 'http://127.0.0.1:3100';
const draftSaved = 'Draft saved on this device';
const restore = 'Restore draft';
const submit = 'Submit revision';
const savedFirst = 'Saved revision 1.';
test.use({ baseURL: appUrl, actionTimeout: 10_000 });
test.skip(
  !process.env.MP4_E2E_SERVICE_ROLE_KEY ||
    !/^http:\/\/(localhost|127\.0\.0\.1):54321$/.test(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    ),
  'Requires explicitly configured local synthetic accounts.',
);

async function reload(page: Page) {
  page.once('dialog', (dialog) => void dialog.accept());
  await page.reload();
}
const editor = (page: Page) => page.getByLabel(/^(Python|Java) source code$/);
async function saved(page: Page) {
  await expect(page.getByText(draftSaved, { exact: true })).toBeVisible();
}
async function drafts(page: Page) {
  return page.evaluate(() =>
    Object.keys(localStorage).filter((key) =>
      key.startsWith('codeleet:draft:v1:'),
    ),
  );
}

async function recover(page: Page, source: string) {
  await page.getByRole('button', { name: restore, exact: true }).click();
  await expect(editor(page)).toHaveValue(source);
}

async function submitFirst(page: Page) {
  const response = page.waitForResponse(
    (item) =>
      item.url().endsWith('/api/submissions') &&
      item.request().method() === 'POST',
  );
  await page.getByRole('button', { name: submit, exact: true }).click();
  const revision = (await (await response).json()).submission.id;
  await expect(page.getByText(savedFirst, { exact: true })).toBeVisible();
  await expect.poll(() => drafts(page)).toHaveLength(0);
  return revision as string;
}

async function closedTabRecovery(page: Page, path: string, source: string) {
  const context = page.context();
  await page.close();
  const reopened = await context.newPage();
  await reopened.goto(appUrl + path);
  await recover(reopened, source);
  await reopened.close();
}

async function openSavedContext(page: Page, path: string, source: string) {
  page.once('dialog', (dialog) => void dialog.accept());
  await page.goto(path);
  await expect(editor(page)).toHaveValue(source);
  await expect(
    page.getByRole('button', { name: restore, exact: true }),
  ).toHaveCount(0);
}

async function holdSubmission(page: Page) {
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/submissions', async (route) => {
    const response = await route.fetch();
    await held;
    await route.fulfill({ response });
  });
  return release;
}

async function signOutBoth(page: Page, second: Page) {
  page.once('dialog', (dialog) => void dialog.accept());
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(editor(second)).toBeDisabled();
  await expect(
    second.getByText('Your session has ended. Sign in again to continue.'),
  ).toBeVisible();
  await expect.poll(() => drafts(page)).toHaveLength(0);
  await second.close();
}

async function addStudent(
  request: APIRequestContext,
  data: {
    courseId: string;
    users: Array<{ id: string; email: string }>;
    password: string;
  },
) {
  const email = `autosave-peer-${crypto.randomUUID()}@example.test`;
  const key = process.env.MP4_E2E_SERVICE_ROLE_KEY!;
  const response = await request.post(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users`,
    {
      headers: { apikey: key, authorization: `Bearer ${key}` },
      data: { email, password: data.password, email_confirm: true },
    },
  );
  expect(response.ok()).toBeTruthy();
  const user = { id: (await response.json()).id as string, email };
  const membership = await request.post(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/course_memberships`,
    {
      headers: { apikey: key, authorization: `Bearer ${key}` },
      data: { course_id: data.courseId, user_id: user.id, role: 'student' },
    },
  );
  expect(membership.ok()).toBeTruthy();
  data.users.push(user);
  return user;
}

for (const [index, language, source] of [
  [0, 'Python', 'print("recover")\n# <img src=x onerror=alert(1)>'],
  [
    1,
    'Java',
    'public class Main { public static void main(String[] a) { System.out.println("recover"); } }',
  ],
] as const) {
  test(`${language}: recovers after refresh and tab closure, submits and separates revision drafts`, async ({
    page,
    draftFixture: data,
  }) => {
    await revisionSession(page, data.users[1].email, data.password);
    const path = `/courses/${data.courseId}/assignments/${data.assignments[index]}`;
    await page.goto(path);
    await editor(page).fill(source);
    await saved(page);
    await reload(page);
    await expect(editor(page)).toBeDisabled();
    await recover(page, source);
    await expect(page.locator('img[src="x"]')).toHaveCount(0);
    const revision = await submitFirst(page);
    const newer = source + '\n// local draft';
    await editor(page).fill(newer);
    await saved(page);
    await openSavedContext(page, `${path}?fromRevision=${revision}`, source);
    await page.goto(path);
    await recover(page, newer);
    await saved(page);
    await closedTabRecovery(page, path, newer);
  });

  test(`${language}: retains newer code during a submission and supports discarding recovery`, async ({
    page,
    draftFixture: data,
  }) => {
    await revisionSession(page, data.users[1].email, data.password);
    await page.goto(
      `/courses/${data.courseId}/assignments/${data.assignments[index]}`,
    );
    await editor(page).fill(source);
    await saved(page);
    const release = await holdSubmission(page);
    await page.getByRole('button', { name: submit, exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Saving…', exact: true }),
    ).toBeVisible();
    await editor(page).fill(source + '\nnewer');
    await saved(page);
    release();
    await expect(page.getByText(savedFirst, { exact: true })).toBeVisible();
    await reload(page);
    await page.getByRole('button', { name: restore, exact: true }).click();
    await expect(editor(page)).toHaveValue(source + '\nnewer');
    await saved(page);
    await reload(page);
    await page
      .getByRole('button', { name: 'Discard draft', exact: true })
      .click();
    await expect(editor(page)).toBeEnabled();
    await expect(editor(page)).toHaveValue('');
    await expect.poll(() => drafts(page)).toHaveLength(0);
  });
}

test('conflicting tabs require a choice and sign-out invalidates both writers', async ({
  page,
  draftFixture: data,
}) => {
  await revisionSession(page, data.users[1].email, data.password);
  const path = `/courses/${data.courseId}/assignments/${data.assignments[0]}`;
  await page.goto(path);
  const second = await page.context().newPage();
  await second.goto(appUrl + path);
  await expect(editor(second)).toBeEnabled();
  await editor(page).fill('print("first tab")');
  await saved(page);
  await expect(
    second.getByRole('region', { name: 'Draft conflict' }),
  ).toBeVisible();
  await editor(second).fill('print("second tab")');
  await second.getByRole('button', { name: 'Keep this tab’s code' }).click();
  await saved(second);
  await expect(editor(page)).toHaveValue('print("first tab")');
  await page.getByRole('button', { name: 'Load other draft' }).click();
  await expect(editor(page)).toHaveValue('print("second tab")');
  await signOutBoth(page, second);
});

test('blocked storage leaves editing and submission usable in mobile dark mode', async ({
  page,
  draftFixture: data,
}) => {
  await revisionSession(page, data.users[1].email, data.password);
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith('codeleet:draft:'))
        throw new DOMException('Blocked', 'QuotaExceededError');
      original.call(this, key, value);
    };
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(
    `/courses/${data.courseId}/assignments/${data.assignments[0]}`,
  );
  await page.getByRole('button', { name: /Switch to .* mode/ }).click();
  await editor(page).fill('print("still submit")');
  await expect(
    page.getByText("Couldn't save draft on this device", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole('button', { name: submit, exact: true }).click();
  await expect(page.getByText(savedFirst, { exact: true })).toBeVisible();
  await expect(editor(page)).toHaveValue('print("still submit")');
});

test('switching accounts in the same browser never offers another student’s draft', async ({
  page,
  request,
  draftFixture: data,
}) => {
  const peer = await addStudent(request, data);
  const path = `/courses/${data.courseId}/assignments/${data.assignments[0]}`;
  await revisionSession(page, data.users[1].email, data.password);
  await page.goto(path);
  await editor(page).fill('print("private unfinished work")');
  await saved(page);
  // Change the verified cookie identity without clearing browser draft storage.
  await revisionSession(page, peer.email, data.password);
  page.once('dialog', (dialog) => void dialog.accept());
  await page.reload();
  await expect(editor(page)).toBeEnabled();
  await expect(editor(page)).toHaveValue('');
  await expect(
    page.getByRole('button', { name: restore, exact: true }),
  ).toHaveCount(0);
  await expect.poll(() => drafts(page)).toHaveLength(1);
  await editor(page).fill('print("peer work")');
  await saved(page);
  await expect.poll(() => drafts(page)).toHaveLength(2);
});
