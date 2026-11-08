import { expect, test as base, type APIRequestContext } from '@playwright/test';

type ProfileUser = { id: string; email: string; role: string };
export type ProfileFixture = {
  users: ProfileUser[];
  password: string;
  admin: APIRequestContext;
};
export const profileServiceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const test = base.extend<{ profileFixture: ProfileFixture }>({
  profileFixture: [
    async ({ playwright }, provide) => {
      const key = process.env.MP4_E2E_SERVICE_ROLE_KEY!;
      const admin = await playwright.request.newContext({
        extraHTTPHeaders: { apikey: key, authorization: `Bearer ${key}` },
      });
      const users: ProfileUser[] = [];
      const password = `Local-${crypto.randomUUID()}!`;
      try {
        for (const role of ['student', 'instructor', 'unprovisioned']) {
          const email = `profile-${role}-${crypto.randomUUID()}@example.test`;
          const result = await admin.post(
            `${profileServiceUrl}/auth/v1/admin/users`,
            {
              data: {
                email,
                password,
                email_confirm: true,
                user_metadata: { display_name: `Profile ${role}` },
              },
            },
          );
          expect(result.ok()).toBeTruthy();
          users.push({ id: (await result.json()).id, email, role });
        }
        expect(
          (
            await admin.patch(
              `${profileServiceUrl}/rest/v1/user_roles?user_id=eq.${users[1].id}`,
              { data: { role: 'instructor' } },
            )
          ).ok(),
        ).toBeTruthy();
        expect(
          (
            await admin.delete(
              `${profileServiceUrl}/rest/v1/user_roles?user_id=eq.${users[2].id}`,
            )
          ).ok(),
        ).toBeTruthy();
        await provide({ users, password, admin });
      } finally {
        for (const user of users)
          expect(
            (
              await admin.delete(
                `${profileServiceUrl}/auth/v1/admin/users/${user.id}`,
              )
            ).ok(),
          ).toBeTruthy();
        await admin.dispose();
      }
    },
    { timeout: 120000 },
  ],
});
