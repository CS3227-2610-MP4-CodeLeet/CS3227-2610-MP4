import { expect, test } from '@playwright/test';

test.use({
  baseURL: process.env.ACCOUNT_TEST_BASE_URL ?? 'http://127.0.0.1:3100',
});
const requestButton = 'Send reset link';
const recoverEndpoint = '**/auth/v1/recover*';
const acknowledgement =
  'If an account exists for that email, you will receive a password reset link.';

test('forgot password collects email, hides account existence and prevents immediate resend', async ({
  page,
}) => {
  let requests = 0;
  await page.route(recoverEndpoint, async (route) => {
    requests += 1;
    expect(route.request().postDataJSON().email).toBe(
      'absent-synthetic@example.test',
    );
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{}',
    });
  });
  await page.goto('/sign-in');
  await page.getByRole('link', { name: 'Forgot password?' }).click();
  await expect(
    page.getByRole('heading', { name: 'Forgot password' }),
  ).toBeVisible();
  test.skip(
    await page.getByRole('button', { name: requestButton }).isDisabled(),
    'Needs public Supabase configuration.',
  );
  await page.getByLabel('Email').fill('absent-synthetic@example.test');
  await page.getByRole('button', { name: requestButton }).click();
  await expect(page.getByRole('status')).toHaveText(acknowledgement);
  await expect(
    page.getByRole('button', { name: /Send again in/ }),
  ).toBeDisabled();
  expect(requests).toBe(1);
});

test('reset password rejects a signed-out visit and an invalid callback', async ({
  page,
}) => {
  await page.goto('/reset-password');
  await expect(
    page.getByRole('heading', { name: 'Reset link unavailable' }),
  ).toBeVisible();
  await expect(
    page.getByLabel('Confirm password', { exact: true }),
  ).toHaveCount(0);
  await page.goto('/auth/callback?next=/reset-password');
  await expect(page).toHaveURL(/\/forgot-password\?error=invalid-link$/);
  await expect(
    page.getByText(
      'That reset link is invalid or has expired. Request a new one.',
    ),
  ).toBeVisible();
});

test('recovery provider errors are safe and a network failure can be retried', async ({
  page,
}) => {
  await page.goto('/forgot-password');
  test.skip(
    await page.getByRole('button', { name: requestButton }).isDisabled(),
    'Needs public Supabase configuration.',
  );
  await page.route(recoverEndpoint, (route) => route.abort());
  await page.getByLabel('Email').fill('synthetic@example.test');
  await page.getByRole('button', { name: requestButton }).click();
  await expect(page.getByRole('status')).toHaveText(
    'Unable to send a reset link right now. Please try again.',
  );
  await page.unroute(recoverEndpoint);
  await page.route(recoverEndpoint, (route) =>
    route.fulfill({
      status: 429,
      contentType: 'application/json',
      body: '{"code":"over_email_send_rate_limit","msg":"Private provider detail"}',
    }),
  );
  await page.getByRole('button', { name: requestButton }).click();
  await expect(page.getByRole('status')).toHaveText(
    'Too many requests. Please wait before trying again.',
  );
  await expect(page.getByText('Private provider detail')).toHaveCount(0);
});
