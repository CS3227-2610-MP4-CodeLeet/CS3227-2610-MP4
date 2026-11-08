import { expect, test as base, type APIRequestContext } from '@playwright/test';

type ForumUser = { id: string; email: string };
export type ForumFixture = {
  users: ForumUser[];
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
      const password = `Local-${crypto.randomUUID()}!`;
      try {
        for (const label of ['Student', 'Instructor', 'Unprovisioned']) {
          const email = `forum-${label.toLowerCase()}-${crypto.randomUUID()}@example.test`;
          const result = await admin.post(`${serviceUrl}/auth/v1/admin/users`, {
            data: {
              email,
              password,
              email_confirm: true,
              user_metadata: { display_name: `Forum ${label}` },
            },
          });
          expect(result.ok()).toBeTruthy();
          users.push({ id: (await result.json()).id, email });
        }
        expect(
          (
            await admin.patch(
              `${serviceUrl}/rest/v1/user_roles?user_id=eq.${users[1].id}`,
              { data: { role: 'instructor' } },
            )
          ).ok(),
        ).toBeTruthy();
        expect(
          (
            await admin.delete(
              `${serviceUrl}/rest/v1/user_roles?user_id=eq.${users[2].id}`,
            )
          ).ok(),
        ).toBeTruthy();
        const write = async (resource: string, data: unknown) => {
          expect(
            (
              await admin.post(`${serviceUrl}/rest/v1/${resource}`, { data })
            ).ok(),
          ).toBeTruthy();
        };
        await provide({ users, password, admin, write });
      } finally {
        for (const user of users) {
          expect(
            (
              await admin.delete(`${serviceUrl}/auth/v1/admin/users/${user.id}`)
            ).ok(),
          ).toBeTruthy();
        }
        await admin.dispose();
      }
    },
    { timeout: 120000 },
  ],
});
