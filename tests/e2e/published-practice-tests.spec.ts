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

const refreshLabel = 'Refresh tests';
const visibilityLabel = 'Public (visible to students)';
const instructorApiPrefix = '/api/assignments/';
const retiredSuffix = '/practice-tests';
const editSuffix = '/edit';
const assignmentPrefix = '/assignments/';
const caseName = 'Sum example';
const expectedLabel = 'Expected output (stdout)';
const sourceTexts = [
  'print(sum(map(int, input().split())))',
  'import java.util.Scanner; public class Main { public static void main(String[] args) { Scanner s = new Scanner(System.in); System.out.println(s.nextInt() + s.nextInt()); } }',
];

for (const [index, language] of ['Python', 'Java'].entries()) {
  test(`${language}: assignment edits, visibility and removal preserve student code`, async ({
    page,
    browser,
    draftFixture: data,
  }) => {
    await revisionSession(page, data.users[0].email, data.password);
    const id = data.assignments[index];
    await authorCase(page, data.courseId, id);
    await saveCases(page);
    const student = await browser.newPage();
    try {
      await revisionSession(student, data.users[1].email, data.password);
      expect((await publicCases(student, id)).cases).toHaveLength(1);
      await student.goto(coursePath(data.courseId, `/assignments/${id}`));
      await expect(student.getByText(caseName, { exact: true })).toBeVisible();
      await student
        .getByLabel(`${language} source code`)
        .fill(sourceTexts[index]);
      await runIfEnabled(student, 'Passed');
      await checkUpdatedPublication(page, student, id, data.courseId);
      await expect(student.getByLabel(`${language} source code`)).toHaveValue(
        sourceTexts[index],
      );
    } finally {
      await student.close();
    }
  });
}
async function checkUpdatedPublication(
  owner: Page,
  student: Page,
  id: string,
  courseId: string,
) {
  await openEditor(owner, courseId, id);
  await owner.getByLabel(expectedLabel).first().fill('7\n');
  await saveCases(owner);
  await runIfEnabled(student, 'Wrong output');
  expect((await publicCases(student, id)).cases[0].expected_stdout).toBe('7\n');
  await openEditor(owner, courseId, id);
  await owner
    .getByRole('checkbox', { name: visibilityLabel })
    .first()
    .uncheck();
  await saveCases(owner);
  expect((await publicCases(student, id)).cases).toEqual([]);
  const retained = await owner.request.get(
    appUrl + instructorApiPrefix + id + retiredSuffix,
  );
  expect((await retained.json()).data.cases).toHaveLength(2);
  await student.getByRole('button', { name: refreshLabel }).click();
  await expect(student.getByText('No published test cases.')).toBeVisible();
  await openEditor(owner, courseId, id);
  await owner
    .getByRole('button', { name: 'Remove test case 2', exact: true })
    .click();
  await owner
    .getByRole('button', { name: 'Remove test case 1', exact: true })
    .click();
  await saveCases(owner);
  const removed = await owner.request.get(
    appUrl + instructorApiPrefix + id + retiredSuffix,
  );
  expect((await removed.json()).data.cases).toEqual([]);
}

test('assignment writes conflict and retired publication controls are unavailable', async ({
  page,
  browser,
  draftFixture: data,
}) => {
  await revisionSession(page, data.users[0].email, data.password);
  const id = data.assignments[0];
  const payload = await assignmentUpdate(page, id, data.courseId);
  const path = appUrl + instructorApiPrefix + id;
  const updates = await Promise.all(
    [1, 2].map(() =>
      page.request.patch(path, {
        headers: { origin: appUrl },
        data: payload,
      }),
    ),
  );
  expect(updates.map((response) => response.status()).sort()).toEqual([
    200, 409,
  ]);
  expect(
    (
      await page.request.patch(path + retiredSuffix, {
        headers: { origin: appUrl },
        data: { action: 'publish', expectedVersion: 0, cases: [] },
      })
    ).status(),
  ).toBe(405);
  const retired = await page.goto(
    coursePath(data.courseId, assignmentPrefix + id + retiredSuffix),
  );
  expect(retired?.status()).toBe(404);
  const student = await browser.newPage();
  try {
    await revisionSession(student, data.users[1].email, data.password);
    expect((await student.request.get(path + retiredSuffix)).status()).toBe(
      404,
    );
    expect(
      (
        await student.request.patch(path, {
          headers: { origin: appUrl },
          data: payload,
        })
      ).status(),
    ).toBe(404);
    expect(
      (
        await student.request.get(
          appUrl +
            '/api/student/assignments/' +
            crypto.randomUUID() +
            '/test-cases',
        )
      ).status(),
    ).toBe(404);
    await page.context().clearCookies();
    expect(
      (
        await page.request.get(
          appUrl + '/api/student/assignments/' + id + '/test-cases',
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
  await saveCases(page);
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
  await openEditor(page, courseId, id);
  await page.getByRole('button', { name: 'Add test case' }).click();
  await page.getByLabel('Test case 1 name').fill(caseName);
  await page.getByLabel('Standard input (stdin)').first().fill('2 3\n');
  await page.getByLabel(expectedLabel).first().fill('5\n');
  await page.getByRole('button', { name: 'Add test case' }).click();
  await page.getByLabel('Test case 2 name').fill('Private example');
  await page.getByRole('checkbox', { name: visibilityLabel }).nth(1).uncheck();
}
async function saveCases(page: Page) {
  const response = page.waitForResponse(
    (response) =>
      /\/api\/assignments\/[^/]+$/.test(response.url()) &&
      response.request().method() === 'PATCH',
  );
  await page
    .getByRole('button', { name: 'Save assignment', exact: true })
    .click();
  expect((await response).status()).toBe(200);
  await expect(
    page.getByRole('heading', { name: 'Assignments', exact: true }),
  ).toBeVisible();
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

async function assignmentUpdate(page: Page, id: string, courseId: string) {
  const list = await page.request.get(
    appUrl + '/api/assignments?courseId=' + courseId,
  );
  const assignment = (await list.json()).assignments.find(
    (item: { id: string }) => item.id === id,
  );
  return {
    courseId: courseId,
    title: assignment.title,
    instructions: 'Synthetic',
    language: 'python',
    publicationStatus: 'published',
    expectedVersion: assignment.version,
    rubric: [
      {
        id: crypto.randomUUID(),
        title: 'Correctness',
        description: 'Synthetic',
        maxScore: 10,
      },
    ],
    cases: [],
  };
}

async function openEditor(page: Page, courseId: string, id: string) {
  await page.goto(coursePath(courseId, assignmentPrefix + id + editSuffix));
  await page.waitForLoadState('networkidle');
}
