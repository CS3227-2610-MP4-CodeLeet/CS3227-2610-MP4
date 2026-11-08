import { expect, test as base, type APIRequestContext } from '@playwright/test';

type User = { id: string; email: string };
export type CourseWorkspaceFixture = {
  student: User;
  password: string;
  studentCourseId: string;
  instructorCourseId: string;
  removeInstructorCourseMembership: () => Promise<void>;
};

const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.MP4_E2E_SERVICE_ROLE_KEY!;
const headers = {
  apikey: serviceKey,
  authorization: `Bearer ${serviceKey}`,
};

async function createUser(
  admin: APIRequestContext,
  label: string,
  password: string,
) {
  const response = await admin.post(`${serviceUrl}/auth/v1/admin/users`, {
    data: {
      email: `course-${label}-${crypto.randomUUID()}@example.test`,
      password,
      email_confirm: true,
      user_metadata: { display_name: `Course ${label}` },
    },
  });
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  return { id: data.id, email: data.email } satisfies User;
}

async function insert(admin: APIRequestContext, table: string, data: unknown) {
  const response = await admin.post(`${serviceUrl}/rest/v1/${table}`, {
    headers: { Prefer: 'return=representation' },
    data,
  });
  expect(response.ok()).toBeTruthy();
  return response.json();
}

async function createCourses(admin: APIRequestContext, ownerId: string) {
  const courses = await insert(admin, 'courses', [
    {
      owner_id: ownerId,
      created_by: ownerId,
      title: `Student course ${crypto.randomUUID()}`,
      description: 'Course workspace browser fixture',
    },
    {
      owner_id: ownerId,
      created_by: ownerId,
      title: `Instructor course ${crypto.randomUUID()}`,
      description: 'Course workspace browser fixture',
    },
  ]);
  return courses.map((course: { id: string }) => course.id) as string[];
}

async function addMemberships(
  admin: APIRequestContext,
  courseIds: string[],
  ownerId: string,
  studentId: string,
) {
  const response = await admin.post(
    `${serviceUrl}/rest/v1/course_memberships`,
    {
      data: [
        { course_id: courseIds[0], user_id: ownerId, role: 'instructor' },
        { course_id: courseIds[0], user_id: studentId, role: 'student' },
        { course_id: courseIds[1], user_id: ownerId, role: 'instructor' },
        { course_id: courseIds[1], user_id: studentId, role: 'instructor' },
      ],
    },
  );
  expect(response.ok()).toBeTruthy();
}

async function addFeatures(admin: APIRequestContext, courseIds: string[]) {
  const features = courseIds.flatMap((course_id) =>
    ['assessments', 'ai', 'discussions', 'xp', 'leaderboard'].map(
      (feature) => ({ course_id, feature, enabled: true }),
    ),
  );
  const response = await admin.post(`${serviceUrl}/rest/v1/course_features`, {
    data: features,
  });
  expect(response.ok()).toBeTruthy();
}

async function removeFixture(
  admin: APIRequestContext,
  courseIds: string[],
  users: User[],
) {
  if (courseIds.length)
    expect(
      (
        await admin.delete(
          `${serviceUrl}/rest/v1/courses?id=in.(${courseIds.join(',')})`,
        )
      ).ok(),
    ).toBeTruthy();
  for (const user of users)
    expect(
      (await admin.delete(`${serviceUrl}/auth/v1/admin/users/${user.id}`)).ok(),
    ).toBeTruthy();
}

async function createWorkspaceFixture(
  admin: APIRequestContext,
  password: string,
) {
  const users: User[] = [];
  const courseIds: string[] = [];
  try {
    const owner = await createUser(admin, 'owner', password);
    users.push(owner);
    const student = await createUser(admin, 'student', password);
    users.push(student);
    const roleUpdate = await admin.patch(
      `${serviceUrl}/rest/v1/user_roles?user_id=eq.${owner.id}`,
      { data: { role: 'instructor' } },
    );
    expect(roleUpdate.ok()).toBeTruthy();
    courseIds.push(...(await createCourses(admin, owner.id)));
    await addMemberships(admin, courseIds, owner.id, student.id);
    await addFeatures(admin, courseIds);
    return {
      fixture: {
        student,
        password,
        studentCourseId: courseIds[0],
        instructorCourseId: courseIds[1],
        removeInstructorCourseMembership: async () => {
          const response = await admin.delete(
            `${serviceUrl}/rest/v1/course_memberships?course_id=eq.${courseIds[1]}&user_id=eq.${student.id}`,
          );
          expect(response.ok()).toBeTruthy();
        },
      } satisfies CourseWorkspaceFixture,
      cleanup: () => removeFixture(admin, courseIds, users),
    };
  } catch (error) {
    await removeFixture(admin, courseIds, users);
    throw error;
  }
}

export const test = base.extend<{
  courseWorkspaceFixture: CourseWorkspaceFixture;
}>({
  courseWorkspaceFixture: [
    async ({ playwright }, provide) => {
      const admin = await playwright.request.newContext({
        extraHTTPHeaders: headers,
      });
      const password = `Local-${crypto.randomUUID()}!`;
      try {
        const setup = await createWorkspaceFixture(admin, password);
        try {
          await provide(setup.fixture);
        } finally {
          await setup.cleanup();
        }
      } finally {
        await admin.dispose();
      }
    },
    { timeout: 120_000 },
  ],
});
