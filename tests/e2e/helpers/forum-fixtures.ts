import {
  expect,
  test as base,
  type APIRequestContext,
  type APIResponse,
} from '@playwright/test';

type ForumUser = { id: string; email: string; displayName: string };
export type ForumFixture = {
  users: ForumUser[];
  courseId: string;
  password: string;
  admin: APIRequestContext;
  write: (resource: string, data: unknown) => Promise<void>;
};
const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const headers = {
  apikey: process.env.MP4_E2E_SERVICE_ROLE_KEY!,
  authorization: `Bearer ${process.env.MP4_E2E_SERVICE_ROLE_KEY!}`,
};

export const test = base.extend<{ forumFixture: ForumFixture }>({
  forumFixture: [
    async ({ playwright }, provide) => {
      const admin = await playwright.request.newContext({
        extraHTTPHeaders: headers,
      });
      const users: ForumUser[] = [];
      let courseId = '';
      const password = `Local-${crypto.randomUUID()}!`;
      try {
        await createUsers(admin, password, users);
        await configureUserRoles(admin, users);
        courseId = await createCourse(admin, users);
        await createMemberships(admin, courseId, users);
        await enableForumFeatures(admin, courseId);
        await provide({
          users,
          courseId,
          password,
          admin,
          write: (resource, data) =>
            writeFixtureData(admin, courseId, resource, data),
        });
      } finally {
        await removeFixture(admin, courseId, users);
        await admin.dispose();
      }
    },
    { timeout: 120000 },
  ],
});

async function createUsers(
  admin: APIRequestContext,
  password: string,
  users: ForumUser[],
) {
  for (const label of ['Student', 'Instructor', 'Unprovisioned']) {
    const displayName = `Forum ${label} ${crypto.randomUUID().slice(0, 8)}`;
    const email = `forum-${label.toLowerCase()}-${crypto.randomUUID()}@example.test`;
    const result = await admin.post(`${serviceUrl}/auth/v1/admin/users`, {
      data: {
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name: displayName },
      },
    });
    await expectResponse(result, 'Synthetic forum account creation');
    users.push({ id: (await result.json()).id, email, displayName });
  }
}

async function configureUserRoles(
  admin: APIRequestContext,
  users: ForumUser[],
) {
  const instructor = await admin.patch(
    `${serviceUrl}/rest/v1/user_roles?user_id=eq.${users[1].id}`,
    { data: { role: 'instructor' } },
  );
  await expectResponse(instructor, 'Synthetic instructor role');
  const unprovisioned = await admin.delete(
    `${serviceUrl}/rest/v1/user_roles?user_id=eq.${users[2].id}`,
  );
  await expectResponse(unprovisioned, 'Synthetic unprovisioned role');
}

async function createCourse(admin: APIRequestContext, users: ForumUser[]) {
  const response = await admin.post(`${serviceUrl}/rest/v1/courses`, {
    headers: { Prefer: 'return=representation' },
    data: {
      owner_id: users[1].id,
      created_by: users[1].id,
      title: `Forum course ${crypto.randomUUID()}`,
      description: 'Synthetic forum fixture.',
    },
  });
  await expectResponse(response, 'Synthetic forum course');
  return (await response.json())[0].id as string;
}

async function createMemberships(
  admin: APIRequestContext,
  courseId: string,
  users: ForumUser[],
) {
  const response = await admin.post(
    `${serviceUrl}/rest/v1/course_memberships`,
    {
      data: [
        { course_id: courseId, user_id: users[0].id, role: 'student' },
        { course_id: courseId, user_id: users[1].id, role: 'instructor' },
      ],
    },
  );
  await expectResponse(response, 'Synthetic forum memberships');
}

async function enableForumFeatures(admin: APIRequestContext, courseId: string) {
  const response = await admin.post(`${serviceUrl}/rest/v1/course_features`, {
    data: ['assessments', 'discussions', 'ai'].map((feature) => ({
      course_id: courseId,
      feature,
      enabled: true,
    })),
  });
  await expectResponse(response, 'Synthetic forum features');
}

async function writeFixtureData(
  admin: APIRequestContext,
  courseId: string,
  resource: string,
  data: unknown,
) {
  const payload = withCourseId(resource, courseId, data);
  const response = await admin.post(`${serviceUrl}/rest/v1/${resource}`, {
    headers,
    data: payload,
  });
  await expectResponse(response, `Synthetic ${resource} records`);
}

function withCourseId(resource: string, courseId: string, data: unknown) {
  if (resource !== 'forum_threads') return data;
  const row = (value: unknown) => ({
    ...(value as Record<string, unknown>),
    course_id: courseId,
  });
  return Array.isArray(data) ? data.map(row) : row(data);
}

async function removeFixture(
  admin: APIRequestContext,
  courseId: string,
  users: ForumUser[],
) {
  if (courseId) await removeCourseData(admin, courseId, users);
  for (const user of users) {
    const response = await admin.delete(
      `${serviceUrl}/auth/v1/admin/users/${user.id}`,
    );
    await expectResponse(response, 'Synthetic forum account cleanup');
  }
}

async function removeCourseData(
  admin: APIRequestContext,
  courseId: string,
  users: ForumUser[],
) {
  const userIds = users.map(({ id }) => id).join(',');
  const replies = await admin.delete(
    `${serviceUrl}/rest/v1/forum_replies?author_id=in.(${userIds})`,
  );
  await expectResponse(replies, 'Synthetic forum reply cleanup');
  const threads = await admin.delete(
    `${serviceUrl}/rest/v1/forum_threads?course_id=eq.${courseId}`,
  );
  await expectResponse(threads, 'Synthetic forum thread cleanup');
  const course = await admin.delete(
    `${serviceUrl}/rest/v1/courses?id=eq.${courseId}`,
    { headers },
  );
  await expectResponse(course, 'Synthetic forum course cleanup');
}

async function expectResponse(response: APIResponse, description: string) {
  expect(
    response.ok(),
    `${description} failed (${response.status()}): ${await response.text()}`,
  ).toBeTruthy();
}
