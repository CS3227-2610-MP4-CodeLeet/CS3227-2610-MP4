import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  single: vi.fn(),
}));
vi.mock('@/lib/auth/verified-user', () => ({
  getVerifiedUserRole: mocks.auth,
}));
vi.mock('next/navigation', () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
}));
import { loadProfileSettings } from './profile.server';

const id = 'f0380000-0000-4000-8000-000000000001';
beforeEach(() => {
  vi.clearAllMocks();
  mocks.from.mockReturnValue({ select: mocks.select });
  mocks.select.mockReturnValue({ eq: mocks.eq });
  mocks.eq.mockReturnValue({ maybeSingle: mocks.single });
  mocks.single.mockResolvedValue({
    data: { display_name: 'My username', login_username: 'my username' },
    error: null,
  });
  mocks.auth.mockResolvedValue({
    user: {
      id,
      email: 'verified@example.test',
      user_metadata: { role: 'instructor' },
    },
    role: 'student',
    supabase: { from: mocks.from },
  });
});
describe('own profile settings loader', () => {
  it('projects only own username and uses verified email/trusted role', async () => {
    expect(await loadProfileSettings()).toEqual({
      username: 'My username',
      usernameLoginEnabled: true,
      email: 'verified@example.test',
      role: 'student',
    });
    expect(mocks.from).toHaveBeenCalledWith('profiles');
    expect(mocks.eq).toHaveBeenCalledWith('id', id);
    expect(mocks.select).toHaveBeenCalledWith('display_name,login_username');
  });
  it('requires sign-in', async () => {
    mocks.auth.mockResolvedValue({ user: null, role: null, supabase: null });
    await expect(loadProfileSettings()).rejects.toThrow('redirect:/sign-in');
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('rejects unprovisioned accounts', async () => {
    mocks.auth.mockResolvedValue({ user: { id }, role: null, supabase: {} });
    await expect(loadProfileSettings()).rejects.toThrow(
      'redirect:/unauthorized',
    );
  });
  it.each([
    { data: null, error: null },
    { data: null, error: { message: 'PRIVATE_DETAIL' } },
  ])('does not invent unavailable profile data (%#)', async (result) => {
    mocks.single.mockResolvedValue(result);
    await expect(loadProfileSettings()).rejects.toThrow(
      'Profile is unavailable.',
    );
  });
});
