import { expect, type Page } from '@playwright/test';

const choice = 'Use example test cases';
const testButton = 'Run tests';
const exampleHeading = 'Example test cases';
const firstCase = 'practice-case-example-sum-positive';
const noPasses = '0 of 3 passed';
type Fixture = { language: 'python' | 'java'; label: string; source: string };

export async function verifyAssignmentExamples(page: Page, fixture: Fixture) {
  const enabled = process.env.RUN_ASSIGNMENT_CASE_TESTS === '1';
  const toggle = page.getByRole('checkbox', { name: choice });
  if (!enabled) {
    await expect(toggle).toHaveCount(0);
    await expect(
      page.getByRole('heading', { name: exampleHeading }),
    ).toHaveCount(0);
    return;
  }
  const writes: string[] = [];
  page.on('request', (request) => {
    if (
      request.method() !== 'GET' &&
      /\/(api|rest\/v1)\//.test(new URL(request.url()).pathname)
    )
      writes.push(request.method());
  });
  await selectExamples(page);
  await verifyComparison(page, fixture);
  await verifyFailures(page, fixture.language);
  await clearExamples(page, fixture);
  expect(writes).toEqual([]);
}

async function runTests(page: Page, summary: string) {
  await page.getByRole('button', { name: testButton, exact: true }).click();
  await expect(
    page.getByRole('button', { name: testButton, exact: true }),
  ).toBeEnabled({ timeout: 90000 });
  await expect(page.getByText(new RegExp(summary))).toBeVisible();
}

async function verifyFailures(page: Page, language: 'python' | 'java') {
  const editor = page.getByLabel(
    `${language === 'python' ? 'Python' : 'Java'} source code`,
    { exact: true },
  );
  await editor.fill(
    language === 'python'
      ? 'raise ValueError("Example failure")'
      : 'public class Main { broken }',
  );
  await runTests(page, noPasses);
  await expect(
    page
      .getByTestId(firstCase)
      .getByText(language === 'python' ? 'Runtime error' : 'Compile error', {
        exact: true,
      }),
  ).toBeVisible();
  await editor.fill(
    language === 'python'
      ? 'while True: pass'
      : 'public class Main { public static void main(String[] args) { while (true) {} } }',
  );
  await runTests(page, noPasses);
  await expect(
    page
      .getByTestId(firstCase)
      .getByText('Time limit exceeded', { exact: true }),
  ).toBeVisible();
}

async function selectExamples(page: Page) {
  const toggle = page.getByRole('checkbox', { name: choice });
  await expect(toggle).not.toBeChecked();
  await expect(
    page.getByRole('button', { name: testButton, exact: true }),
  ).toHaveCount(0);
  await toggle.check();
  await expect(
    page.getByText('These examples are not your assignment’s tests.', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: exampleHeading }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Published test cases' }),
  ).toHaveCount(0);
}

async function verifyComparison(page: Page, fixture: Fixture) {
  const editor = page.getByLabel(`${fixture.label} source code`, {
    exact: true,
  });
  await runTests(page, '3 of 3 passed');
  const item = page.getByTestId(firstCase);
  await item.locator('summary').click();
  await expect(
    item.getByText('Expected output', { exact: true }),
  ).toBeVisible();
  await expect(item.getByText('Actual output', { exact: true })).toBeVisible();
  await editor.fill(
    fixture.language === 'python'
      ? 'print(99)'
      : 'public class Main { public static void main(String[] args) { System.out.println(99); } }',
  );
  await expect(
    page.getByText('Code changed. Run again to update the results.'),
  ).toBeVisible();
  await expect(item.getByText('Passed', { exact: true })).toHaveCount(0);
  await runTests(page, noPasses);
  await expect(item.getByText('Wrong output', { exact: true })).toBeVisible();
}

async function clearExamples(page: Page, fixture: Fixture) {
  const toggle = page.getByRole('checkbox', { name: choice });
  const editor = page.getByLabel(`${fixture.label} source code`, {
    exact: true,
  });
  await page.getByRole('button', { name: testButton, exact: true }).click();
  await expect(
    page.getByRole('button', { name: testButton, exact: true }),
  ).toBeDisabled();
  const source = await editor.inputValue();
  await toggle.uncheck();
  await expect(
    page.getByRole('button', { name: testButton, exact: true }),
  ).toHaveCount(0);
  await expect(page.getByTestId(firstCase)).toHaveCount(0);
  await expect(editor).toHaveValue(source);
  await expect(page.locator('iframe')).toHaveCount(0);
  await toggle.check();
  await expect(
    page.getByText('3 example cases', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByTestId(firstCase).getByText('Not run', { exact: true }),
  ).toBeVisible();
  await toggle.uncheck();
}
