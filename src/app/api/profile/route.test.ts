import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  from: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
  select: vi.fn(),
  single: vi.fn(),
}));
vi.mock('@/lib/auth/verified-user', () => ({
  getVerifiedUserRole: mocks.auth,
}));
import { PATCH } from './route';

const id = 'f0380000-0000-4000-8000-000000000001';
function request(
  body: unknown = { username: ' New name ' },
  origin = 'http://localhost:3000',
) {
  return new Request('http://localhost:3000/api/profile', {
    method: 'PATCH',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
beforeEach(() => {
  vi.stubEnv('APP_SITE_URL', 'http://localhost:3000');
  vi.clearAllMocks();
  mocks.from.mockReturnValue({ update: mocks.update });
  mocks.update.mockReturnValue({ eq: mocks.eq });
  mocks.eq.mockReturnValue({ select: mocks.select });
  mocks.select.mockReturnValue({ maybeSingle: mocks.single });
  mocks.single.mockResolvedValue({
    data: { display_name: 'New name' },
    error: null,
  });
  mocks.auth.mockResolvedValue({
    user: { id },
    role: 'student',
    supabase: { from: mocks.from },
  });
});
describe('own profile PATCH', () => {
  it('checks origin before identity/data access', async () => {
    expect((await PATCH(request({}, 'https://foreign.example'))).status).toBe(
      403,
    );
    expect(mocks.auth).not.toHaveBeenCalled();
  });
  it.each(['student', 'instructor'])(
    'uses verified identity for %s and updates only username',
    async (role) => {
      mocks.auth.mockResolvedValue({
        user: { id },
        role,
        supabase: { from: mocks.from },
      });
      const response = await PATCH(request());
      expect(response.status).toBe(200);
      expect(response.headers.get('cache-control')).toBe('private, no-store');
      expect(mocks.from).toHaveBeenCalledWith('profiles');
      expect(mocks.update).toHaveBeenCalledWith({ display_name: 'New name' });
      expect(mocks.eq).toHaveBeenCalledWith('id', id);
      expect(mocks.select).toHaveBeenCalledWith('display_name');
      expect(await response.json()).toEqual({
        profile: { username: 'New name' },
      });
    },
  );
  it.each([null, 'unprovisioned'])(
    'rejects missing membership (%s)',
    async (membership) => {
      mocks.auth.mockResolvedValue({
        user: membership ? { id } : null,
        role: null,
        supabase: membership ? { from: mocks.from } : null,
      });
      expect((await PATCH(request())).status).toBe(membership ? 403 : 401);
      expect(mocks.update).not.toHaveBeenCalled();
    },
  );
  it.each([
    { username: 'Name', id },
    { username: 'Name', role: 'instructor' },
    { username: 'Name', email: 'other@example.test' },
    { username: ' ' },
  ])('rejects invalid or forged fields (%#)', async (body) => {
    expect((await PATCH(request(body))).status).toBe(400);
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it('rejects oversized JSON without writing', async () => {
    expect((await PATCH(request({ username: 'x'.repeat(1025) }))).status).toBe(
      413,
    );
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it('does not claim success for a missing profile', async () => {
    mocks.single.mockResolvedValue({ data: null, error: null });
    expect((await PATCH(request())).status).toBe(404);
  });
  it('sanitizes database and verification failures', async () => {
    mocks.single.mockResolvedValue({
      data: null,
      error: { message: 'PRIVATE_PROVIDER_DETAIL' },
    });
    const response = await PATCH(request());
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('PRIVATE_PROVIDER_DETAIL');
    mocks.auth.mockRejectedValueOnce(new Error('PRIVATE_AUTH_DETAIL'));
    expect((await PATCH(request())).status).toBe(503);
  });
});
