import { expect, type APIRequestContext } from '@playwright/test';
import { test as base } from './draft-fixtures';

const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const comparisonHeaders = {
  apikey: process.env.MP4_E2E_SERVICE_ROLE_KEY!,
  authorization: `Bearer ${process.env.MP4_E2E_SERVICE_ROLE_KEY!}`,
};
export const comparisonSources = [
  [
    'value = 1\nprint(value)\n# <img src=x onerror=alert(1)>\n',
    'value = 2\nprint(value)\n# <img src=x onerror=alert(1)>\n',
  ],
  [
    'public class Main {\n  public static void main(String[] args) {\n    System.out.println(1);\n  }\n}\n',
    'public class Main {\n  public static void main(String[] args) {\n    System.out.println(2);\n  }\n}\n',
  ],
];
type ComparisonFixture = {
  ids: string[][];
  peerId: string;
  peerRevision: string;
  admin: APIRequestContext;
};

export const test = base.extend<{ comparisonFixture: ComparisonFixture }>({
  comparisonFixture: async ({ draftFixture: data, playwright }, provide) => {
    const admin = await playwright.request.newContext();
    let peerId = '';
    try {
      const response = await admin.post(`${serviceUrl}/auth/v1/admin/users`, {
        headers: comparisonHeaders,
        data: {
          email: `compare-peer-${crypto.randomUUID()}@example.test`,
          password: data.password,
          email_confirm: true,
        },
      });
      expect(response.ok()).toBeTruthy();
      peerId = (await response.json()).id;
      const membership = await admin.post(
        `${serviceUrl}/rest/v1/course_memberships`,
        {
          headers: comparisonHeaders,
          data: {
            course_id: data.courseId,
            user_id: peerId,
            role: 'student',
          },
        },
      );
      expect(membership.ok()).toBeTruthy();
      const ids = comparisonSources.map(() =>
        Array.from({ length: 3 }, () => crypto.randomUUID()),
      );
      const peerRevision = crypto.randomUUID();
      await seedRevisions(admin, {
        ids,
        peerId,
        peerRevision,
        assignments: data.assignments,
        studentId: data.users[1].id,
      });
      await provide({ ids, peerId, peerRevision, admin });
    } finally {
      if (peerId) {
        expect(
          (
            await admin.delete(
              `${serviceUrl}/rest/v1/submissions?student_id=eq.${peerId}`,
              { headers: comparisonHeaders },
            )
          ).ok(),
        ).toBeTruthy();
        expect(
          (
            await admin.delete(`${serviceUrl}/auth/v1/admin/users/${peerId}`, {
              headers: comparisonHeaders,
            })
          ).ok(),
        ).toBeTruthy();
      }
      await admin.dispose();
    }
  },
});

async function seedRevisions(
  admin: APIRequestContext,
  data: {
    ids: string[][];
    peerId: string;
    peerRevision: string;
    assignments: string[];
    studentId: string;
  },
) {
  const rows = data.ids.flatMap((ids, index) =>
    ids.map((id, offset) => ({
      id,
      assignment_id: data.assignments[index],
      student_id: data.studentId,
      language: index ? 'java' : 'python',
      revision: offset + 1,
      source: comparisonSources[index][offset ? 1 : 0],
      request_id: crypto.randomUUID(),
    })),
  );
  rows.push({
    ...rows[0],
    id: data.peerRevision,
    student_id: data.peerId,
    source: 'print("private peer code")',
    request_id: crypto.randomUUID(),
  });
  const response = await admin.post(`${serviceUrl}/rest/v1/submissions`, {
    headers: comparisonHeaders,
    data: rows,
  });
  expect(response.ok()).toBeTruthy();
}
