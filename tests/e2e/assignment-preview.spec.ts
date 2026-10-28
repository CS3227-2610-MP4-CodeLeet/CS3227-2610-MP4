import { expect, test, type Page } from '@playwright/test';

const pythonId = '10000000-0000-4000-8000-000000000001';
const javaId = '10000000-0000-4000-8000-000000000002';
const themeAttribute = 'data-theme';
const pythonEditorLabel = 'Python source code';
const javaEditorLabel = 'Java source code';
const assignmentsLinkName = 'All assignments';
const workspaceSelector = '.student-workspace';
const darkTheme = 'dark';
const lightTheme = 'light';
const themeStorageKey = 'codeleet-workspace-theme';
const assignmentsHeading = 'Your assignments';
const submitCodeName = 'Submit code';
const checkCodeName = 'Check code';
const invalidAttribute = 'aria-invalid';

test('Menu and theme stay adjacent at the far right on desktop and mobile', async ({
  page,
}) => {
  await page.goto(`/student/assignments/${pythonId}`);
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 900 });
    const menu = await page
      .getByLabel('Workspace menu', { exact: true })
      .boundingBox();
    const theme = await page
      .getByRole('button', { name: /Switch to (light|dark) mode/ })
      .boundingBox();
    expect(menu && theme).toBeTruthy();
    if (!menu || !theme) throw new Error('Workspace controls missing');
    expect(theme.x - (menu.x + menu.width)).toBeGreaterThanOrEqual(6);
    expect(theme.x - (menu.x + menu.width)).toBeLessThanOrEqual(12);
    expect(width - (theme.x + theme.width)).toBeLessThanOrEqual(36);
    await expect(
      page.getByRole('button', { name: 'Stop', exact: true }),
    ).toHaveCount(0);
  }
});

test('theme follows the device, preserves source and remembers an explicit choice', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: darkTheme });
  await page.goto(`/student/assignments/${pythonId}`);
  const shell = page.locator(workspaceSelector);
  await expect(shell).toHaveAttribute(themeAttribute, darkTheme);
  const editor = page.getByLabel(pythonEditorLabel, { exact: true });
  await editor.fill('print("theme keeps this draft")');
  const light = page.getByRole('button', {
    name: 'Switch to light mode',
    exact: true,
  });
  await light.focus();
  await light.press('Enter');
  await expect(shell).toHaveAttribute(themeAttribute, lightTheme);
  await expect(editor).toHaveValue('print("theme keeps this draft")');
  await page
    .getByRole('button', { name: 'Switch to dark mode', exact: true })
    .click();
  await expect(shell).toHaveAttribute(themeAttribute, darkTheme);
  await page
    .getByRole('link', { name: assignmentsLinkName, exact: true })
    .click();
  await expect(shell).toHaveAttribute(themeAttribute, darkTheme);
  await verifyThemePersistence(page, shell);
});

async function verifyThemePersistence(
  page: Page,
  shell: ReturnType<Page['locator']>,
) {
  await page.reload();
  await expect(shell).toHaveAttribute(themeAttribute, darkTheme);
  await page.emulateMedia({ colorScheme: lightTheme });
  await expect(shell).toHaveAttribute(themeAttribute, darkTheme);
  const storedTheme = await page.evaluate(
    (key) => localStorage.getItem(key),
    themeStorageKey,
  );
  expect(storedTheme).toBe(darkTheme);
  await page.goto('/');
  await expect(page.locator('.student-workspace, html.dark')).toHaveCount(0);
}

test('mobile theme toggle works when preference storage is blocked', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ colorScheme: lightTheme });
  await page.addInitScript((themeStorageKey) => {
    const get = Storage.prototype.getItem;
    const set = Storage.prototype.setItem;
    Storage.prototype.getItem = function (key) {
      if (key === themeStorageKey)
        throw new DOMException('Blocked preference', 'SecurityError');
      return get.call(this, key);
    };
    Storage.prototype.setItem = function (key, value) {
      if (key === themeStorageKey)
        throw new DOMException('Blocked preference', 'SecurityError');
      return set.call(this, key, value);
    };
  }, themeStorageKey);
  await page.goto(`/student/assignments/${javaId}`);
  await page
    .getByLabel(javaEditorLabel, { exact: true })
    .fill('public class Main {}');
  await page
    .getByRole('button', { name: 'Switch to dark mode', exact: true })
    .click();
  await expect(page.locator(workspaceSelector)).toHaveAttribute(
    themeAttribute,
    darkTheme,
  );
  await expect(page.getByLabel(javaEditorLabel, { exact: true })).toHaveValue(
    'public class Main {}',
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole('button', { name: 'Switch to light mode', exact: true })
    .click();
  await expect(page.locator(workspaceSelector)).toHaveAttribute(
    themeAttribute,
    lightTheme,
  );
});

