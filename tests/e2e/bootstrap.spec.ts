import { expect, test } from '@playwright/test';

test('production app loads without service credentials or broken assets', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 400)
      errors.push(`${response.status()} ${response.url()}`);
  });

  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle('Programming Assignment Platform');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Programming Assignment Platform',
  );
  await expect(page.getByText('Coming soon.', { exact: false })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  expect(
    await page
      .locator('main')
      .evaluate((element) => getComputedStyle(element).display),
  ).toBe('flex');
  expect(errors).toEqual([]);
});
