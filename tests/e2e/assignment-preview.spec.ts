import { expect, test } from '@playwright/test';

const pythonId = '10000000-0000-4000-8000-000000000001';
const javaId = '10000000-0000-4000-8000-000000000002';

test('shows published samples and navigates to Java and Python instructions', async ({
  page,
}) => {
  await page.goto('/student/assignments');
  await expect(
    page.getByRole('heading', { name: 'Your assignments' }),
  ).toBeVisible();
  await expect(
    page.getByText('Preview with sample assignments.', { exact: false }),
  ).toBeVisible();
  await expect(page.locator('main').getByRole('listitem')).toHaveCount(2);
  await expect(page.getByText('Draft sorting exercise')).toHaveCount(0);
  await page
    .getByRole('link', { name: 'View assignment: Count the vowels' })
    .click();
  await expect(page).toHaveURL(`/student/assignments/${javaId}`);
  await expect(
    page.getByRole('heading', { name: 'Count the vowels' }),
  ).toBeVisible();
  await expect(
    page.getByText('Write a Java program', { exact: false }),
  ).toBeVisible();
  await page
    .getByRole('link', { name: 'All assignments', exact: true })
    .click();
  await page
    .getByRole('link', { name: 'View assignment: Find the largest number' })
    .click();
  await expect(page).toHaveURL(`/student/assignments/${pythonId}`);
  await expect(
    page.getByText('Write a Python function', { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /submit|run code/i }),
  ).toHaveCount(0);
});

test('empty list communicates availability without fake assignments', async ({
  page,
}) => {
  await page.goto('/student/assignments?preview=empty');
  await expect(
    page.getByRole('heading', { name: 'No assignments yet' }),
  ).toBeVisible();
  await expect(page.locator('main').getByRole('listitem')).toHaveCount(0);
});

for (const id of ['10000000-0000-4000-8000-000000000003', 'missing']) {
  test(`draft or missing assignment ${id} is unavailable`, async ({ page }) => {
    await page.goto(`/student/assignments/${id}`);
    await expect(
      page.getByRole('heading', { name: 'Assignment unavailable' }),
    ).toBeVisible();
    await expect(
      page.getByText('Draft-only synthetic instructions.', { exact: false }),
    ).toHaveCount(0);
    await page.getByRole('link', { name: 'Back to assignments' }).click();
    await expect(
      page.getByRole('heading', { name: 'Your assignments' }),
    ).toBeVisible();
  });
}

test('loading state is visible before slow data arrives', async ({ page }) => {
  await page.goto('/student/assignments?preview=slow', { waitUntil: 'commit' });
  await expect(
    page.getByRole('status', { name: 'Loading assignments' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Your assignments' }),
  ).toBeVisible();
});

test('failure shows safe copy and recovery returns to assignments', async ({
  page,
}) => {
  await page.goto('/student/assignments?preview=error');
  await expect(
    page.getByRole('heading', { name: 'Assignments could not be loaded' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Your assignments' }),
  ).toBeVisible();
});

test('mobile detail fits without horizontal scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`/student/assignments/${pythonId}`);
  await expect(
    page.getByRole('heading', { name: 'Find the largest number' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
