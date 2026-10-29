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
type Cohort = { owner: User; student: User; peer: User };
type Assignment = {
  id: string;
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

for (const fixture of cases) {
  test(`real ${fixture.label} assignment runs, saves immutable private revisions and locks language`, async ({
    page,
    request,
  }) => {
    test.skip(
      !serviceKey ||
        !/^http:\/\/(localhost|127\.0\.0\.1):54321$/.test(serviceUrl ?? ''),
      'Needs explicit local Supabase test credentials.',
    );
    const cohort = await createCohort(request);
    let assignmentId = '';
    try {
      const assignment = await publishAssignment(
        page,
        cohort.owner,
        fixture.language,
      );
      assignmentId = assignment.id;
      const saved = await studentJourney(page, cohort, assignment, fixture);
      await checkPrivacy(page, cohort, assignment, saved);
      await checkLanguageLock(page, cohort.owner, assignment);
    } finally {
      await cleanFixtures(request, cohort, assignmentId);
    }
  });
}

async function createCohort(request: APIRequestContext): Promise<Cohort> {
  const users: User[] = [];
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
  return { owner: users[0], student: users[1], peer: users[2] };
}

async function signIn(page: Page, user: User) {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).not.toHaveURL(/\/sign-in$/);
}
async function signOut(page: Page) {
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
}

async function publishAssignment(
  page: Page,
  owner: User,
  language: 'python' | 'java',
): Promise<Assignment> {
  await signIn(page, owner);
  await page.getByRole('link', { name: 'New assignment' }).click();
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
  const { assignment } = await result.json();
  expect(assignment.language).toBe(language);
  await expect(page).toHaveURL(/\/instructor$/);
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
  await page.goto(`/student/assignments/${assignment.id}`);
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
  const privatePage = await page.goto(`/student/submissions/${first.id}`);
  expect(privatePage?.status()).toBe(404);
  await expect(page.locator('pre code')).toHaveCount(0);
  await page.goto(`/student/assignments/${assignment.id}`);
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
  await page.goto(`/instructor/assignments/${assignment.id}/edit`);
  await expect(page.getByLabel(languageLabel, { exact: true })).toBeDisabled();
  const changed = await page.request.patch(
    `/api/assignments/${assignment.id}`,
    {
      headers: { origin: appUrl },
      data: {
        ...assignment,
        id: undefined,
        expectedVersion: 1,
        language: assignment.language === 'java' ? 'python' : 'java',
      },
    },
  );
  expect(changed.status()).toBe(400);
  expect((await changed.json()).error.message).toBe(
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
  cohort: Cohort,
  assignmentId: string,
) {
  if (assignmentId) {
    const submissions = await request.delete(
      `${serviceUrl}/rest/v1/submissions?assignment_id=eq.${assignmentId}`,
      { headers: adminHeaders() },
    );
    expect(submissions.ok()).toBeTruthy();
    const assignment = await request.delete(
      `${serviceUrl}/rest/v1/assignments?id=eq.${assignmentId}`,
      { headers: adminHeaders() },
    );
    expect(assignment.ok()).toBeTruthy();
  }
  for (const user of Object.values(cohort)) {
    const response = await request.delete(
      `${serviceUrl}/auth/v1/admin/users/${user.id}`,
      { headers: adminHeaders() },
    );
    expect(response.ok()).toBeTruthy();
  }
}
