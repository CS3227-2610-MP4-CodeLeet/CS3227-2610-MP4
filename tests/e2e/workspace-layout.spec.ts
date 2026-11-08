import { expect, test } from '@playwright/test';
const javaId = '10000000-0000-4000-8000-000000000002';

test('real history requires sign-in even when assignment preview is enabled', async ({
  page,
}) => {
  await page.goto('/student/submissions');
  await expect(page).toHaveURL(/\/sign-in$/);
});

test('sidebar gives branding space and contains only Assignments navigation', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`/student/assignments/${javaId}`);
  const sidebar = page.getByRole('complementary', {
    name: 'Workspace sidebar',
  });
  const links = sidebar.getByRole('navigation').getByRole('link');
  await expect(links).toHaveText(['Assignments']);
  await expect(
    sidebar.getByText('Published assignments', { exact: true }),
  ).toHaveCount(0);
  const brand = await sidebar
    .getByRole('link', { name: 'CodeLeet', exact: true })
    .boundingBox();
  expect(brand?.height).toBeGreaterThanOrEqual(80);
});
