import { createHmac } from 'node:crypto';
import { expect, type APIRequestContext, type Page } from '@playwright/test';
import { test } from './helpers/draft-fixtures';
import { revisionSession } from './helpers/revision-session';

const app = process.env.ACCOUNT_TEST_BASE_URL ?? 'http://127.0.0.1:3100';
const endpoint = '/api/auth/sign-in';
const identifierLabel = 'Email or username';
const failed = 'Sign-in failed. Check your details and try again.';
const saveChanges = 'Save changes';
const service = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.MP4_E2E_SERVICE_ROLE_KEY!;
const headers = { apikey: key, authorization: `Bearer ${key}` };
type Fixture = {
  users: Array<{ id: string; email: string }>;
  password: string;
  assignments: string[];
};
test.use({ baseURL: app, actionTimeout: 10_000 });
test.skip(
  !key || !/^http:\/\/(localhost|127\.0\.0\.1):54321$/.test(service ?? ''),
  'Requires local synthetic accounts.',
);

async function names(request: APIRequestContext, data: Fixture) {
  const nonce = crypto.randomUUID().slice(0, 8);
  const values = [`Owner84_${nonce}`, `Student84_${nonce}`];
  for (const [index, user] of data.users.entries()) {
    const response = await request.patch(
      `${service}/rest/v1/profiles?id=eq.${user.id}`,
      { headers, data: { display_name: values[index] } },
    );
    expect(response.ok()).toBeTruthy();
  }
  return values;
}
async function login(page: Page, identifier: string, password: string) {
  await page.goto('/sign-in');
  await expect(page.getByLabel(identifierLabel)).toHaveAttribute(
    'type',
    'text',
  );
  await page.getByLabel(identifierLabel).fill(identifier);
  await page.getByLabel('Password', { exact: true }).fill(password);
  const pending = page.waitForResponse((response) =>
    response.url().endsWith(endpoint),
  );
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  const response = await pending;
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ ok: true });
  await expect(page).not.toHaveURL(/\/sign-in$/);
}
async function logout(page: Page) {
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
}

test('successful sign-in stays busy until delayed destination navigation completes', async ({
  page,
  draftFixture: data,
}) => {
  await page.goto('/sign-in');
  let release!: () => void;
  let arrived!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  const requested = new Promise<void>((resolve) => {
    arrived = resolve;
  });
  await page.route('**/?_rsc=*', async (route) => {
    if (route.request().headers()['next-router-prefetch'] === '1')
      return route.continue();
    arrived();
    await held;
    await route.continue();
  });
  await page.getByLabel(identifierLabel).fill(data.users[1].email);
  await page.getByLabel('Password', { exact: true }).fill(data.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await requested;
  const pending = page.getByRole('button', { name: 'Signing in…' });
  await expect(pending).toBeDisabled();
  await expect(pending).toHaveAttribute('aria-busy', 'true');
  release();
  await expect(page).toHaveURL(/\/student\/assignments$/);
  await expect(
    page.getByRole('heading', { name: 'Your assignments', exact: true }),
  ).toBeVisible();
});

async function addPeer(request: APIRequestContext, data: Fixture) {
  const email = `switch84-${crypto.randomUUID()}@example.test`;
  const response = await request.post(`${service}/auth/v1/admin/users`, {
    headers,
    data: { email, password: data.password, email_confirm: true },
  });
  expect(response.ok()).toBeTruthy();
  const peer = { id: (await response.json()).id as string, email };
  data.users.push(peer);
  return peer;
}
for (const [index, destination] of [
  [0, /\/instructor$/],
  [1, /\/student\/assignments$/],
] as const) {
  test(`role ${index}: actual email and case-varied username logins create the correct session`, async ({
    page,
    request,
    draftFixture: data,
  }) => {
    const usernames = await names(request, data);
    await login(page, data.users[index].email, data.password);
    await expect(page).toHaveURL(destination);
    await logout(page);
    await login(
      page,
      '  ' + usernames[index].toUpperCase() + '  ',
      data.password,
    );
    await expect(page).toHaveURL(destination);
    await logout(page);
  });
}

test('profile rename takes effect, rejects a taken name and preserves email login', async ({
  page,
  request,
  draftFixture: data,
}) => {
  const usernames = await names(request, data);
  await login(page, usernames[1], data.password);
  await page.goto('/profile');
  await page
    .getByLabel('Username', { exact: true })
    .fill(usernames[0].toLowerCase());
  await page.getByRole('button', { name: saveChanges, exact: true }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'Username is unavailable.' }),
  ).toHaveText('Username is unavailable. Choose another.');
  const renamed = usernames[1] + '_new';
  await page.getByLabel('Username', { exact: true }).fill(renamed);
  await page.getByRole('button', { name: saveChanges, exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Profile saved.');
  await logout(page);
  const old = await page.request.post(endpoint, {
    headers: { Origin: app },
    data: { identifier: usernames[1], password: data.password },
  });
  expect(old.status()).toBe(401);
  expect((await old.json()).error.message).toBe(failed);
  await login(page, renamed.toUpperCase(), data.password);
  await logout(page);
  await login(page, data.users[1].email, data.password);
});

test('unknown and wrong-password responses are generic; lookup stays private and CSRF/body forgery fails', async ({
  page,
  request,
  draftFixture: data,
}) => {
  const usernames = await names(request, data);
  await page.goto('/sign-in');
  for (const identifier of [usernames[1], `unknown84_${crypto.randomUUID()}`]) {
    const response = await page.request.post(endpoint, {
      headers: { Origin: app },
      data: { identifier, password: 'Incorrect!123' },
    });
    expect(response.status()).toBe(401);
    expect(response.headers()['cache-control']).toBe('private, no-store');
    const json = await response.json();
    expect(json.error.message).toBe(failed);
    expect(Object.keys(json)).toEqual(['error']);
    expect(response.headers()['set-cookie']).toBeUndefined();
  }
  const badOrigin = await page.request.post(endpoint, {
    headers: { Origin: 'https://evil.example.test' },
    data: { identifier: usernames[1], password: data.password },
  });
  expect(badOrigin.status()).toBe(403);
  const forged = await page.request.post(endpoint, {
    headers: { Origin: app },
    data: {
      identifier: usernames[1],
      password: data.password,
      role: 'instructor',
    },
  });
  expect(forged.status()).toBe(400);
  const lookup = await request.post(
    `${service}/rest/v1/rpc/resolve_login_email`,
    {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! },
      data: { p_username: usernames[1] },
    },
  );
  expect(lookup.ok()).toBe(false);
  await page.goto('/student/assignments');
  await expect(page).toHaveURL(/\/sign-in$/);
});

