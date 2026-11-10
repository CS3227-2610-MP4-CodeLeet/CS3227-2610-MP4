import { expect, type APIRequestContext } from '@playwright/test';
import { test as workspaceTest } from './course-workspace-fixtures';

type AdminUser = { email: string; password: string };

const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.MP4_E2E_SERVICE_ROLE_KEY;

async function createAdminUser(
  admin: APIRequestContext,
  password: string,
): Promise<AdminUser & { id: string }> {
  if (!serviceUrl || !serviceKey) {
    throw new Error(
      'Responsive UI fixtures require local Supabase credentials.',
    );
  }

  const email = `responsive-admin-${crypto.randomUUID()}@example.test`;
  const created = await admin.post(`${serviceUrl}/auth/v1/admin/users`, {
    data: {
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: `Responsive test admin ${crypto.randomUUID().slice(0, 8)}`,
      },
    },
  });
  expect(
    created.ok(),
    `Local admin fixture user creation failed (${created.status()}): ${await created.text()}`,
  ).toBeTruthy();
  const user = (await created.json()) as { id: string };

  const updated = await admin.patch(
    `${serviceUrl}/rest/v1/user_roles?user_id=eq.${user.id}`,
    { data: { role: 'admin' } },
  );
  expect(updated.ok()).toBeTruthy();
  return { id: user.id, email, password };
}

export const test = workspaceTest.extend<{
  responsiveAdminFixture: AdminUser;
}>({
  responsiveAdminFixture: async ({ playwright }, provide) => {
    const admin = await playwright.request.newContext({
      extraHTTPHeaders: {
        apikey: serviceKey ?? '',
        authorization: `Bearer ${serviceKey ?? ''}`,
      },
    });
    const password = `Local-${crypto.randomUUID()}!`;
    let user: (AdminUser & { id: string }) | undefined;
    try {
      user = await createAdminUser(admin, password);
      await provide(user);
    } finally {
      if (user && serviceUrl && serviceKey) {
        const removed = await admin.delete(
          `${serviceUrl}/auth/v1/admin/users/${user.id}`,
        );
        expect(removed.ok()).toBeTruthy();
      }
      await admin.dispose();
    }
  },
});

test.skip(
  !serviceKey || !/^http:\/\/(localhost|127\.0\.0\.1):/.test(serviceUrl ?? ''),
  'Requires explicit local Supabase fixture credentials.',
);
