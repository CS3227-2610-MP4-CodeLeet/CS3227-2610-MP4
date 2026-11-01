import { expect, type Page } from '@playwright/test';
import { test } from './helpers/draft-fixtures';

const appUrl = process.env.ACCOUNT_TEST_BASE_URL ?? 'http://127.0.0.1:3100';
const dirtyText = 'Unsaved changes';
const endpoint = '/api/submissions';
const submitName = 'Submit revision';

test.use({ baseURL: appUrl, actionTimeout: 10_000 });
test.skip(
  !process.env.MP4_E2E_SERVICE_ROLE_KEY ||
    !/^http:\/\/(localhost|127\.0\.0\.1):54321$/.test(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    ),
  'Requires explicitly configured local synthetic accounts.',
);

for (const [index, language, initial] of [
  [0, 'Python', 'print("saved")'],
  [1, 'Java', 'public class Main { public static void main(String[] a) {} }'],
] as const) {
  test(`${language}: protects edits, canceled navigation, reload and sign-out`, async ({
    page,
    draftFixture: data,
  }) => {
    await signIn(page, data);
    const path = `/student/assignments/${data.assignments[index]}`;
    await page
      .getByRole('link', {
        name: new RegExp(`Draft safeguard ${language.toLowerCase()}`),
      })
      .first()
      .click();
    await expect(page).toHaveURL(path);
    const editor = page.getByLabel(`${language} source code`, { exact: true });
    await expect(page.getByText(dirtyText, { exact: true })).toHaveCount(0);
    await editor.fill(initial);
    await expect(page.getByText(dirtyText, { exact: true })).toBeVisible();
    await checkCanceledDepartures(page, path, initial);
    await checkRevertAndSave(page, initial);
    await page.getByRole('link', { name: 'Revision 1', exact: true }).click();
    await expect(page.locator('pre code')).toHaveText(initial);
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await expect(page).toHaveURL(/\/sign-in$/);
  });

  test(`${language}: failed retries preserve code; delayed success keeps newer edits unsaved`, async ({
    page,
    draftFixture: data,
  }) => {
    await signIn(page, data);
    const path = `/student/assignments/${data.assignments[index]}`;
    await page.goto(path);
    const editor = page.getByLabel(`${language} source code`, { exact: true });
    await editor.fill(initial);
    const previousId = await checkFailedRetries(page, initial);
    const newer = `${initial}\n`;
    await checkDelayedSuccess(page, newer, previousId);
    page.once('dialog', (dialog) => void dialog.accept());
    await page.getByRole('link', { name: 'Revision 1', exact: true }).click();
    await expect(page.locator('pre code')).toHaveText(newer);
    await page.goto(path);
    await expect(editor).toHaveValue('');
    await expect(page.getByText(dirtyText, { exact: true })).toHaveCount(0);
  });

  test(`${language}: mobile controls keep drafts and failed sign-out keeps protection`, async ({
    page,
    draftFixture: data,
  }) => {
    await signIn(page, data);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`/student/assignments/${data.assignments[index]}`);
    await sourceEditor(page).fill(initial);
    await checkNonNavigationControls(page, initial);
    await checkFailedSignOut(page, initial);
    await page.screenshot({
      path: `test-results/unsaved-${language.toLowerCase()}-mobile.png`,
      fullPage: true,
    });
    page.once('dialog', (dialog) => void dialog.accept());
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await expect(page).toHaveURL(/\/sign-in$/);
  });
}

async function checkNonNavigationControls(page: Page, source: string) {
  await page.getByLabel('Workspace menu', { exact: true }).click();
  const opened = page.context().waitForEvent('page');
  await page
    .getByRole('link', { name: 'My submissions', exact: true })
    .last()
    .click({ modifiers: ['ControlOrMeta'] });
  const popup = await opened;
  await popup.close();
  await page.getByLabel('Workspace menu', { exact: true }).click();
  await page.getByRole('button', { name: /Switch to .* mode/ }).click();
  await page.evaluate(() => {
    const link = document.createElement('a');
    link.href = '#student-content';
    document.body.append(link);
    link.click();
    link.remove();
  });
  await expect(sourceEditor(page)).toHaveValue(source);
  await expect(page.getByText(dirtyText, { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}

async function checkFailedSignOut(page: Page, source: string) {
  const logoutUrl = '**/auth/v1/logout**';
  await page.route(logoutUrl, (route) =>
    route.fulfill({
      status: 503,
      json: { message: 'Temporarily unavailable' },
    }),
  );
  page.once('dialog', (dialog) => void dialog.accept());
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'Sign-out failed.' }),
  ).toHaveText('Sign-out failed. Try again.');
  await expect(sourceEditor(page)).toHaveValue(source);
  await expect(page.getByText(dirtyText, { exact: true })).toBeVisible();
  await cancelDialog(page, () =>
    page.getByRole('button', { name: 'Sign out', exact: true }).click(),
  );
  await page.unroute(logoutUrl);
}

