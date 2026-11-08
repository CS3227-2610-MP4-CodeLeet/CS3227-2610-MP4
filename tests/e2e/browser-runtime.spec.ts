import { expect, test, type Page } from '@playwright/test';
test.skip(
  process.env.RUN_BROWSER_RUNTIME_TESTS !== '1',
  'Opt-in real runtime tests require local reviewed assets.',
);
const pythonId = '10000000-0000-4000-8000-000000000001';
const javaId = '10000000-0000-4000-8000-000000000002';
const pythonEditorLabel = 'Python source code';
const javaEditorLabel = 'Java source code';
const runPublishedTestsName = 'Run published tests';
const passedText = 'Passed';
const negativeCaseId = 'practice-case-negative';
const customResultId = 'custom-run-result';
const runCodeName = 'Run code';
const submitCodeName = 'Submit code';
const compileErrorLabel = 'Compile error';
const mixedCaseId = 'practice-case-mixed';
const compatibilityExplanation =
  'This program uses a feature that the code runner does not support.';
const threadExample = `public class Main {
  static class MyTask implements Runnable {
    public void run() { System.out.println("Hello from the background thread: " + Thread.currentThread().getName()); }
  }
  public static void main(String[] args) {
    System.out.println("Hello from the main thread: " + Thread.currentThread().getName());
    MyTask task = new MyTask();
    Thread thread = new Thread(task);
    thread.start();
  }
}`;

test('Java unsupported features show a helpful error in custom and practice results without rewriting source', async ({
  page,
}) => {
  const transfers: string[] = [];
  page.on('request', (request) => {
    if (
      request.postData()?.includes('class Main') ||
      request.url().includes('class%20Main')
    )
      transfers.push(request.url());
  });
  await page.goto(`/student/assignments/${javaId}`);
  await runJavaSource(page, threadExample, compileErrorLabel);
  await expect(page.getByTestId(customResultId)).toContainText(
    compatibilityExplanation,
  );
  await expect(page.getByTestId(customResultId)).not.toContainText('{{c0}}');
  await page
    .getByRole('button', { name: runPublishedTestsName, exact: true })
    .click();
  await expect(page.getByTestId(mixedCaseId)).toContainText(
    compatibilityExplanation,
    { timeout: 30_000 },
  );
  await expect(page.getByLabel(javaEditorLabel, { exact: true })).toHaveValue(
    threadExample,
  );
  expect(transfers).toEqual([]);
  await page.screenshot({
    path: 'test-results/java-unsupported-feature.png',
    fullPage: true,
  });
});

test('Java direct Runnable, syntax errors and literal program stderr stay accurate', async ({
  page,
}) => {
  await page.goto(`/student/assignments/${javaId}`);
  await runJavaSource(
    page,
    threadExample.replace('thread.start();', 'thread.run();'),
    'Completed',
  );
  await expect(
    page.getByTestId(customResultId).locator('pre').first(),
  ).toHaveText(
    'Hello from the main thread: main\nHello from the background thread: main\n',
  );
  await runJavaSource(
    page,
    'public class Main { public static void main(String[] a) { System.out.println(1) } }',
    compileErrorLabel,
  );
  await expect(page.getByTestId(customResultId)).toContainText('expected');
  await expect(page.getByTestId(customResultId)).not.toContainText(
    compatibilityExplanation,
  );
  await runJavaSource(
    page,
    'public class Main { public static void main(String[] a) { System.err.println("teavm: Class {{c0}} is not supported on current target"); } }',
    'Completed',
  );
  await expect(page.getByTestId(customResultId)).toContainText('{{c0}}');
  await expect(page.getByTestId(customResultId)).not.toContainText(
    compatibilityExplanation,
  );
  await runJavaSource(
    page,
    'public class Main { public static void main(String[] a) throws Exception { Thread.sleep(5); } }',
    compileErrorLabel,
  );
  await expect(page.getByTestId(customResultId)).toContainText(
    compatibilityExplanation,
  );
});

async function runJavaSource(page: Page, source: string, outcome: string) {
  await page.getByLabel(javaEditorLabel, { exact: true }).fill(source);
  await page.getByRole('button', { name: runCodeName, exact: true }).click();
  await expect(page.getByTestId(customResultId)).toContainText(outcome, {
    timeout: 30_000,
  });
  await expect(
    page.getByRole('button', { name: runCodeName, exact: true }),
  ).toBeEnabled();
  await expect(page.getByLabel(javaEditorLabel, { exact: true })).toHaveValue(
    source,
  );
}
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
  await page.getByLabel(pythonEditorLabel, { exact: true }).fill(python);
  await page
    .getByRole('button', { name: runPublishedTestsName, exact: true })
    .click();
  await expect(page.getByTestId('practice-case-single')).toContainText(
    passedText,
    { timeout: 45000 },
  );
  await expect(page.getByTestId(negativeCaseId)).toContainText(passedText);
  await expect(page.getByTestId('practice-case-repeated')).toContainText(
    passedText,
  );
  await expect(
    page.getByText('3 of 3 passed · 3 run', { exact: true }),
  ).toBeVisible();
  await page
    .getByTestId(negativeCaseId)
    .getByText('Negative numbers', { exact: true })
    .click();
  await expect(
    page
      .getByTestId(negativeCaseId)
      .getByText('Actual output', { exact: true }),
  ).toBeVisible();
  await page.getByLabel(pythonEditorLabel, { exact: true }).fill('print(0)');
  await expect(
    page.getByText('Code changed. Run again to update the results.'),
  ).toBeVisible();
  await page
    .getByRole('button', { name: runPublishedTestsName, exact: true })
    .click();
  await expect(page.getByTestId(negativeCaseId)).toContainText('Wrong output', {
    timeout: 30000,
  });
  await expect(page.getByTestId(negativeCaseId)).toContainText('Actual output');
  await expect(
    page.getByRole('button', { name: submitCodeName, exact: true }),
  ).toBeDisabled();
  expect(transfers).toEqual([]);
});

