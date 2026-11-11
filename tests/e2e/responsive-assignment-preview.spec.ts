import { expect, test, type Page } from '@playwright/test';
import { expectNoDocumentOverflow } from './helpers/responsive-layout';

const viewports = [320, 375, 768, 1024, 1440];
const assignments = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    language: 'Python',
    heading: 'Find the largest number',
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    language: 'Java',
    heading: 'Count the vowels',
  },
];

test('preview lists and Python/Java workspaces stay contained at every target width', async ({
  page,
}) => {
  test.setTimeout(180_000);

  await expectPreviewList(page);
  for (const assignment of assignments) {
    await expectPreviewEditor(page, assignment);
  }
});

async function expectPreviewList(page: Page) {
  await page.goto('/student/assignments');
  await expect(
    page.getByRole('heading', { name: 'Your assignments' }),
  ).toBeVisible();
  for (const width of viewports) {
    await page.setViewportSize({ width, height: 900 });
    await expectNoDocumentOverflow(page);
  }
}

async function expectPreviewEditor(
  page: Page,
  assignment: (typeof assignments)[number],
) {
  await page.goto(`/student/assignments/${assignment.id}`);
  await expect(
    page.getByRole('heading', { name: assignment.heading }),
  ).toBeVisible();
  const editor = page.getByLabel(`${assignment.language} source code`, {
    exact: true,
  });
  await editor.fill(`${'x'.repeat(1000)}\n${'print(1)\n'.repeat(80)}`);
  for (const width of viewports) {
    await page.setViewportSize({ width, height: 900 });
    await expectEditorBounds(editor, width);
    await expectKeyboardEditorScroll(page, editor);
    await expectNoDocumentOverflow(page);
  }
}

async function expectEditorBounds(
  editor: import('@playwright/test').Locator,
  width: number,
) {
  const geometry = await editor.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return {
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      left: bounds.left,
      right: bounds.right,
    };
  });
  expect(geometry.scrollWidth).toBeGreaterThan(geometry.clientWidth);
  expect(geometry.left).toBeGreaterThanOrEqual(0);
  expect(geometry.right).toBeLessThanOrEqual(width);
}

async function expectKeyboardEditorScroll(
  page: Page,
  editor: import('@playwright/test').Locator,
) {
  await editor.focus();
  await editor.press('Control+Home');
  await editor.press('End');
  await expect
    .poll(() =>
      page
        .getByTestId('source-highlight')
        .evaluate((element) => element.scrollLeft),
    )
    .toBeGreaterThan(0);
  await editor.press('Control+End');
  await expect
    .poll(() =>
      page
        .getByTestId('source-line-numbers')
        .evaluate((element) => element.scrollTop),
    )
    .toBeGreaterThan(0);
}
