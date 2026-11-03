import { expect, test } from '@playwright/test';

const scenarios = [
  {
    path: '/sign-in',
    button: 'Sign in',
    pending: 'Signing in…',
    endpoint: '**/api/auth/sign-in',
    failure: 'Sign-in failed.',
  },
  {
    path: '/sign-up',
    button: 'Create student account',
    pending: 'Creating account…',
    endpoint: '**/auth/v1/signup*',
    failure: 'Account creation failed.',
  },
  {
    path: '/forgot-password',
    button: 'Send reset link',
    pending: 'Sending reset link…',
    endpoint: '**/auth/v1/recover*',
    failure: 'Unable to send a reset link',
  },
];

for (const scenario of scenarios) {
  test(`${scenario.path} shows pending feedback and allows retry after a slow failure`, async ({
    page,
  }) => {
    let release!: () => void;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    let requests = 0;
    await page.route(scenario.endpoint, async (route) => {
      requests++;
      await held;
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: '{"error":"unavailable"}',
      });
    });
    await page.goto(scenario.path);
    test.skip(
      await page
        .getByRole('button', { name: scenario.button, exact: true })
        .isDisabled(),
      'Needs public Supabase configuration.',
    );
    if (scenario.path === '/sign-in')
      await page.getByLabel('Email or username').fill('loading-synthetic');
    else
      await page
        .getByLabel('Email', { exact: true })
        .fill('loading-synthetic@example.test');
    if (scenario.path !== '/forgot-password')
      await page
        .getByLabel('Password', { exact: true })
        .fill('Synthetic-Password!234');
    if (scenario.path === '/sign-up') {
      await page
        .getByLabel('Username', { exact: true })
        .fill('Loading Synthetic');
      await page
        .getByLabel('Confirm password', { exact: true })
        .fill('Synthetic-Password!234');
    }
    await page
      .getByRole('button', { name: scenario.button, exact: true })
      .click();
    const pending = page.getByRole('button', {
      name: scenario.pending,
      exact: true,
    });
    await expect(pending).toBeDisabled();
    await expect(pending).toHaveAttribute('aria-busy', 'true');
    await expect(pending.locator('svg')).toBeVisible();
    expect(requests).toBe(1);
    release();
    await expect(page.getByRole('status')).toContainText(scenario.failure);
    await expect(
      page.getByRole('button', { name: scenario.button, exact: true }),
    ).toBeEnabled();
  });
}
