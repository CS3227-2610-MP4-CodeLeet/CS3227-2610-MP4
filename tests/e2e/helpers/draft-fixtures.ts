import { expect, test as base, type APIRequestContext } from '@playwright/test';

const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const headers = {
  apikey: process.env.MP4_E2E_SERVICE_ROLE_KEY!,
  authorization: `Bearer ${process.env.MP4_E2E_SERVICE_ROLE_KEY!}`,
};
type DraftFixture = {
  courseId: string;
  users: Array<{ id: string; email: string }>;
  assignments: string[];
  password: string;
};

export const test = base.extend<{ draftFixture: DraftFixture }>({
  draftFixture: async ({ playwright }, provide) => {
    const admin = await playwright.request.newContext();
    const data: DraftFixture = {
      courseId: crypto.randomUUID(),
      users: [],
      assignments: [],
      password: `Synthetic-${crypto.randomUUID()}!aA9`,
    };
    try {
      await createFixture(admin, data);
      await provide(data);
    } finally {
      await cleanFixture(admin, data);
      await admin.dispose();
    }
  },
});

export function coursePath(courseId: string, path: string) {
  const url = new URL(path, 'http://course.test');
  return `/courses/${courseId}${url.pathname}${url.search}${url.hash}`;
}

async function createFixture(admin: APIRequestContext, data: DraftFixture) {
  for (const role of ['owner', 'student']) {
    const email = `draft-${role}-${crypto.randomUUID()}@example.test`;
    const response = await admin.post(`${serviceUrl}/auth/v1/admin/users`, {
      headers,
      data: { email, password: data.password, email_confirm: true },
    });
    expect(response.ok()).toBeTruthy();
    data.users.push({ id: (await response.json()).id, email });
  }
  const role = await admin.patch(
    `${serviceUrl}/rest/v1/user_roles?user_id=eq.${data.users[0].id}`,
    { headers, data: { role: 'instructor' } },
  );
  expect(role.ok()).toBeTruthy();
  for (const [table, rows] of [
    [
      'courses',
      {
        id: data.courseId,
        owner_id: data.users[0].id,
        created_by: data.users[0].id,
        title: `Draft course ${data.courseId}`,
        description: 'Synthetic draft fixture.',
      },
    ],
    [
      'course_memberships',
      data.users.map((user, index) => ({
        course_id: data.courseId,
        user_id: user.id,
        role: index ? 'student' : 'instructor',
      })),
    ],
    [
      'course_features',
      ['assessments', 'ai', 'discussions', 'xp', 'leaderboard'].map(
        (feature) => ({ course_id: data.courseId, feature, enabled: true }),
      ),
    ],
  ] as const) {
    const response = await admin.post(`${serviceUrl}/rest/v1/${table}`, {
      headers,
      data: rows,
    });
    expect(response.ok(), `Synthetic fixture ${table}`).toBeTruthy();
  }
  for (const language of ['python', 'java']) {
    const id = crypto.randomUUID();
    data.assignments.push(id);
    const response = await admin.post(`${serviceUrl}/rest/v1/assignments`, {
      headers,
      data: {
        id,
        course_id: data.courseId,
        instructor_id: data.users[0].id,
        title: `Draft safeguard ${language} ${id}`,
        instructions: 'Synthetic unsaved-code fixture.',
        language,
        publication_status: 'published',
      },
    });
    expect(response.ok()).toBeTruthy();
  }
}

async function cleanFixture(admin: APIRequestContext, data: DraftFixture) {
  for (const id of data.assignments) {
    for (const [table, column] of [
      ['submissions', 'assignment_id'],
      ['assignments', 'id'],
    ]) {
      const response = await admin.delete(
        `${serviceUrl}/rest/v1/${table}?${column}=eq.${id}`,
        { headers },
      );
      expect(response.ok()).toBeTruthy();
    }
  }
  const course = await admin.delete(
    `${serviceUrl}/rest/v1/courses?id=eq.${data.courseId}`,
    { headers },
  );
  expect(course.ok()).toBeTruthy();
  for (const user of data.users) {
    const response = await admin.delete(
      `${serviceUrl}/auth/v1/admin/users/${user.id}`,
      { headers },
    );
    expect(response.ok()).toBeTruthy();
  }
}
