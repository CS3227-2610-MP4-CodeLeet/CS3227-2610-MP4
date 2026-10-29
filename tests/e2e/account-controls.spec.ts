const passwordLabel = 'Password';
const confirmationLabel = 'Confirm password';
const syntheticPassword = 'SyntheticPassword123!';
import { expect, test } from '@playwright/test';

test.use({
  baseURL: process.env.ACCOUNT_TEST_BASE_URL ?? 'http://127.0.0.1:3100',
});

test('account pages share the saved theme and keep both password eyes independent', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/sign-up');
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect(page.locator('.app-theme')).toHaveAttribute(
    'data-theme',
    'dark',
  );
  const password = page.getByLabel(passwordLabel, { exact: true });
  const confirmation = page.getByLabel(confirmationLabel, { exact: true });
  await password.fill(syntheticPassword);
  await confirmation.fill(syntheticPassword);
  await page
    .getByRole('button', { name: 'Show password', exact: true })
    .click();
  await expect(password).toHaveAttribute('type', 'text');
  await expect(confirmation).toHaveAttribute('type', 'password');
  await page
    .getByRole('button', { name: 'Show confirm password', exact: true })
    .click();
  await expect(confirmation).toHaveAttribute('type', 'text');
  await page
    .getByRole('button', { name: 'Hide password', exact: true })
    .click();
  await expect(password).toHaveAttribute('type', 'password');
  await page.getByRole('link', { name: 'Sign in', exact: true }).click();
  await expect(page.locator('.app-theme')).toHaveAttribute(
    'data-theme',
    'dark',
  );
  await expect(page.getByLabel(confirmationLabel, { exact: true })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole('button', { name: 'Show password', exact: true }),
  ).toBeVisible();
});

test('mismatched confirmation blocks signup without sending passwords', async ({
  page,
}) => {
  let requests = 0;
  await page.route('**/auth/v1/signup*', async (route) => {
    requests += 1;
    await route.abort();
  });
  await page.goto('/sign-up');
  await page.getByLabel('Display name').fill('Synthetic student');
  test.skip(
    await page
      .getByRole('button', { name: 'Create student account', exact: true })
      .isDisabled(),
    'Signup validation requires configured public Supabase settings.',
  );
  await page.getByLabel('Email').fill('synthetic@example.test');
  await page.getByLabel(passwordLabel, { exact: true }).fill(syntheticPassword);
  await page
    .getByLabel(confirmationLabel, { exact: true })
    .fill('DifferentPassword123!');
  await page
    .getByRole('button', { name: 'Create student account', exact: true })
    .click();
  await expect(page.getByRole('status')).toHaveText('Passwords do not match.');
  expect(requests).toBe(0);
});
