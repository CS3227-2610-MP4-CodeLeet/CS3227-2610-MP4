import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mock = vi.hoisted(() => ({ identity: vi.fn(), load: vi.fn() }));
vi.mock('@/lib/auth/verified-user', () => ({
  getVerifiedUserRole: mock.identity,
}));
vi.mock('@/features/assignment-xp/queries.server', () => ({
  loadOwnXp: mock.load,
}));
import { GET } from './route';
const xpUrl = 'http://localhost/api/student/xp';
beforeEach(() => {
  vi.clearAllMocks();
  mock.identity.mockResolvedValue({
    user: { id: 'student' },
    role: 'student',
    supabase: {},
  });
  mock.load.mockResolvedValue({
    total_xp: '0',
    page: 1,
    has_more: false,
    awards: [],
  });
});
it('requires student identity and never accepts a client-selected student', async () => {
  mock.identity.mockResolvedValueOnce({
    user: null,
    role: null,
    supabase: null,
  });
  expect((await GET(new NextRequest(xpUrl))).status).toBe(401);
  expect(
    (
      await GET(
        new NextRequest('http://localhost/api/student/xp?studentId=peer'),
      )
    ).status,
  ).toBe(400);
  expect(mock.load).not.toHaveBeenCalled();
});
it('rejects wrong roles and invalid or duplicate pages', async () => {
  mock.identity.mockResolvedValueOnce({
    user: { id: 'owner' },
    role: 'instructor',
    supabase: {},
  });
  expect((await GET(new NextRequest(xpUrl))).status).toBe(403);
  for (const query of ['page=0', 'page=1&page=2'])
    expect(
      (await GET(new NextRequest(`http://localhost/api/student/xp?${query}`)))
        .status,
    ).toBe(400);
});
it('returns private source-free data and distinguishes failure from zero', async () => {
  const response = await GET(new NextRequest(xpUrl));
  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toBe('private, no-store');
  mock.load.mockResolvedValueOnce(null);
  expect((await GET(new NextRequest(xpUrl))).status).toBe(503);
});
