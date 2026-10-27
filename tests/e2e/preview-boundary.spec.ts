import { expect, test } from '@playwright/test';

test('production denies fixture routes even when the preview flag is true', async ({
  page,
}) => {
  for (const path of [
    '/student/assignments',
    '/student/assignments/10000000-0000-4000-8000-000000000001',
  ]) {
    await page.goto(path);
    await expect(
      page.getByRole('heading', { name: 'Your assignments' }),
    ).toHaveCount(0);
    await expect(
      page.getByText('Find the largest number', { exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByText('Preview with sample assignments.', { exact: false }),
    ).toHaveCount(0);
    await expect(
      page.getByText('This page could not be found.', { exact: false }),
    ).toBeVisible();
    await expect(page.getByRole('textbox')).toHaveCount(0);
  }
});
