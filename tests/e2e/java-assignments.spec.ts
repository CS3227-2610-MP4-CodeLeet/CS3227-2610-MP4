import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test';
import { verifyAssignmentExamples } from './helpers/assignment-test-examples';
import { verifyAssignmentLayout } from './helpers/assignment-layout';

const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.MP4_E2E_SERVICE_ROLE_KEY;
const appUrl = process.env.ACCOUNT_TEST_BASE_URL ?? 'http://127.0.0.1:3100';
const password = 'Local-Java-Fixture-Pass-732!';
const submitButton = 'Submit revision';
const submissionsEndpoint = '/api/submissions';
const languageLabel = 'Language';
type User = { id: string; email: string };
type Cohort = { owner: User; student: User; peer: User; courseId: string };
type Assignment = {
  id: string;
  courseId: string;
  title: string;
  instructions: string;
  language: 'python' | 'java';
  rubric: Array<{
    id: string;
    title: string;
    description: string;
    maxScore: number;
  }>;
  publicationStatus: string;
};
type Saved = {
  id: string;
  language: string;
  source: string;
  revision: number;
  request_id: string;
};
const cases = [
  {
    language: 'python',
    label: 'Python',
    source: 'print(sum(map(int, input().split())))',
    comment: '#',
  },
  {
    language: 'java',
    label: 'Java',
    source:
      'public class Main { public static void main(String[] args) { java.util.Scanner input = new java.util.Scanner(System.in); System.out.println(input.nextInt() + input.nextInt()); } }',
    comment: '//',
  },
] as const;
test.use({ baseURL: appUrl });

function adminHeaders() {
  return {
    apikey: serviceKey!,
    authorization: `Bearer ${serviceKey!}`,
    'content-type': 'application/json',
  };
}

test.describe.configure({ timeout: 120_000 });

for (const fixture of cases) {
  test(`real ${fixture.label} assignment runs, saves immutable private revisions and locks language`, async ({
    page,
    playwright,
  }) => {
    test.skip(
      !serviceKey ||
        !/^http:\/\/(localhost|127\.0\.0\.1):54321$/.test(serviceUrl ?? ''),
      'Needs explicit local Supabase test credentials.',
    );
    const admin = await playwright.request.newContext({
      extraHTTPHeaders: adminHeaders(),
    });
    const users: User[] = [];
    let courseId = '';
    try {
      const cohort = await createCohort(admin, users);
      await signIn(page, cohort.owner);
      const course = await page.request.post('/api/courses', {
        headers: { origin: appUrl },
        data: {
          title: `Language course ${crypto.randomUUID()}`,
          description: 'Synthetic language journey',
        },
      });
      expect(course.status()).toBe(201);
      courseId = (await course.json()).courseId;
      cohort.courseId = courseId;
      const enrolled = await admin.post(
        `${serviceUrl}/rest/v1/course_memberships`,
        {
          data: [cohort.student, cohort.peer].map((user) => ({
            course_id: courseId,
            user_id: user.id,
            role: 'student',
          })),
        },
      );
      expect(enrolled.ok()).toBeTruthy();
      const assignment = await publishAssignment(
        page,
        courseId,
        fixture.language,
      );
      const saved = await studentJourney(page, cohort, assignment, fixture);
      await checkPrivacy(page, cohort, assignment, saved);
      await checkLanguageLock(page, cohort.owner, assignment);
    } finally {
      try {
        await cleanFixtures(admin, users, courseId);
      } finally {
        await admin.dispose();
      }
    }
  });
}

async function createCohort(
  request: APIRequestContext,
  users: User[],
): Promise<Cohort> {
  for (const name of ['owner', 'student', 'peer']) {
    const email = `java-${name}-${Date.now()}-${crypto.randomUUID()}@example.test`;
    const response = await request.post(`${serviceUrl}/auth/v1/admin/users`, {
      headers: adminHeaders(),
      data: { email, password, email_confirm: true },
    });
    expect(response.ok()).toBeTruthy();
    users.push({ id: (await response.json()).id, email });
  }
  const role = await request.patch(
    `${serviceUrl}/rest/v1/user_roles?user_id=eq.${users[0].id}`,
    { headers: adminHeaders(), data: { role: 'instructor' } },
  );
  expect(role.ok()).toBeTruthy();
  return { owner: users[0], student: users[1], peer: users[2], courseId: '' };
}

async function signIn(page: Page, user: User) {
  await page.goto('/sign-in');
  await page.getByLabel('Email or username').fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/courses$/, { timeout: 15_000 });
}
async function signOut(page: Page) {
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page).toHaveURL(/\/sign-in$/, { timeout: 30_000 });
}

