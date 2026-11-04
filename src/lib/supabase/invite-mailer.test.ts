import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.createClient }));
import { createInviteAuthClient } from './invite-mailer';
beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54321');
  vi.stubEnv(
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'synthetic-publishable-key',
  );
  mocks.createClient.mockReset();
  mocks.createClient.mockReturnValue({ auth: { signInWithOtp: vi.fn() } });
});
describe('invite email auth client', () => {
  it('uses a stateless implicit handoff so the invitee can finish from their own browser', () => {
    const client = createInviteAuthClient();
    expect(client).toBeDefined();
    expect(mocks.createClient).toHaveBeenCalledWith(
      'http://127.0.0.1:54321',
      'synthetic-publishable-key',
      {
        auth: {
          flowType: 'implicit',
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      },
    );
  });
  it('fails closed when the Supabase public configuration is missing', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '');
    expect(() => createInviteAuthClient()).toThrow(
      'Supabase is not configured',
    );
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
});