test('mobile menu supports keyboard navigation and problems precede the editor', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/student/assignments');
  const menu = page.getByLabel('Workspace menu', { exact: true });
  await menu.focus();
  await menu.press('Enter');
  await page
    .getByRole('navigation', { name: 'Student navigation' })
    .getByRole('link', { name: 'Count the vowels' })
    .click();
  await expect(page).toHaveURL(`/student/assignments/${javaId}`);
  await expect(
    page.getByRole('navigation', { name: 'Student navigation' }),
  ).not.toBeVisible();
  const problem = await page
    .getByRole('region', { name: 'Instructions', exact: true })
    .boundingBox();
  const editor = await page
    .getByLabel(javaEditorLabel, { exact: true })
    .boundingBox();
  expect(problem && editor && problem.y + problem.height <= editor.y).toBe(
    true,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test('shows published samples and navigates to Java and Python instructions', async ({
  page,
}) => {
  await page.goto('/student/assignments');
  await expect(
    page.getByRole('heading', { name: assignmentsHeading }),
  ).toBeVisible();
  await expect(
    page.getByText('Preview with sample assignments.', { exact: false }),
  ).toBeVisible();
  await expect(
    page
      .getByRole('table', { name: 'Published programming assignments' })
      .locator('tbody tr'),
  ).toHaveCount(2);
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
    .getByRole('link', { name: assignmentsLinkName, exact: true })
    .click();
  await page
    .getByRole('link', { name: 'View assignment: Find the largest number' })
    .click();
  await expect(page).toHaveURL(`/student/assignments/${pythonId}`);
  await expect(
    page.getByText('Write a Python program', { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: submitCodeName, exact: true }),
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
  await expect(
    page.getByRole('table', { name: 'Published programming assignments' }),
  ).toHaveCount(0);
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
      page.getByRole('heading', { name: assignmentsHeading }),
    ).toBeVisible();
  });
}

test('loading state is visible before slow data arrives', async ({ page }) => {
  await page.goto('/student/assignments?preview=slow', { waitUntil: 'commit' });
  await expect(
    page.getByRole('status', { name: 'Loading assignments' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: assignmentsHeading }),
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
    page.getByRole('heading', { name: assignmentsHeading }),
  ).toBeVisible();
});

test('mobile detail fits without horizontal scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`/student/assignments/${pythonId}`);
  await expect(
    page.getByRole('heading', { name: 'Find the largest number' }),
  ).toBeVisible();
  await page
    .getByLabel(pythonEditorLabel, { exact: true })
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
  const editor = page.getByLabel(pythonEditorLabel, { exact: true });
  await expect(
    page.getByText('Language: Python', { exact: false }),
  ).toBeVisible();
  await page.getByRole('button', { name: checkCodeName, exact: true }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'Enter some code' }),
  ).toBeVisible();
  await expect(editor).toHaveAttribute(invalidAttribute, 'true');
  await editor.fill(' \n\t ');
  await page.getByRole('button', { name: checkCodeName, exact: true }).click();
  await expect(editor).toHaveValue(' \n\t ');
  await editor.fill(source);
  await page.getByRole('button', { name: checkCodeName, exact: true }).click();
  await expect(
    page
      .getByRole('status')
      .filter({ hasText: 'Code meets the local input rules.' }),
  ).toBeVisible();
  await expect(editor).toHaveValue(source);
  await expect(editor).toHaveAttribute(invalidAttribute, 'false');
  await expect(
    page.getByRole('button', { name: submitCodeName, exact: true }),
  ).toBeDisabled();
  expect(transfers).toEqual([]);
});

test('multibyte source uses the byte boundary and is preserved when oversized', async ({
  page,
}) => {
  await page.goto(`/student/assignments/${pythonId}`);
  const editor = page.getByLabel(pythonEditorLabel, { exact: true });
  const exact = 'é'.repeat(16_384);
  await editor.fill(exact);
  await page.getByRole('button', { name: checkCodeName, exact: true }).click();
  await expect(
    page.getByText('32,768 / 32,768 UTF-8 bytes', { exact: false }),
  ).toBeVisible();
  await expect(editor).toHaveAttribute(invalidAttribute, 'false');
  await editor.fill(exact + 'é');
  await expect(
    page.getByText('32,770 / 32,768 UTF-8 bytes', { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole('alert').filter({ hasText: 'Code exceeds' }),
  ).toBeVisible();
  await page.getByRole('button', { name: checkCodeName, exact: true }).click();
  await expect(editor).toHaveValue(exact + 'é');
  await expect(editor).toBeFocused();
});

test('Java language is fixed and navigation does not reuse another assignment draft', async ({
  page,
}) => {
  await page.goto(`/student/assignments/${pythonId}`);
  await page
    .getByLabel(pythonEditorLabel, { exact: true })
    .fill('print("python draft")');
  await page
    .getByRole('link', { name: assignmentsLinkName, exact: true })
    .click();
  await page
    .getByRole('link', { name: 'View assignment: Count the vowels' })
    .click();
  const editor = page.getByLabel(javaEditorLabel, { exact: true });
  await expect(editor).toHaveValue('');
  await expect(
    page.getByText('Language: Java', { exact: false }),
  ).toBeVisible();
  await expect(page.getByRole('combobox')).toHaveCount(0);
  const source = '<script>document.body.dataset.codeExecuted = "yes"</script>';
  await editor.fill(source);
  await page.getByRole('button', { name: checkCodeName, exact: true }).click();
  await expect(editor).toHaveValue(source);
  expect(
    await page.evaluate(() => document.body.dataset.codeExecuted),
  ).toBeUndefined();
  await expect(
    page.getByRole('button', { name: submitCodeName, exact: true }),
  ).toBeDisabled();
});