test('database-reserved case-normalized attempts return a safe retry without a provider call', async ({
  page,
  request,
  draftFixture: data,
}) => {
  test.skip(
    !process.env.AUTH_RATE_LIMIT_SECRET,
    'Requires the same private HMAC key as the local app.',
  );
  const usernames = await names(request, data);
  const normal = await request.post(
    `${service}/rest/v1/rpc/normalize_login_identifier`,
    { headers, data: { p_identifier: usernames[1] } },
  );
  expect(normal.ok()).toBeTruthy();
  const fingerprint = createHmac('sha256', process.env.AUTH_RATE_LIMIT_SECRET!)
    .update(await normal.json())
    .digest('hex');
  for (let attempt = 0; attempt < 10; attempt++) {
    const reserve = await request.post(
      `${service}/rest/v1/rpc/reserve_login_attempt`,
      { headers, data: { p_fingerprint: fingerprint } },
    );
    expect(reserve.ok()).toBeTruthy();
    expect((await reserve.json()).allowed).toBe(true);
  }
  await page.goto('/sign-in');
  const response = await page.request.post(endpoint, {
    headers: { Origin: app },
    data: { identifier: usernames[1].toUpperCase(), password: data.password },
  });
  expect(response.status()).toBe(429);
  expect(Number(response.headers()['retry-after'])).toBeGreaterThan(0);
  expect((await response.json()).error.code).toBe('rate_limited');
  await expect(page.getByLabel(identifierLabel)).toBeVisible();
});

test('unclaimed provisioned profiles explain email access, then allow an explicit username claim', async ({
  page,
  draftFixture: data,
}) => {
  await revisionSession(page, data.users[1].email, data.password);
  await page.goto('/profile');
  const message = page.getByText(
    'Choose an available username and save it to enable username sign-in. You can keep signing in with your email.',
  );
  await expect(message).toBeVisible();
  const username = `Claim84_${crypto.randomUUID().slice(0, 8)}`;
  await page.getByLabel('Username', { exact: true }).fill(username);
  await page.getByRole('button', { name: saveChanges, exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Profile saved.');
  await expect(message).toHaveCount(0);
  await logout(page);
  await login(page, username, data.password);
});

test('registration rejects a taken case variant without exposing provider diagnostics', async ({
  page,
  request,
  draftFixture: data,
}) => {
  const usernames = await names(request, data);
  await page.goto('/sign-up');
  await page
    .getByLabel('Username', { exact: true })
    .fill(usernames[0].toLowerCase());
  await page
    .getByLabel('Email', { exact: true })
    .fill(`duplicate84-${crypto.randomUUID()}@example.test`);
  await page.getByLabel('Password', { exact: true }).fill(data.password);
  await page
    .getByLabel('Confirm password', { exact: true })
    .fill(data.password);
  await page
    .getByRole('button', { name: 'Create student account', exact: true })
    .click();
  await expect(page.getByRole('status')).toHaveText(
    'Account creation failed. Try a different username or check your details.',
  );
  await expect(page).toHaveURL(/\/sign-up$/);
});

test('signing into another account in a second tab stops the old student editor', async ({
  page,
  request,
  draftFixture: data,
}) => {
  const usernames = await names(request, data);
  const peer = await addPeer(request, data);
  await login(page, usernames[1], data.password);
  await page.goto(`/student/assignments/${data.assignments[0]}`);
  const oldEditor = page.getByLabel('Python source code', { exact: true });
  await oldEditor.fill('print("account A private draft")');
  await expect(
    page.getByText('Draft saved on this device', { exact: true }),
  ).toBeVisible();
  const other = await page.context().newPage();
  await login(other, peer.email, data.password);
  await expect(oldEditor).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Submit revision', exact: true }),
  ).toBeDisabled();
  await other.close();
});
