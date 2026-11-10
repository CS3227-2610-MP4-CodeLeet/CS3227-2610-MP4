import { expect, type APIRequestContext, type Page } from '@playwright/test';
import { test as base } from './draft-fixtures';
import { revisionSession } from './revision-session';
import { coursePath } from './draft-fixtures';

export const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const deadlineHeaders = {
  apikey: process.env.MP4_E2E_SERVICE_ROLE_KEY!,
  authorization: `Bearer ${process.env.MP4_E2E_SERVICE_ROLE_KEY!}`,
};
export const dueLabel = 'Due date and time (SGT, optional)';
export const appUrl =
  process.env.ACCOUNT_TEST_BASE_URL ?? 'http://127.0.0.1:3100';
export const sources = [
  'print(1)',
  'public class Main { public static void main(String[] args) { System.out.println(1); } }',
];
export type DeadlineData = {
  admin: APIRequestContext;
  peerId: string;
  peerRevision: string;
};

export const test = base.extend<{ deadlineData: DeadlineData }>({
  deadlineData: async ({ draftFixture: data, playwright }, provide) => {
    const admin = await playwright.request.newContext();
    let peerId = '';
    try {
      const response = await admin.post(`${serviceUrl}/auth/v1/admin/users`, {
        headers: deadlineHeaders,
        data: {
          email: `deadline-peer-${crypto.randomUUID()}@example.test`,
          password: data.password,
          email_confirm: true,
        },
      });
      expect(response.ok()).toBeTruthy();
      peerId = (await response.json()).id;
      const peerRevision = crypto.randomUUID();
      await provide({ admin, peerId, peerRevision });
    } finally {
      if (peerId) {
        expect(
          (
            await admin.delete(
              `${serviceUrl}/rest/v1/submissions?student_id=eq.${peerId}`,
              { headers: deadlineHeaders },
            )
          ).ok(),
        ).toBeTruthy();
        expect(
          (
            await admin.delete(`${serviceUrl}/auth/v1/admin/users/${peerId}`, {
              headers: deadlineHeaders,
            })
          ).ok(),
        ).toBeTruthy();
      }
      await admin.dispose();
    }
  },
});

export async function setDeadline(
  page: Page,
  data: {
    courseId: string;
    users: Array<{ email: string }>;
    password: string;
  },
  assignmentId: string,
  value: string,
) {
  await revisionSession(page, data.users[0].email, data.password);
  await page.goto(
    coursePath(data.courseId, `/assignments/${assignmentId}/edit`),
  );
  await page.getByLabel(dueLabel, { exact: true }).fill(value);
  const response = page.waitForResponse(
    (result) =>
      result.url().endsWith(`/api/assignments/${assignmentId}`) &&
      result.request().method() === 'PATCH',
  );
  await page
    .getByRole('button', { name: 'Save assignment', exact: true })
    .click();
  expect((await response).status()).toBe(200);
  await expect(page).toHaveURL(coursePath(data.courseId, '/assignments'));
}

export async function saveRevision(
  page: Page,
  courseId: string,
  assignmentId: string,
  index: number,
) {
  await page.goto(coursePath(courseId, `/assignments/${assignmentId}`));
  await page
    .getByLabel(`${index ? 'Java' : 'Python'} source code`, { exact: true })
    .fill(sources[index]);
  const response = page.waitForResponse(
    (result) =>
      result.url().endsWith('/api/submissions') &&
      result.request().method() === 'POST',
  );
  await page
    .getByRole('button', { name: 'Submit revision', exact: true })
    .click();
  const saved = await response;
  expect(saved.status()).toBe(201);
  return {
    submission: (await saved.json()).submission,
    payload: saved.request().postDataJSON(),
  };
}
