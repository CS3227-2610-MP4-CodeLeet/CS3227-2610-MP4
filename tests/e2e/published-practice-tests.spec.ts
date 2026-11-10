import { expect, type Page } from '@playwright/test';
import { coursePath, test } from './helpers/draft-fixtures';
import { revisionSession } from './helpers/revision-session';

const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const appUrl = process.env.ACCOUNT_TEST_BASE_URL ?? 'http://127.0.0.1:3100';
test.use({ baseURL: appUrl, actionTimeout: 10_000 });
test.skip(
  !process.env.MP4_E2E_SERVICE_ROLE_KEY ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    !/^http:\/\/(localhost|127\.0\.0\.1):54321$/.test(serviceUrl ?? ''),
  'Requires local synthetic accounts.',
);
const publishLabel = 'Publish tests';
const saveLabel = 'Save draft';
const refreshLabel = 'Refresh tests';
const caseName = 'Sum example';
const expectedLabel = 'Case 1 expected output';
const sourceTexts = [
  'print(sum(map(int, input().split())))',
  'import java.util.Scanner; public class Main { public static void main(String[] args) { Scanner s = new Scanner(System.in); System.out.println(s.nextInt() + s.nextInt()); } }',
];

for (const [index, language] of ['Python', 'Java'].entries()) {
  test(`${language}: private drafts, publish, draft edits and unpublish preserve student code`, async ({
    page,
    browser,
    draftFixture: data,
  }) => {
    await revisionSession(page, data.users[0].email, data.password);
    const id = data.assignments[index];
    await authorCase(page, data.courseId, id);
    await saveCases(page, saveLabel);
    const student = await browser.newPage();
    try {
      await revisionSession(student, data.users[1].email, data.password);
      expect((await publicCases(student, id)).cases).toEqual([]);
      await saveCases(page, publishLabel);
      await student.goto(coursePath(data.courseId, `/assignments/${id}`));
      await expect(student.getByText(caseName, { exact: true })).toBeVisible();
      await student
        .getByLabel(`${language} source code`)
        .fill(sourceTexts[index]);
      await runIfEnabled(student, 'Passed');
      await checkUpdatedPublication(page, student, id);
      await expect(student.getByLabel(`${language} source code`)).toHaveValue(
        sourceTexts[index],
      );
    } finally {
      await student.close();
    }
  });
}
async function checkUpdatedPublication(owner: Page, student: Page, id: string) {
  await owner.getByLabel(expectedLabel).fill('7\n');
  await saveCases(owner, saveLabel);
  expect((await publicCases(student, id)).cases[0].expected_stdout).toBe('5\n');
  await saveCases(owner, publishLabel);
  await runIfEnabled(student, 'Wrong output');
  expect((await publicCases(student, id)).cases[0].expected_stdout).toBe('7\n');
  await saveCases(owner, 'Unpublish tests');
  await student.getByRole('button', { name: refreshLabel }).click();
  await expect(student.getByText('No published test cases.')).toBeVisible();
}

test('simultaneous owner updates conflict; students cannot read drafts or write cases', async ({
  page,
  browser,
  draftFixture: data,
}) => {
  await revisionSession(page, data.users[0].email, data.password);
  const id = data.assignments[0];
  const path = `${appUrl}/api/assignments/${id}/practice-tests`;
  const updates = await Promise.all(
    [1, 2].map(() =>
      page.request.patch(path, {
        headers: { origin: appUrl },
        data: { action: 'save', expectedVersion: 0, cases: [] },
      }),
    ),
  );
  expect(updates.map((response) => response.status()).sort()).toEqual([
    200, 409,
  ]);
  const student = await browser.newPage();
  try {
    await revisionSession(student, data.users[1].email, data.password);
    expect((await student.request.get(path)).status()).toBe(404);
    expect(
      (
        await student.request.patch(path, {
          headers: { origin: appUrl },
          data: { action: 'unpublish', expectedVersion: 1 },
        })
      ).status(),
    ).toBe(404);
    expect(
      (
        await student.request.get(
          `${appUrl}/api/student/assignments/${crypto.randomUUID()}/test-cases`,
        )
      ).status(),
    ).toBe(404);
    await page.context().clearCookies();
    expect(
      (
        await page.request.get(
          `${appUrl}/api/student/assignments/${id}/test-cases`,
        )
      ).status(),
    ).toBe(401);
  } finally {
    await student.close();
  }
});

test('load errors show retry, retain source and recover with safe text on mobile/dark', async ({
  page,
  draftFixture: data,
}) => {
  await revisionSession(page, data.users[0].email, data.password);
  const id = data.assignments[0];
  await authorCase(page, data.courseId, id);
  await saveCases(page, publishLabel);
  await revisionSession(page, data.users[1].email, data.password);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.route('**/api/student/assignments/*/test-cases', (route) =>
    route.fulfill({ status: 503, json: { error: { message: 'Unavailable' } } }),
  );
  await page.goto(coursePath(data.courseId, `/assignments/${id}`));
  await page.getByLabel('Python source code').fill(sourceTexts[0]);
  await expect(
    page
      .getByRole('alert')
      .filter({ hasText: 'Published tests could not be loaded' }),
  ).toContainText('Published tests could not be loaded');
  await expect(page.getByText('No published test cases.')).toHaveCount(0);
  await page.unroute('**/api/student/assignments/*/test-cases');
  await page.getByRole('button', { name: refreshLabel }).click();
  await expect(page.getByText(caseName, { exact: true })).toBeVisible();
  await expect(page.getByLabel('Python source code')).toHaveValue(
    sourceTexts[0],
  );
  await page.screenshot({
    path: '.runtime-cache/practice-tests-mobile.png',
    fullPage: true,
  });
});

async function authorCase(page: Page, courseId: string, id: string) {
  await page.goto(coursePath(courseId, `/assignments/${id}/practice-tests`));
  await page.getByRole('button', { name: 'Add test case' }).click();
  await page.getByLabel('Case 1 name').fill(caseName);
  await page.getByLabel('Case 1 input').fill('2 3\n');
  await page.getByLabel(expectedLabel).fill('5\n');
}
async function saveCases(page: Page, label: string) {
  const response = page.waitForResponse(
    (response) =>
      response.url().endsWith('/practice-tests') &&
      response.request().method() === 'PATCH',
  );
  await page.getByRole('button', { name: label, exact: true }).click();
  expect((await response).status()).toBe(200);
  await expect(page.getByText('Saving…', { exact: true })).toHaveCount(0);
}
async function publicCases(page: Page, id: string) {
  const response = await page.request.get(
    `${appUrl}/api/student/assignments/${id}/test-cases`,
  );
  expect(response.ok()).toBeTruthy();
  return (await response.json()).data;
}
async function runIfEnabled(page: Page, verdict: string) {
  if (process.env.RUN_AUTHENTICATED_RUNTIME_TESTS !== '1') return;
  const writes: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST') writes.push(request.url());
  });
  await page.getByRole('button', { name: 'Run published tests' }).click();
  await expect(page.getByText(verdict, { exact: true })).toBeVisible({
    timeout: 40_000,
  });
  expect(
    writes.filter(
      (url) => url.includes('/api/submissions') || url.includes('/api/grades'),
    ),
  ).toEqual([]);
}
