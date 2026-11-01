import { expect, type Page } from '@playwright/test';
import {
  test,
  profileServiceUrl,
  type ProfileFixture,
} from './helpers/profile-fixtures';

const profilePath = '/profile';
const profileApi = '/api/profile';
const saveLabel = 'Save changes';
test.use({
  baseURL: process.env.ACCOUNT_TEST_BASE_URL ?? 'http://127.0.0.1:3100',
});
test.skip(
  !process.env.MP4_E2E_SERVICE_ROLE_KEY ||
    !/^http:\/\/(localhost|127\.0\.0\.1):/.test(profileServiceUrl ?? ''),
  'Requires explicit local synthetic-account configuration.',
);

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/sign-in');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(/\/(student\/assignments|instructor)?$/);
}

test('both roles save private profiles and keep email/role readonly', async ({
  page,
  profileFixture: data,
}) => {
  await page.goto(profilePath);
  await expect(page).toHaveURL(/\/sign-in$/);
  for (const user of data.users.slice(0, 2)) {
    await signIn(page, user.email, data.password);
    await openSettings(page, user.role);
    await verifyReadOnly(page, user.email, user.role);
    await saveAndReload(page, user.role);
    await verifyProtectedFields(page, data, user.id);
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await expect(page).toHaveURL(/\/sign-in$/);
  }
});

async function openSettings(page: Page, role: string) {
  if (role === 'student') {
    await page.getByLabel('Workspace menu', { exact: true }).click();
    await page
      .getByRole('link', { name: 'Profile settings', exact: true })
      .click();
  } else await page.getByRole('link', { name: 'Profile', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Profile settings', exact: true }),
  ).toBeVisible();
}

async function verifyReadOnly(page: Page, email: string, role: string) {
  await expect(page.getByLabel('Email', { exact: true })).toHaveValue(email);
  await expect(page.getByLabel('Email', { exact: true })).toHaveAttribute(
    'readonly',
    '',
  );
  await expect(page.getByLabel('Role', { exact: true })).toHaveValue(role);
  await expect(page.getByLabel('Role', { exact: true })).toHaveAttribute(
    'readonly',
    '',
  );
}

async function saveAndReload(page: Page, role: string) {
  const username = `Changed ${role} <b>plain text</b>`;
  await page.getByLabel('Username', { exact: true }).fill(` ${username} `);
  await page.route('**/api/profile', (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: { message: 'Please try again.' } }),
    }),
  );
  await page.getByRole('button', { name: saveLabel }).click();
  await expect(page.locator('form').getByRole('alert')).toContainText(
    'try again',
  );
  await expect(page.getByLabel('Username', { exact: true })).toHaveValue(
    ` ${username} `,
  );
  await page.unroute('**/api/profile');
  const saved = page.waitForResponse(
    (response) =>
      response.url().endsWith(profileApi) &&
      response.request().method() === 'PATCH',
  );
  await page.getByRole('button', { name: saveLabel }).click();
  expect((await saved).status()).toBe(200);
  await expect(page.getByRole('status')).toHaveText('Profile saved.');
  await expect(page.getByLabel('Username', { exact: true })).toHaveValue(
    username,
  );
  await page.reload();
  await expect(page.getByLabel('Username', { exact: true })).toHaveValue(
    username,
  );
  await expect(page.locator('main b')).toHaveCount(0);
}

async function verifyProtectedFields(
  page: Page,
  data: ProfileFixture,
  ownId: string,
) {
  const origin = new URL(page.url()).origin;
  const peer = data.users.find((user) => user.id !== ownId)!;
  const resource = `${profileServiceUrl}/rest/v1/profiles?id=eq.${peer.id}&select=display_name`;
  const before = await (await data.admin.get(resource)).json();
  for (const value of [
    { id: peer.id },
    { email: peer.email },
    { role: 'instructor' },
  ]) {
    const response = await page.request.patch(profileApi, {
      headers: { Origin: origin },
      data: { username: 'FORGED', ...value },
    });
    expect(response.status()).toBe(400);
  }
  expect(await (await data.admin.get(resource)).json()).toEqual(before);
}

test('invalid input, safe service errors, mobile/theme and unprovisioned denial', async ({
  page,
  profileFixture: data,
}) => {
  await signIn(page, data.users[0].email, data.password);
  await page.goto(profilePath);
  await page.getByLabel('Username', { exact: true }).fill('   ');
  await page.getByRole('button', { name: saveLabel }).click();
  await expect(page.locator('form').getByRole('alert')).toContainText('1–80');
  await page.getByLabel('Username', { exact: true }).fill('Mobile username');
  await mobileCheck(page);
  const foreign = await page.request.patch(profileApi, {
    headers: { Origin: 'https://foreign.example' },
    data: { username: 'FORGED' },
  });
  expect(foreign.status()).toBe(403);
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await signIn(page, data.users[2].email, data.password);
  await page.goto(profilePath);
  await expect(page).toHaveURL(/\/unauthorized$/);
});

async function mobileCheck(page: Page) {
  await page.setViewportSize({ width: 375, height: 812 });
  await page
    .getByRole('button', { name: /Switch to (dark|light) mode/ })
    .click();
  await expect(page.getByLabel('Username', { exact: true })).toHaveValue(
    'Mobile username',
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: 'test-results/profile-mobile.png',
    fullPage: true,
  });
}
