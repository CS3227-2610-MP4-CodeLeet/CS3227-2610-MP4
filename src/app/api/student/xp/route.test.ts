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
vi.mock('@/features/assignment-xp/queries.server', () => ({
  loadOwnXp: mock.load,
}));
vi.mock('@/lib/courses/access', () => ({ readCourseAccess: mock.access }));
import { GET } from './route';
const courseId = 'f0300000-0000-4000-8000-000000000020';
const xpUrl = `http://localhost/api/student/xp?courseId=${courseId}`;
beforeEach(() => {
  vi.clearAllMocks();
  mock.access.mockResolvedValue({
    role: 'student',
    lifecycle: 'active',
    featureEnabled: true,
  });
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
  expect((await GET(new NextRequest(`${xpUrl}&studentId=peer`))).status).toBe(
    400,
  );
  expect(mock.load).not.toHaveBeenCalled();
});
it('requires a provisioned account before checking course enrollment', async () => {
  mock.identity.mockResolvedValueOnce({
    user: { id: 'unprovisioned' },
    role: null,
    supabase: {},
  });
  expect((await GET(new NextRequest(xpUrl))).status).toBe(403);
  expect(mock.access).not.toHaveBeenCalled();
});
it('rejects wrong course roles and invalid or duplicate pages', async () => {
  mock.access.mockResolvedValueOnce({
    role: 'instructor',
    lifecycle: 'active',
    featureEnabled: true,
  });
  mock.identity.mockResolvedValueOnce({
    user: { id: 'owner' },
    role: 'instructor',
    supabase: {},
  });
  expect((await GET(new NextRequest(xpUrl))).status).toBe(404);
  for (const query of [
    `courseId=${courseId}&page=0`,
    `courseId=${courseId}&page=1&page=2`,
  ])
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
it('hides courses without membership or enabled XP', async () => {
  mock.access.mockResolvedValueOnce(null);
  expect((await GET(new NextRequest(xpUrl))).status).toBe(404);
  mock.access.mockResolvedValueOnce({
    role: 'student',
    lifecycle: 'active',
    featureEnabled: false,
  });
  expect((await GET(new NextRequest(xpUrl))).status).toBe(404);
  expect(mock.load).not.toHaveBeenCalled();
});
