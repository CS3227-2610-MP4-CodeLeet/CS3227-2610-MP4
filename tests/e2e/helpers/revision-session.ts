import { createServerClient } from '@supabase/ssr';
import { expect, type Page } from '@playwright/test';

// Authenticate this synthetic test context; account UI has separate coverage.
export async function revisionSession(
  page: Page,
  email: string,
  password: string,
) {
  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: async (cookies) => {
          await page.context().addCookies(
            cookies.map(({ name, value }) => ({
              name,
              value,
              url: process.env.ACCOUNT_TEST_BASE_URL ?? 'http://127.0.0.1:3100',
              sameSite: 'Lax' as const,
            })),
          );
        },
      },
    },
  );
  const { error } = await client.auth.signInWithPassword({ email, password });
  expect(error).toBeNull();
}
