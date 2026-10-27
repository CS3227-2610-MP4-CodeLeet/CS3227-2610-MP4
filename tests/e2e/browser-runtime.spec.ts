import { expect, test } from '@playwright/test';
test.skip(
  process.env.RUN_BROWSER_RUNTIME_TESTS !== '1',
  'Opt-in real runtime tests require local reviewed assets.',
);
const pythonId = '10000000-0000-4000-8000-000000000001';
const javaId = '10000000-0000-4000-8000-000000000002';
const python =
  'numbers = list(map(int, input().split()))\nlargest = numbers[0]\nfor number in numbers:\n    if number > largest:\n        largest = number\nprint(largest)';
const java =
  'public class Main { public static void main(String[] args) { java.util.Scanner s = new java.util.Scanner(System.in); String line=s.nextLine().toLowerCase(); int n=0; for(int i=0;i<line.length();i++) if("aeiou".indexOf(line.charAt(i))>=0) n++; System.out.println(n); } }';

test('Python published tests pass, mismatches show actual output, edits invalidate results', async ({
  page,
}) => {
  const transfers: string[] = [];
  page.on('request', (request) => {
    if (
      request.postData()?.includes('numbers =') ||
      request.url().includes('numbers%20%3D')
    )
      transfers.push(request.url());
  });
  await page.goto(`/student/assignments/${pythonId}`);
  await page.getByLabel('Python source code', { exact: true }).fill(python);
  await page
    .getByRole('button', { name: 'Run published tests', exact: true })
    .click();
  await expect(page.getByTestId('practice-case-single')).toContainText(
    'Passed',
    { timeout: 45000 },
  );
  await expect(page.getByTestId('practice-case-negative')).toContainText(
    'Passed',
  );
  await expect(page.getByTestId('practice-case-repeated')).toContainText(
    'Passed',
  );
  await page.getByLabel('Python source code', { exact: true }).fill('print(0)');
  await expect(
    page.getByText('Code changed. Run again to update the results.'),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Run published tests', exact: true })
    .click();
  await expect(page.getByTestId('practice-case-negative')).toContainText(
    'Wrong output',
    { timeout: 30000 },
  );
  await expect(page.getByTestId('practice-case-negative')).toContainText(
    'Actual output',
  );
  await expect(
    page.getByRole('button', { name: 'Submit code', exact: true }),
  ).toBeDisabled();
  expect(transfers).toEqual([]);
});

test('Java uses real source and Scanner for custom input and all published tests', async ({
  page,
}) => {
  await page.goto(`/student/assignments/${javaId}`);
  await page.getByLabel('Java source code', { exact: true }).fill(java);
  await page.getByLabel('Standard input', { exact: true }).fill('Audio');
  await page.getByRole('button', { name: 'Run code', exact: true }).click();
  await expect(page.getByTestId('custom-run-result')).toContainText(
    'Completed',
    { timeout: 30000 },
  );
  await expect(
    page.getByTestId('custom-run-result').locator('pre').first(),
  ).toHaveText('4\n');
  await page
    .getByRole('button', { name: 'Run published tests', exact: true })
    .click();
  await expect(page.getByTestId('practice-case-empty')).toContainText(
    'Passed',
    { timeout: 30000 },
  );
  await expect(page.getByTestId('practice-case-uppercase')).toContainText(
    'Passed',
  );
  await expect(page.getByTestId('practice-case-mixed')).toContainText('Passed');
});

test('compiler/runtime errors, timeout, Stop and fresh rerun remain usable', async ({
  page,
}) => {
  await page.goto(`/student/assignments/${javaId}`);
  await page
    .getByLabel('Java source code', { exact: true })
    .fill('public class Main { BROKEN }');
  await page
    .getByRole('button', { name: 'Run published tests', exact: true })
    .click();
  await expect(page.getByTestId('practice-case-mixed')).toContainText(
    'Compile error',
    { timeout: 30000 },
  );
  await expect(page.getByTestId('practice-case-uppercase')).toContainText(
    'Not run',
  );
  await page.goto(`/student/assignments/${pythonId}`);
  const editor = page.getByLabel('Python source code', { exact: true });
  await editor.fill('raise ValueError("practice failure")');
  await page.getByRole('button', { name: 'Run code', exact: true }).click();
  await expect(page.getByTestId('custom-run-result')).toContainText(
    'Runtime error',
    { timeout: 30000 },
  );
  await editor.fill('while True: pass');
  await page.getByRole('button', { name: 'Run code', exact: true }).click();
  await expect(page.getByTestId('custom-run-result')).toContainText(
    'Time limit exceeded',
    { timeout: 30000 },
  );
  await page
    .getByRole('button', { name: 'Run published tests', exact: true })
    .click();
  await page.getByRole('button', { name: 'Stop', exact: true }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Stopped.' }),
  ).toBeVisible();
  await expect(page.getByTestId('practice-case-single')).toContainText(
    'Not run',
  );
  await editor.fill('print("<script>window.BAD = true</script>")');
  await page.getByRole('button', { name: 'Run code', exact: true }).click();
  await expect(page.getByTestId('custom-run-result')).toContainText(
    '<script>window.BAD = true</script>',
    { timeout: 30000 },
  );
  expect(await page.evaluate(() => 'BAD' in window)).toBe(false);
});

test('unavailable bridge recovers and ignores forged results', async ({
  page,
}) => {
  await page.route('http://127.0.0.1:3130/embed?**', (route) => route.abort());
  await page.goto(`/student/assignments/${pythonId}`);
  await page.getByLabel('Python source code', { exact: true }).fill('print(1)');
  await page.getByRole('button', { name: 'Run code', exact: true }).click();
  await page.evaluate(() =>
    window.postMessage(
      { type: 'result', result: { status: 'ok', stdout: 'forged' } },
      location.origin,
    ),
  );
  await expect(
    page.getByText(
      'Start the local browser runner on port 3130, then try again.',
    ),
  ).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId('custom-run-result')).toHaveCount(0);
  await page.unroute('http://127.0.0.1:3130/embed?**');
  await page.getByRole('button', { name: 'Run code', exact: true }).click();
  await expect(page.getByTestId('custom-run-result')).toContainText(
    'Completed',
    { timeout: 30000 },
  );
});
