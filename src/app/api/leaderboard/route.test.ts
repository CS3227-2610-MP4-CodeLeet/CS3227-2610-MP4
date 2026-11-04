import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mock = vi.hoisted(() => ({
  identity: vi.fn(),
  load: vi.fn(),
  access: vi.fn(),
}));
vi.mock('@/lib/auth/verified-user', () => ({
  getVerifiedUserRole: mock.identity,
}));
vi.mock('@/features/leaderboard/queries.server', () => ({
  loadLeaderboard: mock.load,
}));
vi.mock('@/lib/courses/access', () => ({ readCourseAccess: mock.access }));
import { GET } from './route';
const courseId = 'f0300000-0000-4000-8000-000000000020';
const url = `http://localhost/api/leaderboard?courseId=${courseId}`;
beforeEach(() => {
  vi.clearAllMocks();
  mock.access.mockResolvedValue({
    role: 'student',
    lifecycle: 'active',
    featureEnabled: true,
  });
  mock.identity.mockResolvedValue({
    user: { id: 'member' },
    role: 'student',
    supabase: {},
  });
  mock.load.mockResolvedValue({
    page: 1,
    has_more: false,
    rows: [],
    own: { rank: null, total_xp: '0' },
  });
});
it('denies signed-out and unprovisioned identities', async () => {
  mock.identity.mockResolvedValueOnce({
    user: null,
    role: null,
    supabase: null,
  });
  expect((await GET(new NextRequest(url))).status).toBe(401);
  mock.identity.mockResolvedValueOnce({
    user: { id: 'unprovisioned' },
    role: null,
    supabase: {},
  });
  expect((await GET(new NextRequest(url))).status).toBe(403);
  expect(mock.load).not.toHaveBeenCalled();
});
it('rejects duplicate pages and forged identity, XP or rank parameters', async () => {
  for (const query of [
    '',
    'page=0',
    'page=1&page=2',
    'studentId=peer',
    'xp=999',
    'rank=1',
    'page=10001',
  ])
    expect((await GET(new NextRequest(`${url}?${query}`))).status).toBe(400);
  expect(mock.load).not.toHaveBeenCalled();
});
it('allows course students and instructors and uses private no-store results', async () => {
  for (const role of ['student', 'instructor']) {
    mock.access.mockResolvedValueOnce({
      role,
      lifecycle: 'active',
      featureEnabled: true,
    });
    mock.identity.mockResolvedValueOnce({
      user: { id: 'member' },
      role,
      supabase: {},
    });
    const response = await GET(new NextRequest(url));
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  }
});
it('service failure is distinct from zero or an empty board', async () => {
  mock.load.mockResolvedValueOnce(null);
  expect((await GET(new NextRequest(url))).status).toBe(503);
});
it('hides courses without membership or an enabled feature', async () => {
  mock.access.mockResolvedValueOnce(null);
  expect((await GET(new NextRequest(url))).status).toBe(404);
  mock.access.mockResolvedValueOnce({
    role: 'student',
    lifecycle: 'active',
    featureEnabled: false,
  });
  expect((await GET(new NextRequest(url))).status).toBe(404);
  expect(mock.load).not.toHaveBeenCalled();
});
