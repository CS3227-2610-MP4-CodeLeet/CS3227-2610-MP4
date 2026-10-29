import { expect, type Locator, type Page } from '@playwright/test';

export async function verifyAssignmentLayout(page: Page) {
  const navigation = page.getByRole('navigation', {
    name: 'Student navigation',
  });
  await expect(navigation.getByRole('link')).toHaveText(['Assignments']);
  if (process.env.RUN_AUTHENTICATED_RUNTIME_TESTS !== '1') return;
  const controls = [
    page.getByLabel(/^(Python|Java) source code$/),
    page.getByRole('button', { name: 'Run code', exact: true }),
    page.getByRole('heading', { name: 'Run & test', exact: true }),
    page.getByLabel('Standard input', { exact: true }),
    page.getByRole('heading', { name: 'Published test cases', exact: true }),
    page.getByRole('button', { name: 'Submit revision', exact: true }),
    page.getByRole('heading', { name: 'Your revisions', exact: true }),
  ];
  for (let index = 1; index < controls.length; index++) {
    await expectBefore(controls[index - 1], controls[index]);
  }
  await checkResponsiveLayout(page);
}

async function checkResponsiveLayout(page: Page) {
  const viewport = page.viewportSize();
  const label = await page
    .getByRole('heading', { name: /^(Python|Java) submission$/ })
    .textContent();
  await page.screenshot({
    path: `test-results/layout-${label}-desktop.png`,
    fullPage: true,
  });
  await page.setViewportSize({ width: 375, height: 812 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/layout-${label}-mobile.png`,
    fullPage: true,
  });
  if (viewport) await page.setViewportSize(viewport);
}

async function expectBefore(first: Locator, second: Locator) {
  const next = await second.elementHandle();
  expect(
    await first.evaluate(
      (node, other) =>
        Boolean(
          other &&
          node.compareDocumentPosition(other) &
            Node.DOCUMENT_POSITION_FOLLOWING,
        ),
      next,
    ),
  ).toBe(true);
}
