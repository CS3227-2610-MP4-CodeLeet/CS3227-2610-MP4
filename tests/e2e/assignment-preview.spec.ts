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
    page.getByText('Write a Python program', { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Submit code', exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Run code', exact: true }),
  ).toHaveCount(process.env.RUN_BROWSER_RUNTIME_TESTS === '1' ? 1 : 0);
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
  await page
    .getByLabel('Python source code', { exact: true })
    .fill('x'.repeat(2000));
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test('code checks preserve input, never send it and never enable submission', async ({
  page,
}) => {
  const source = 'print("LOCAL_SOURCE_SENTINEL")\n';
  const transfers: string[] = [];
  page.on('request', (request) => {
    if (
      request.postData()?.includes('LOCAL_SOURCE_SENTINEL') ||
      request.url().includes('LOCAL_SOURCE_SENTINEL')
    )
      transfers.push(request.url());
  });
  await page.goto(`/student/assignments/${pythonId}`);
  const editor = page.getByLabel('Python source code', { exact: true });
  await expect(
    page.getByText('Language: Python', { exact: false }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Check code', exact: true }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'Enter some code' }),
  ).toBeVisible();
  await expect(editor).toHaveAttribute('aria-invalid', 'true');
  await editor.fill(' \n\t ');
  await page.getByRole('button', { name: 'Check code', exact: true }).click();
  await expect(editor).toHaveValue(' \n\t ');
  await editor.fill(source);
  await page.getByRole('button', { name: 'Check code', exact: true }).click();
  await expect(
    page
      .getByRole('status')
      .filter({ hasText: 'Code meets the local input rules.' }),
  ).toBeVisible();
  await expect(editor).toHaveValue(source);
  await expect(editor).toHaveAttribute('aria-invalid', 'false');
  await expect(
    page.getByRole('button', { name: 'Submit code', exact: true }),
  ).toBeDisabled();
  expect(transfers).toEqual([]);
});

test('multibyte source uses the byte boundary and is preserved when oversized', async ({
  page,
}) => {
  await page.goto(`/student/assignments/${pythonId}`);
  const editor = page.getByLabel('Python source code', { exact: true });
  const exact = 'é'.repeat(16_384);
  await editor.fill(exact);
  await page.getByRole('button', { name: 'Check code', exact: true }).click();
  await expect(
    page.getByText('32,768 / 32,768 UTF-8 bytes', { exact: false }),
  ).toBeVisible();
  await expect(editor).toHaveAttribute('aria-invalid', 'false');
  await editor.fill(exact + 'é');
  await expect(
    page.getByText('32,770 / 32,768 UTF-8 bytes', { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole('alert').filter({ hasText: 'Code exceeds' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Check code', exact: true }).click();
  await expect(editor).toHaveValue(exact + 'é');
  await expect(editor).toBeFocused();
});

test('Java language is fixed and navigation does not reuse another assignment draft', async ({
  page,
}) => {
  await page.goto(`/student/assignments/${pythonId}`);
  await page
    .getByLabel('Python source code', { exact: true })
    .fill('print("python draft")');
  await page
    .getByRole('link', { name: 'All assignments', exact: true })
    .click();
  await page
    .getByRole('link', { name: 'View assignment: Count the vowels' })
    .click();
  const editor = page.getByLabel('Java source code', { exact: true });
  await expect(editor).toHaveValue('');
  await expect(
    page.getByText('Language: Java', { exact: false }),
  ).toBeVisible();
  await expect(page.getByRole('combobox')).toHaveCount(0);
  const source = '<script>document.body.dataset.codeExecuted = "yes"</script>';
  await editor.fill(source);
  await page.getByRole('button', { name: 'Check code', exact: true }).click();
  await expect(editor).toHaveValue(source);
  expect(
    await page.evaluate(() => document.body.dataset.codeExecuted),
  ).toBeUndefined();
  await expect(
    page.getByRole('button', { name: 'Submit code', exact: true }),
  ).toBeDisabled();
});
