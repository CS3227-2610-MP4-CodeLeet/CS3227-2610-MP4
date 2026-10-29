import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.MP4_E2E_SERVICE_ROLE_KEY;
const mailpit = process.env.MP4_E2E_MAILPIT_URL ?? 'http://127.0.0.1:54324';
const appUrl = process.env.ACCOUNT_TEST_BASE_URL ?? 'http://127.0.0.1:3100';
const localServices =
  /^http:\/\/(localhost|127\.0\.0\.1):3000$/.test(appUrl) &&
  /^http:\/\/(localhost|127\.0\.0\.1):54321$/.test(supabaseUrl ?? '') &&
  /^http:\/\/(localhost|127\.0\.0\.1):54324$/.test(mailpit);
const updateButton = 'Update password';
const oldPassword = 'Original-MP4-Pass-732!';
const newPassword = 'Recovered-MP4-Pass-732!';
test.use({ baseURL: appUrl });

function adminHeaders() {
  return {
    apikey: serviceKey!,
    authorization: `Bearer ${serviceKey!}`,
    'content-type': 'application/json',
  };
}

test('local email link resets a password, rejects replay and accepts only the new password', async ({
  page,
  request,
}) => {
  test.skip(
    !serviceKey || !localServices,
    'Needs local Supabase/Mailpit and the allowed port-3000 development origin.',
  );
  const email = `recovery-${Date.now()}@example.test`;
  const created = await request.post(`${supabaseUrl}/auth/v1/admin/users`, {
    headers: adminHeaders(),
    data: { email, password: oldPassword, email_confirm: true },
  });
  expect(created.ok()).toBeTruthy();
  const { id } = (await created.json()) as { id: string };
  try {
    const link = await requestRecoveryEmail(page, request, email);
    await page.goto(link);
    await expect(page).toHaveURL(/\/reset-password$/);
    await changePassword(page);
    await page.getByRole('link', { name: 'Sign in', exact: true }).click();
    await verifyNewPasswordLogin(page, email);
    await page.goto(link);
    await expect(
      page.getByText(
        'That reset link is invalid or has expired. Request a new one.',
      ),
    ).toBeVisible();
  } finally {
    const removed = await request.delete(
      `${supabaseUrl}/auth/v1/admin/users/${id}`,
      { headers: adminHeaders() },
    );
    expect(removed.ok()).toBeTruthy();
  }
});

async function requestRecoveryEmail(
  page: Page,
  request: APIRequestContext,
  email: string,
) {
  await page.goto('/forgot-password');
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Send reset link' }).click();
  await expect(page.getByRole('status')).toHaveText(
    'If an account exists for that email, you will receive a password reset link.',
  );
  let messageId = '';
  await expect
    .poll(async () => {
      const response = await request.get(
        `${mailpit}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`,
      );
      const result = (await response.json()) as {
        messages: Array<{ ID: string }>;
      };
      messageId = result.messages[0]?.ID ?? '';
      return Boolean(messageId);
    })
    .toBe(true);
  const response = await request.get(`${mailpit}/api/v1/message/${messageId}`);
  const message = (await response.json()) as { HTML: string };
  const links = [...message.HTML.matchAll(/href=["']([^"']+)["']/g)].map(
    (match) => match[1].replaceAll('&amp;', '&'),
  );
  const link = links.find((value) =>
    value.startsWith(`${supabaseUrl}/auth/v1/verify?`),
  );
  if (!link)
    throw new Error(
      'Synthetic local recovery email did not contain an Auth verification link.',
    );
  return link;
}

async function changePassword(page: Page) {
  let updates = 0;
  page.on('request', (request) => {
    if (
      request.method() === 'PUT' &&
      new URL(request.url()).pathname === '/auth/v1/user'
    )
      updates += 1;
  });
  await page.getByLabel('Password', { exact: true }).fill(newPassword);
  await page
    .getByLabel('Confirm password', { exact: true })
    .fill(`${newPassword}different`);
  await page.getByRole('button', { name: updateButton }).click();
  await expect(page.getByRole('status')).toHaveText('Passwords do not match.');
  expect(updates).toBe(0);
  await page.getByLabel('Confirm password', { exact: true }).fill(newPassword);
  await page.route('**/auth/v1/user', async (route) => {
    if (route.request().method() === 'PUT')
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: '{"msg":"Private provider detail","code":"weak_password"}',
      });
    else await route.continue();
  });
  await page.getByRole('button', { name: updateButton }).click();
  await expect(page.getByRole('status')).toHaveText(
    'Unable to update your password. Try again or request a new reset link.',
  );
  await page.unroute('**/auth/v1/user');
  await page.getByRole('button', { name: updateButton }).click();
  await expect(
    page.getByRole('heading', { name: 'Password updated' }),
  ).toBeVisible();
}

async function verifyNewPasswordLogin(page: Page, email: string) {
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(oldPassword);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText(
    'Sign-in failed. Check your details and try again.',
  );
  await page.getByLabel('Password', { exact: true }).fill(newPassword);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/student\/assignments$/);
}