async function publishAssignment(
  page: Page,
  courseId: string,
  language: 'python' | 'java',
): Promise<Assignment> {
  await page.goto(`/courses/${courseId}/assignments`);
  await page.getByRole('link', { name: 'New assignment' }).click();
  await page.getByLabel('Maximum XP', { exact: true }).fill('0');
  await page
    .getByLabel('Title', { exact: true })
    .fill(`Language fixture ${crypto.randomUUID()}`);
  await page
    .getByLabel('Instructions')
    .fill(
      'Read two integers and print their sum. Java must use a public Main class.',
    );
  await page.getByLabel(languageLabel, { exact: true }).selectOption(language);
  await page
    .getByRole('combobox', { name: /^Status/ })
    .selectOption('published');
  const response = page.waitForResponse(
    (value) =>
      value.url().endsWith('/api/assignments') &&
      value.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Save assignment' }).click();
  const result = await response;
  expect(result.status()).toBe(201);
  const payload = result.request().postDataJSON();
  expect(payload.courseId).toBe(courseId);
  const { assignment } = await result.json();
  expect(assignment.language).toBe(language);
  await expect(page).toHaveURL(`/courses/${courseId}/assignments`);
  await signOut(page);
  return { ...payload, id: assignment.id };
}

async function saveRevision(page: Page, source: string): Promise<Saved> {
  await page.getByLabel(/^(Python|Java) source code$/).fill(source);
  const response = page.waitForResponse(
    (value) =>
      value.url().endsWith(submissionsEndpoint) &&
      value.request().method() === 'POST',
  );
  await page.getByRole('button', { name: submitButton, exact: true }).click();
  const result = await response;
  expect(result.status()).toBe(201);
  return (await result.json()).submission;
}

async function studentJourney(
  page: Page,
  cohort: Cohort,
  assignment: Assignment,
  fixture: (typeof cases)[number],
) {
  await signIn(page, cohort.student);
  await page.goto(`/courses/${cohort.courseId}/assignments/${assignment.id}`);
  const editor = page.getByLabel(`${fixture.label} source code`, {
    exact: true,
  });
  await expect(
    page.getByRole('heading', { name: `${fixture.label} submission` }),
  ).toBeVisible();
  await editor.fill(fixture.source);
  await verifyAssignmentLayout(page);
  await verifyRun(page);
  await verifyAssignmentExamples(page, fixture);
  const first = await saveRevision(page, fixture.source);
  expect(first.language).toBe(fixture.language);
  const second = await saveRevision(
    page,
    `${fixture.source}\n${fixture.comment} revision two`,
  );
  expect(second.revision).toBe(2);
  await page.getByRole('link', { name: 'Revision 1', exact: true }).click();
  await expect(
    page.getByText(`${fixture.label} source`, { exact: true }),
  ).toBeVisible();
  await expect(page.locator('pre code')).toHaveText(fixture.source);
  await checkRetryAndForgery(page, assignment, first);
  await checkConcurrentRevisions(page, assignment, fixture);
  return first;
}

async function verifyRun(page: Page) {
  if (process.env.RUN_AUTHENTICATED_RUNTIME_TESTS !== '1') return;
  await page.getByLabel('Standard input', { exact: true }).fill('2 3');
  await page.getByRole('button', { name: 'Run code', exact: true }).click();
  await expect(page.getByTestId('custom-run-result').locator('pre')).toHaveText(
    '5\n',
    { timeout: 60000 },
  );
}

async function checkRetryAndForgery(
  page: Page,
  assignment: Assignment,
  first: Saved,
) {
  const payload = {
    assignmentId: assignment.id,
    source: first.source,
    requestId: first.request_id,
  };
  const retry = await page.request.post(submissionsEndpoint, {
    headers: { origin: appUrl },
    data: payload,
  });
  expect(retry.status()).toBe(201);
  expect((await retry.json()).submission.id).toBe(first.id);
  const crossOrigin = await page.request.post(submissionsEndpoint, {
    headers: { origin: 'https://attacker.example.test' },
    data: payload,
  });
  expect(crossOrigin.status()).toBe(403);
  const extraField = await page.request.post(submissionsEndpoint, {
    headers: { origin: appUrl },
    data: { ...payload, serverManaged: true },
  });
  expect(extraField.status()).toBe(400);
  const forged = await page.request.post(submissionsEndpoint, {
    headers: { origin: appUrl },
    data: {
      ...payload,
      language: first.language === 'java' ? 'python' : 'java',
    },
  });
  expect(forged.status()).toBe(400);
  const response = await page.request.get(`/api/submissions/${first.id}`);
  const { submission } = await response.json();
  expect(submission.source).toBe(first.source);
  expect(submission.language).toBe(first.language);
  expect(submission.grades).toBeNull();
}

async function checkConcurrentRevisions(
  page: Page,
  assignment: Assignment,
  fixture: (typeof cases)[number],
) {
  const responses = await Promise.all(
    [1, 2].map((index) =>
      page.request.post(submissionsEndpoint, {
        headers: { origin: appUrl },
        data: {
          assignmentId: assignment.id,
          source: `${fixture.source}\n${fixture.comment} concurrent ${index}`,
          requestId: crypto.randomUUID(),
        },
      }),
    ),
  );
  expect(responses.map((response) => response.status())).toEqual([201, 201]);
  const revisions = await Promise.all(
    responses.map(async (response) => (await response.json()).submission),
  );
  expect(revisions.map((revision) => revision.revision).sort()).toEqual([3, 4]);
  expect(new Set(revisions.map((revision) => revision.id)).size).toBe(2);
}

async function checkPrivacy(
  page: Page,
  cohort: Cohort,
  assignment: Assignment,
  first: Saved,
) {
  await signOut(page);
  await signIn(page, cohort.peer);
  const privateApi = await page.request.get(`/api/submissions/${first.id}`);
  expect(privateApi.status()).toBe(404);
  await page.goto(`/courses/${cohort.courseId}/submissions/${first.id}`);
  await expect(page.getByText('This page could not be found.')).toBeVisible();
  await expect(page.locator('pre code')).toHaveCount(0);
  await page.goto(`/courses/${cohort.courseId}/assignments/${assignment.id}`);
  const peer = await saveRevision(page, first.source);
  expect(peer.revision).toBe(1);
  await signOut(page);
  await signIn(page, cohort.student);
  const peerApi = await page.request.get(`/api/submissions/${peer.id}`);
  expect(peerApi.status()).toBe(404);
  await signOut(page);
}

async function checkLanguageLock(
  page: Page,
  owner: User,
  assignment: Assignment,
) {
  await signIn(page, owner);
  await page.goto(
    `/courses/${assignment.courseId}/assignments/${assignment.id}/edit`,
  );
  await expect(page.getByLabel(languageLabel, { exact: true })).toBeDisabled();
  const currentResponse = await page.request.get(
    `/api/assignments?courseId=${assignment.courseId}`,
  );
  expect(currentResponse.status()).toBe(200);
  const currentAssignments = (await currentResponse.json())
    .assignments as Array<{
    id: string;
    version: number;
  }>;
  const currentVersion = currentAssignments.find(
    (item) => item.id === assignment.id,
  )?.version;
  expect(currentVersion).toBeDefined();
  const changed = await page.request.patch(
    `/api/assignments/${assignment.id}`,
    {
      headers: { origin: appUrl },
      data: {
        ...assignment,
        id: undefined,
        expectedVersion: currentVersion,
        language: assignment.language === 'java' ? 'python' : 'java',
      },
    },
  );
  const changedBody = await changed.json();
  expect(changed.status(), JSON.stringify(changedBody)).toBe(409);
  expect(changedBody.error.message).toBe(
    'Language cannot change after students have submitted code.',
  );
  const unsupported = await page.request.post('/api/assignments', {
    headers: { origin: appUrl },
    data: { ...assignment, id: undefined, language: 'javascript' },
  });
  expect(unsupported.status()).toBe(400);
}

async function cleanFixtures(
  request: APIRequestContext,
  users: User[],
  courseId: string,
) {
  if (courseId) {
    const submissions = await request.delete(
      `${serviceUrl}/rest/v1/submissions?course_id=eq.${courseId}`,
      { headers: adminHeaders() },
    );
    expect(submissions.ok()).toBeTruthy();
    const assignment = await request.delete(
      `${serviceUrl}/rest/v1/assignments?course_id=eq.${courseId}`,
      { headers: adminHeaders() },
    );
    expect(assignment.ok()).toBeTruthy();
    const course = await request.delete(
      `${serviceUrl}/rest/v1/courses?id=eq.${courseId}`,
      { headers: adminHeaders() },
    );
    expect(course.ok()).toBeTruthy();
  }
  for (const user of users) {
    const response = await request.delete(
      `${serviceUrl}/auth/v1/admin/users/${user.id}`,
      { headers: adminHeaders() },
    );
    expect(response.ok()).toBeTruthy();
  }
}