function sourceEditor(page: Page) {
  return page.getByLabel(/^(Python|Java) source code$/);
}

async function checkCanceledDepartures(
  page: Page,
  path: string,
  initial: string,
) {
  await cancelDialog(page, () =>
    page.getByRole('link', { name: 'Assignments', exact: true }).last().click(),
  );
  await expect(page).toHaveURL(path);
  await cancelDialog(page, () => page.goBack({ timeout: 3_000 }));
  await expect(page).toHaveURL(path);
  await cancelDialog(
    page,
    () => page.reload({ timeout: 3_000 }),
    'beforeunload',
  );
  await expect(sourceEditor(page)).toHaveValue(initial);
  await cancelDialog(page, () =>
    page.getByRole('button', { name: 'Sign out', exact: true }).click(),
  );
  await expect(page).toHaveURL(path);
  await expect(sourceEditor(page)).toHaveValue(initial);
}

async function checkRevertAndSave(page: Page, initial: string) {
  const editor = sourceEditor(page);
  await editor.fill('');
  await expect(page.getByText(dirtyText, { exact: true })).toHaveCount(0);
  await editor.fill(initial);
  await save(page);
  await expect(page.getByText(dirtyText, { exact: true })).toHaveCount(0);
  await editor.fill(initial + '\n');
  await expect(page.getByText(dirtyText, { exact: true })).toBeVisible();
  await editor.fill(initial);
  await expect(page.getByText(dirtyText, { exact: true })).toHaveCount(0);
}

async function checkFailedRetries(page: Page, initial: string) {
  const attempts: Array<{ requestId: string }> = [];
  await page.route(endpoint, async (route) => {
    attempts.push(route.request().postDataJSON());
    await route.fulfill({
      status: 503,
      json: { error: { message: 'Try saving again.' } },
    });
  });
  for (let attempt = 0; attempt < 2; attempt++) {
    await page.getByRole('button', { name: submitName }).click();
    await expect(page.getByText('Try saving again.')).toBeVisible();
  }
  expect(attempts[0].requestId).toBe(attempts[1].requestId);
  await expect(sourceEditor(page)).toHaveValue(initial);
  await expect(page.getByText(dirtyText, { exact: true })).toBeVisible();
  await page.unroute(endpoint);
  return attempts[0].requestId;
}

async function checkDelayedSuccess(
  page: Page,
  source: string,
  previousId: string,
) {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let requestId = '';
  await sourceEditor(page).fill(source);
  await page.route(endpoint, async (route) => {
    requestId = route.request().postDataJSON().requestId;
    await gate;
    await route.continue();
  });
  await page.getByRole('button', { name: submitName }).click();
  await expect(page.getByRole('button', { name: 'Saving…' })).toBeDisabled();
  await sourceEditor(page).fill(`${source}\n`);
  release();
  await expect(
    page.getByText('Saved revision 1.', { exact: true }),
  ).toBeVisible();
  expect(requestId).not.toBe(previousId);
  await expect(sourceEditor(page)).toHaveValue(`${source}\n`);
  await expect(page.getByText(dirtyText, { exact: true })).toBeVisible();
  await page.unroute(endpoint);
}

async function signIn(
  page: Page,
  data: { users: Array<{ email: string }>; password: string },
) {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(data.users[1].email);
  await page.getByLabel('Password', { exact: true }).fill(data.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/student\/assignments$/);
}

async function save(page: Page) {
  await page.getByRole('button', { name: submitName }).click();
  await expect(
    page.getByText('Saved revision 1.', { exact: true }),
  ).toBeVisible();
}

async function cancelDialog(
  page: Page,
  action: () => Promise<unknown>,
  type = 'confirm',
) {
  const shown = page.waitForEvent('dialog', { timeout: 5_000 });
  const navigating = action().catch(() => undefined);
  const dialog = await shown;
  expect(dialog.type()).toBe(type);
  await dialog.dismiss();
  await navigating;
}