test('Java uses real source and Scanner for custom input and all published tests', async ({
  page,
}) => {
  await page.goto(`/student/assignments/${javaId}`);
  await page.emulateMedia({ colorScheme: 'light' });
  await page
    .getByRole('button', { name: 'Switch to dark mode', exact: true })
    .click();
  await expect(page.locator('.student-workspace')).toHaveAttribute(
    'data-theme',
    'dark',
  );
  await page.getByLabel(javaEditorLabel, { exact: true }).fill(java);
  await page.getByLabel('Standard input', { exact: true }).fill('Audio');
  await page.getByRole('button', { name: runCodeName, exact: true }).click();
  await expect(
    page.getByRole('button', { name: runCodeName, exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Stop', exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Switch to light mode', exact: true })
    .click();
  await expect(page.getByLabel(javaEditorLabel, { exact: true })).toHaveValue(
    java,
  );
  await expect(page.getByTestId(customResultId)).toContainText('Completed', {
    timeout: 30000,
  });
  await expect(
    page.getByTestId(customResultId).locator('pre').first(),
  ).toHaveText('4\n');
  await page
    .getByRole('button', { name: 'Switch to dark mode', exact: true })
    .click();
  await page
    .getByRole('button', { name: runPublishedTestsName, exact: true })
    .click();
  await expect(page.getByTestId('practice-case-empty')).toContainText(
    passedText,
    { timeout: 30000 },
  );
  await expect(page.getByTestId('practice-case-uppercase')).toContainText(
    passedText,
  );
  await expect(page.getByTestId(mixedCaseId)).toContainText(passedText);
});

test('compiler/runtime errors, timeout, navigation cancellation and fresh rerun remain usable', async ({
  page,
}) => {
  await assertCompilerFailure(page);
  const editor = await assertPythonFailures(page);
  await assertNavigationAndFreshRun(page, editor);
});

async function assertCompilerFailure(page: Page) {
  await page.goto(`/student/assignments/${javaId}`);
  await page
    .getByLabel(javaEditorLabel, { exact: true })
    .fill('public class Main { BROKEN }');
  await page
    .getByRole('button', { name: runPublishedTestsName, exact: true })
    .click();
  await expect(page.getByTestId(mixedCaseId)).toContainText('Compile error', {
    timeout: 30000,
  });
  await expect(page.getByTestId('practice-case-uppercase')).toContainText(
    'Not run',
  );
}

async function assertPythonFailures(page: Page) {
  await page.goto(`/student/assignments/${pythonId}`);
  const editor = page.getByLabel(pythonEditorLabel, { exact: true });
  await editor.fill('raise ValueError("practice failure")');
  await runCode(page);
  await expect(page.getByTestId(customResultId)).toContainText(
    'Runtime error',
    { timeout: 30000 },
  );
  await editor.fill('while True: pass');
  await runCode(page);
  await expect(page.getByTestId(customResultId)).toContainText(
    'Time limit exceeded',
    { timeout: 30000 },
  );
  return editor;
}

async function runCode(page: Page) {
  await page.getByRole('button', { name: runCodeName, exact: true }).click();
}

async function assertNavigationAndFreshRun(
  page: Page,
  editor: ReturnType<Page['getByLabel']>,
) {
  await page
    .getByRole('button', { name: runPublishedTestsName, exact: true })
    .click();
  await page
    .getByRole('link', { name: 'All assignments', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Your assignments' }),
  ).toBeVisible();
  await expect(
    page.locator('iframe[title="Local browser code runner"]'),
  ).toHaveCount(0);
  await page
    .getByRole('link', { name: 'View assignment: Find the largest number' })
    .click();
  await expect(page.getByTestId('practice-case-single')).toContainText(
    'Not run',
  );
  await editor.fill('print("<script>window.BAD = true</script>")');
  await runCode(page);
  await expect(page.getByTestId(customResultId)).toContainText(
    '<script>window.BAD = true</script>',
    { timeout: 30000 },
  );
  expect(await page.evaluate(() => 'BAD' in window)).toBe(false);
}

test('unavailable bridge recovers and ignores forged results', async ({
  page,
}) => {
  let iframeRequestBlocked = false;
  await page.route('**/embed.html**', (route) => {
    iframeRequestBlocked = true;
    return route.abort();
  });
  await page.goto(`/student/assignments/${pythonId}`);
  await page.getByLabel(pythonEditorLabel, { exact: true }).fill('print(1)');
  await page.getByRole('button', { name: runCodeName, exact: true }).click();
  await page.evaluate(() =>
    window.postMessage(
      { type: 'result', result: { status: 'ok', stdout: 'forged' } },
      location.origin,
    ),
  );
  await expect(
    page.getByText(
      'The browser runner did not initialize. Reload and try again.',
    ),
  ).toBeVisible({ timeout: 15000 });
  expect(iframeRequestBlocked).toBe(true);
  await expect(page.getByTestId(customResultId)).toHaveCount(0);
  await page.unroute('**/embed.html**');
  await page.getByRole('button', { name: runCodeName, exact: true }).click();
  await expect(page.getByTestId(customResultId)).toContainText('Completed', {
    timeout: 30000,
  });
});
