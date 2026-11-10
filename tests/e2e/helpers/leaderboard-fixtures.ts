import { expect } from '@playwright/test';
import { test as base, serviceUrl, headers } from './xp-fixtures';
export const test = base.extend<{
  leaderboardFixture: {
    names: string[];
    thirdId: string;
    thirdRevision: string;
  };
}>({
  leaderboardFixture: async (
    { draftFixture, comparisonFixture, xpCriteria },
    provide,
  ) => {
    const prefix = `Ranks ${crypto.randomUUID().slice(0, 8)}`;
    const names = [
      `${prefix} Alpha`,
      `${prefix} Beta`,
      `${prefix} <img src=x onerror=alert(1)>`,
    ];
    const created = await comparisonFixture.admin.post(
      `${serviceUrl}/auth/v1/admin/users`,
      {
        headers,
        data: {
          email: `rank-third-${crypto.randomUUID()}@example.test`,
          password: draftFixture.password,
          email_confirm: true,
        },
      },
    );
    expect(created.ok()).toBeTruthy();
    const third = await created.json();
    const thirdId = third.id;
    draftFixture.users.push({ id: thirdId, email: third.email });
    const membership = await comparisonFixture.admin.post(
      `${serviceUrl}/rest/v1/course_memberships`,
      {
        headers,
        data: {
          course_id: draftFixture.courseId,
          user_id: thirdId,
          role: 'student',
        },
      },
    );
    expect(membership.ok()).toBeTruthy();
    for (const [index, id] of [
      draftFixture.users[1].id,
      comparisonFixture.peerId,
      thirdId,
    ].entries()) {
      const response = await comparisonFixture.admin.patch(
        `${serviceUrl}/rest/v1/profiles?id=eq.${id}`,
        { headers, data: { display_name: names[index] } },
      );
      expect(response.ok()).toBeTruthy();
    }
    const thirdRevision = crypto.randomUUID();
    const source = await comparisonFixture.admin.post(
      `${serviceUrl}/rest/v1/submissions`,
      {
        headers,
        data: {
          id: thirdRevision,
          assignment_id: draftFixture.assignments[0],
          student_id: thirdId,
          source: 'print(1)',
          revision: 1,
          request_id: crypto.randomUUID(),
        },
      },
    );
    expect(source.ok()).toBeTruthy();
    expect(xpCriteria).toHaveLength(2);
    await provide({ names, thirdId, thirdRevision });
  },
});
