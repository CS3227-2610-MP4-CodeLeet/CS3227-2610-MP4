import { expect, test as base, type APIRequestContext } from '@playwright/test';

export const historyPassword = 'Synthetic-History-Password-482!';
const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const headers = {
  apikey: process.env.MP4_E2E_SERVICE_ROLE_KEY!,
  authorization: `Bearer ${process.env.MP4_E2E_SERVICE_ROLE_KEY!}`,
};
type User = { id: string; email: string };
type Row = {
  id: string;
  assignment_id: string;
  student_id: string;
  revision: number;
  source: string;
  request_id: string;
  created_at: string;
};
export type Fixture = {
  users: User[];
  courseId: string;
  assignments: string[];
  rows: Row[];
  peerRow: Row;
  title: string;
  admin: APIRequestContext;
};

export const test = base.extend<{ historyFixture: Fixture }>({
  historyFixture: [
    async ({ playwright }, provide) => {
      const admin = await playwright.request.newContext();
      const data = await createFixture(admin);
      try {
        await provide(data);
      } finally {
        await cleanFixture(data);
        await admin.dispose();
      }
    },
    { timeout: 120_000 },
  ],
});

async function createFixture(admin: APIRequestContext): Promise<Fixture> {
  const users = await createUsers(admin);
  const assignments = [crypto.randomUUID(), crypto.randomUUID()];
  const title = 'History <img src=x onerror=alert(1)>';
  const courseId = await createCourse(admin, users);
  const { rows, peerRow } = await seedHistory(admin, users, {
    courseId,
    assignments,
    title,
  });
  return { admin, users, courseId, assignments, rows, peerRow, title };
}

async function createUsers(admin: APIRequestContext): Promise<User[]> {
  const users: User[] = [];
  for (const role of ['owner', 'student', 'peer', 'empty']) {
    const email = `history-${role}-${crypto.randomUUID()}@example.test`;
    const response = await admin.post(`${serviceUrl}/auth/v1/admin/users`, {
      headers,
      data: { email, password: historyPassword, email_confirm: true },
    });
    expect(response.ok()).toBeTruthy();
    users.push({ id: (await response.json()).id, email });
  }
  await write(
    admin,
    'user_roles?user_id=eq.' + users[0].id,
    { role: 'instructor' },
    'patch',
  );
  return users;
}

async function createCourse(
  admin: APIRequestContext,
  users: User[],
): Promise<string> {
  const courseResponse = await admin.post(`${serviceUrl}/rest/v1/courses`, {
    headers: { ...headers, Prefer: 'return=representation' },
    data: {
      owner_id: users[0].id,
      created_by: users[0].id,
      title: `History course ${crypto.randomUUID()}`,
      description: 'Synthetic history fixture.',
    },
  });
  expect(courseResponse.ok()).toBeTruthy();
  const [{ id: courseId }] = await courseResponse.json();
  await write(
    admin,
    'course_memberships',
    users.map((user, index) => ({
      course_id: courseId,
      user_id: user.id,
      role: index === 0 ? 'instructor' : 'student',
    })),
  );
  await write(
    admin,
    'course_features',
    ['assessments', 'ai', 'discussions', 'xp', 'leaderboard'].map(
      (feature) => ({ course_id: courseId, feature, enabled: true }),
    ),
  );
  return courseId;
}

async function seedHistory(
  admin: APIRequestContext,
  users: User[],
  fixture: Pick<Fixture, 'courseId' | 'assignments' | 'title'>,
) {
  const { courseId, assignments, title } = fixture;
  await write(
    admin,
    'assignments',
    assignments.map((id, index) => ({
      id,
      course_id: courseId,
      instructor_id: users[0].id,
      title: index ? 'History Java' : title,
      instructions: 'Synthetic history fixture.',
      language: index ? 'java' : 'python',
      publication_status: 'published',
    })),
  );
  await write(
    admin,
    'assignment_rubrics',
    assignments.map((id) => ({
      assignment_id: id,
      criteria: [
        {
          id: crypto.randomUUID(),
          title: 'Private',
          description: 'HISTORY_RUBRIC_SECRET',
          maxScore: 10,
        },
      ],
    })),
  );
  const rows = Array.from({ length: 27 }, (_, index) =>
    row(
      assignments[index < 25 ? 0 : 1],
      users[1].id,
      index < 25 ? index + 1 : index - 24,
    ),
  );
  const peerRow = row(assignments[1], users[2].id, 1);
  await write(admin, 'submissions', [...rows, peerRow]);
  await write(admin, 'grades', [
    {
      submission_id: rows[0].id,
      instructor_id: users[0].id,
      scores: {},
      feedback: 'Visible published feedback',
      total_score: 8,
      published_at: '2026-10-30T00:00:00Z',
    },
    {
      submission_id: rows[1].id,
      instructor_id: users[0].id,
      scores: {},
      feedback: 'HISTORY_UNPUBLISHED_SECRET',
      total_score: 1,
      published_at: null,
    },
  ]);
  return { rows, peerRow };
}

function row(assignmentId: string, studentId: string, revision: number): Row {
  return {
    id: crypto.randomUUID(),
    assignment_id: assignmentId,
    student_id: studentId,
    revision,
    source: `HISTORY_SOURCE_SENTINEL ${revision}`,
    request_id: crypto.randomUUID(),
    created_at: '2026-10-30T00:00:00Z',
  };
}

async function write(
  admin: APIRequestContext,
  resource: string,
  data: unknown,
  method: 'post' | 'patch' = 'post',
) {
  const response = await admin[method](`${serviceUrl}/rest/v1/${resource}`, {
    headers,
    data,
  });
  expect(
    response.ok(),
    `Synthetic fixture ${resource.split('?')[0]}`,
  ).toBeTruthy();
}

async function cleanFixture(data: Fixture) {
  for (const id of data.assignments) {
    const submissions = await data.admin.delete(
      `${serviceUrl}/rest/v1/submissions?assignment_id=eq.${id}`,
      { headers },
    );
    expect(submissions.ok()).toBeTruthy();
    const assignment = await data.admin.delete(
      `${serviceUrl}/rest/v1/assignments?id=eq.${id}`,
      { headers },
    );
    expect(assignment.ok()).toBeTruthy();
  }
  const course = await data.admin.delete(
    `${serviceUrl}/rest/v1/courses?id=eq.${data.courseId}`,
    { headers },
  );
  expect(course.ok()).toBeTruthy();
  for (const user of data.users) {
    const response = await data.admin.delete(
      `${serviceUrl}/auth/v1/admin/users/${user.id}`,
      { headers },
    );
    expect(response.ok()).toBeTruthy();
  }
}

export function coursePath(data: Pick<Fixture, 'courseId'>, path: string) {
  const url = new URL(path, 'http://course.test');
  return `/courses/${data.courseId}${url.pathname}${url.search}${url.hash}`;
}

export async function hideFixtureAssignment(data: Fixture) {
  await write(
    data.admin,
    'assignments?id=eq.' + data.assignments[0],
    { publication_status: 'draft' },
    'patch',
  );
}
