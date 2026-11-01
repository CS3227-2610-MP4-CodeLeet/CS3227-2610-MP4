import { expect, test as base, type APIRequestContext } from '@playwright/test';

const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const headers = {
  apikey: process.env.MP4_E2E_SERVICE_ROLE_KEY!,
  authorization: `Bearer ${process.env.MP4_E2E_SERVICE_ROLE_KEY!}`,
};
type DraftFixture = {
  users: Array<{ id: string; email: string }>;
  assignments: string[];
  password: string;
};

export const test = base.extend<{ draftFixture: DraftFixture }>({
  draftFixture: async ({ playwright }, provide) => {
    const admin = await playwright.request.newContext();
    const data: DraftFixture = {
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
  for (const language of ['python', 'java']) {
    const id = crypto.randomUUID();
    data.assignments.push(id);
    const response = await admin.post(`${serviceUrl}/rest/v1/assignments`, {
      headers,
      data: {
        id,
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
  for (const user of data.users) {
    const response = await admin.delete(
      `${serviceUrl}/auth/v1/admin/users/${user.id}`,
      { headers },
    );
    expect(response.ok()).toBeTruthy();
  }
}
