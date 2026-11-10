import { expect, type Page } from '@playwright/test';
import { test as base } from './comparison-fixtures';
import { comparisonHeaders as headers } from './comparison-fixtures';

export const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const appUrl =
  process.env.ACCOUNT_TEST_BASE_URL ?? 'http://127.0.0.1:3100';
export const maxXpLabel = 'Maximum XP';
export const test = base.extend<{ xpCriteria: string[] }>({
  xpCriteria: async ({ draftFixture, comparisonFixture }, provide) => {
    const ids = draftFixture.assignments.map(() => crypto.randomUUID());
    for (const [index, assignmentId] of draftFixture.assignments.entries()) {
      const response = await comparisonFixture.admin.post(
        `${serviceUrl}/rest/v1/assignment_rubrics`,
        {
          headers,
          data: {
            assignment_id: assignmentId,
            criteria: [criterion(ids[index])],
          },
        },
      );
      expect(response.ok()).toBeTruthy();
    }
    await provide(ids);
  },
});
export function criterion(id: string) {
  return {
    id,
    title: 'Correctness',
    description: 'Print the requested value.',
    maxScore: 10,
  };
}
export async function grade(
  page: Page,
  id: string,
  criterionId: string,
  {
    score,
    version,
    publish = true,
  }: { score: number; version: number; publish?: boolean },
) {
  return page.request.patch(`/api/grades/${id}`, {
    headers: { origin: appUrl },
    data: {
      scores: { [criterionId]: score },
      feedback: 'Synthetic XP check.',
      totalScore: score,
      publish,
      expectedVersion: version,
    },
  });
}
export async function configure(
  page: Page,
  courseId: string,
  id: string,
  maxXp: number,
) {
  await page.goto(`/courses/${courseId}/assignments/${id}/edit`);
  await page.getByLabel(maxXpLabel, { exact: true }).fill(String(maxXp));
  const pending = page.waitForResponse(
    (response) =>
      response.url().endsWith(`/api/assignments/${id}`) &&
      response.request().method() === 'PATCH',
  );
  await page
    .getByRole('button', { name: 'Save assignment', exact: true })
    .click();
  const response = await pending;
  expect(response.status()).toBe(200);
  await expect(page).toHaveURL(`/courses/${courseId}/assignments`);
  return {
    payload: response.request().postDataJSON(),
    assignment: (await response.json()).assignment,
  };
}
export { headers };
