import { expect } from '@playwright/test';
import { hideFixtureAssignment } from './history-fixtures';

export type FilterFixture = Parameters<typeof hideFixtureAssignment>[0];
export const literalFilterTitle = 'Filter 100% _ * [x] (a|b) \\ Résumé';

export async function addFilterRevisions(data: FilterFixture) {
  const rows = [26, 27].map((revision) => ({
    ...data.rows[0],
    id: crypto.randomUUID(),
    request_id: crypto.randomUUID(),
    revision,
  }));
  const response = await data.admin.post(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/submissions`,
    { headers: adminHeaders(), data: rows },
  );
  expect(response.ok()).toBeTruthy();
  data.rows.push(...rows);
}

export async function renameFilterAssignment(data: FilterFixture) {
  const response = await data.admin.patch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/assignments?id=eq.${data.assignments[0]}`,
    { headers: adminHeaders(), data: { title: literalFilterTitle } },
  );
  expect(response.ok()).toBeTruthy();
}

function adminHeaders() {
  return {
    apikey: process.env.MP4_E2E_SERVICE_ROLE_KEY!,
    authorization: `Bearer ${process.env.MP4_E2E_SERVICE_ROLE_KEY!}`,
  };
}
