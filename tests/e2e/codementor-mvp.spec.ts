import {
  expect,
  test,
  type APIRequestContext,
  type Page,
  type Response,
} from '@playwright/test';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.MP4_E2E_SERVICE_ROLE_KEY;
const localServicesAvailable = Boolean(
  supabaseUrl && publishableKey && serviceKey,
);
const password = 'Local-MP4-Test-Password-482!';
const revisionLinkName = 'Revision 1';
const secondRevisionLinkName = 'Revision 2';
const firstRevisionSource =
  'values = list(map(int, input().split()))\nprint(sum(values))';
const secondRevisionSource =
  'values = list(map(int, input().split()))\nprint(sum(values) + 0)';

test('student and instructor complete the CodeMentor MVP journey', async ({
  page,
  request,
}) => {
  test.skip(
    !localServicesAvailable,
    'Needs a running local Supabase stack and test-only admin key.',
  );
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const instructor = await createInstructor(
    request,
    `instructor-${suffix}@example.test`,
  );
  const assignment = await createPublishedAssignment(
    page,
    instructor.email,
    suffix,
  );
  const studentEmail = `student-${suffix}@example.test`;
  await studentSubmitsAndRequestsFeedback(page, studentEmail, suffix);
  await instructorPublishesGrade(
    page,
    instructor.email,
    assignment.criterionIds,
  );
  await studentSeesPublishedGrade(page, studentEmail, assignment.assignmentId);
});

async function createPublishedAssignment(
  page: Page,
  instructorEmail: string,
  suffix: string,
) {
  await page.goto('/sign-in');
  await signIn(page, instructorEmail);
  await expect(page).toHaveURL(/\/instructor$/);
  await page.getByRole('link', { name: 'New assignment' }).click();
  await page.getByLabel('Title', { exact: true }).fill(`Loops ${suffix}`);
  await page
    .getByLabel('Instructions')
    .fill('Read integers and print their sum.');
  await addSecondRubricCriterion(page);
  await page.getByLabel('Status').selectOption('published');
  const saveResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/assignments') &&
      response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Save assignment' }).click();
  const payload = await assignmentRequestPayload(await saveResponse);
  await expect(page).toHaveURL(/\/instructor$/);
  const editUrl = await page
    .getByRole('link', { name: 'Edit', exact: true })
    .getAttribute('href');
  expect(editUrl).toBeTruthy();
  const assignmentId = editUrl!.split('/').at(-2)!;
  await page.getByRole('button', { name: 'Sign out' }).click();
  return {
    assignmentId,
    criterionIds: payload.rubric.map((criterion) => criterion.id),
  };
}

async function assignmentRequestPayload(response: Response) {
  if (response.status() !== 201) {
    const headers = await response.request().allHeaders();
    throw new Error(
      `Assignment save failed (${response.status()}), origin=${headers.origin ?? 'missing'}, url=${response.request().url()}, host=${headers.host ?? 'missing'}, forwardedHost=${headers['x-forwarded-host'] ?? 'missing'}, forwardedProto=${headers['x-forwarded-proto'] ?? 'missing'}`,
    );
  }
  return response.request().postDataJSON() as {
    rubric: Array<{ id: string }>;
  };
}

async function addSecondRubricCriterion(page: Page) {
  await page
    .getByRole('button', { name: 'Add rubric criterion' })
    .click({ timeout: 5000 });
  await page.getByLabel('Criterion 2 title').fill('Efficiency');
  await page
    .getByLabel('Criterion 2 description')
    .fill('Uses appropriate complexity.');
  await page.getByLabel('Criterion 2 maximum score').fill('5');
}

async function studentSubmitsAndRequestsFeedback(
  page: Page,
  email: string,
  suffix: string,
) {
  await page.goto('/sign-up');
  await page.getByLabel('Display name').fill('MVP Test Student');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Create student account' }).click();
  await expect(page).toHaveURL(/\/student\/assignments$/);
  await page
    .getByRole('link', { name: `Loops ${suffix}`, exact: true })
    .click();
  await page.getByLabel('Python source code').fill(firstRevisionSource);
  await page.getByRole('button', { name: 'Submit revision' }).click();
  await expect(
    page.getByRole('link', { name: revisionLinkName }),
  ).toBeVisible();
  await mockStudentFeedback(page);
  await page.getByRole('link', { name: revisionLinkName }).click();
  await page.getByRole('button', { name: 'Request review' }).click();
  await expect(
    page.getByText('Try a few positive and negative values.'),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Back to assignment' }).click();
  await submitAndVerifySecondRevision(page);
  await page.getByRole('button', { name: 'Sign out' }).click();
}

async function submitAndVerifySecondRevision(page: Page) {
  await page.getByLabel('Python source code').fill(secondRevisionSource);
  await page.getByRole('button', { name: 'Submit revision' }).click();
  await expect(
    page.getByRole('link', { name: secondRevisionLinkName }),
  ).toBeVisible();
  await page.getByRole('link', { name: revisionLinkName }).click();
  await expect(page.locator('pre code')).toHaveText(firstRevisionSource);
  await page.getByRole('link', { name: 'Back to assignment' }).click();
  await page.getByRole('link', { name: secondRevisionLinkName }).click();
  await expect(page.locator('pre code')).toHaveText(secondRevisionSource);
}

async function mockStudentFeedback(page: Page) {
  await page.route('**/api/ai/student-review', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        result: {
          summary: 'Try a few positive and negative values.',
          strengths: ['Uses a list'],
          nextSteps: ['Check empty input'],
          questions: ['What should happen for no values?'],
        },
      }),
    }),
  );
}

async function instructorPublishesGrade(
  page: Page,
  email: string,
  criterionIds: string[],
) {
  await page.goto('/sign-in');
  await signIn(page, email);
  await page.getByRole('link', { name: 'Submissions' }).click();
  await page.getByRole('link', { name: 'Review' }).first().click();
  await page.route('**/api/ai/instructor-review', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        result: {
          criteria: criterionIds.map((criterionId, index) => ({
            criterionId,
            suggestedScore: index === 0 ? 8 : 4,
            feedback: 'The criterion is demonstrated clearly.',
          })),
          overallFeedback: 'Check the empty input case.',
          totalScore: 12,
        },
      }),
    }),
  );
  await page.getByRole('button', { name: 'Request review' }).click();
  await expect(page.getByText('Suggested total: 12')).toBeVisible();
  await page.getByLabel(/Correctness/).fill('8');
  await page.getByLabel(/Efficiency/).fill('4');
  await page.getByLabel('Publish this grade to the student').check();
  await page.getByRole('button', { name: 'Save and publish' }).click();
  await expect(page.getByRole('status')).toHaveText(
    'Grade saved and published.',
  );
  await page.getByRole('button', { name: 'Sign out' }).click();
}

async function studentSeesPublishedGrade(
  page: Page,
  email: string,
  assignmentId: string,
) {
  await page.goto('/sign-in');
  await signIn(page, email);
  await expect(page).toHaveURL(/\/student\/assignments$/);
  await page.goto(`/student/assignments/${assignmentId}`);
  await page.getByRole('link', { name: 'Revision 2' }).click();
  await expect(
    page.getByRole('heading', { name: 'Published grade: 12' }),
  ).toBeVisible();
}

async function signIn(page: Page, email: string) {
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

async function createInstructor(request: APIRequestContext, email: string) {
  const headers = {
    apikey: serviceKey!,
    authorization: `Bearer ${serviceKey!}`,
    'content-type': 'application/json',
  };
  const createResponse = await request.post(
    `${supabaseUrl}/auth/v1/admin/users`,
    {
      headers,
      data: { email, password, email_confirm: true },
    },
  );
  expect(createResponse.ok()).toBeTruthy();
  const created = (await createResponse.json()) as { id: string };
  const roleResponse = await request.patch(
    `${supabaseUrl}/rest/v1/user_roles?user_id=eq.${created.id}`,
    {
      headers: { ...headers, prefer: 'return=minimal' },
      data: { role: 'instructor' },
    },
  );
  expect(roleResponse.ok()).toBeTruthy();
  return { email };
}
