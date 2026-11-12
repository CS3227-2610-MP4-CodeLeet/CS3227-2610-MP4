import { beforeEach, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({
  identity: vi.fn(),
  load: vi.fn(),
  rpc: vi.fn(),
  from: vi.fn(),
  courseRole: 'instructor' as string | null,
}));
vi.mock('@/lib/auth/verified-user', () => ({
  getVerifiedUserRole: mock.identity,
}));
vi.mock('./queries.server', () => ({
  loadPublicCases: mock.load,
  loadOwnerCases: mock.load,
}));
import { readCases } from './routes';
const id = 'b2000000-0000-4000-8000-000000000001';
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('APP_SITE_URL', 'http://localhost:3000');
  mock.courseRole = 'instructor';
  mock.from.mockImplementation((table: string) => {
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      maybeSingle: vi.fn(async () => {
        if (table === 'assignments') return { data: { course_id: 'course-1' } };
        if (table === 'course_memberships')
          return { data: mock.courseRole ? { role: mock.courseRole } : null };
        if (table === 'courses') return { data: { lifecycle: 'active' } };
        if (table === 'course_features') return { data: { enabled: true } };
        return { data: null };
      }),
    };
    return query;
  });
  mock.identity.mockResolvedValue({
    user: { id: 'owner' },
    role: 'instructor',
    supabase: { rpc: mock.rpc, from: mock.from },
  });
  mock.load.mockResolvedValue({ version: 0, cases: [] });
  mock.rpc.mockResolvedValue({
    data: { version: 1, published_revision: 0 },
    error: null,
  });
});
it('requires a student for the public projection and returns unavailable as 404', async () => {
  expect((await readCases(id, 'student')).status).toBe(404);
  mock.courseRole = 'student';
  mock.identity.mockResolvedValue({
    user: { id: 's' },
    role: 'student',
    supabase: { rpc: mock.rpc, from: mock.from },
  });
  mock.load.mockResolvedValueOnce(null);
  expect((await readCases(id, 'student')).status).toBe(404);
});
it('distinguishes load failure from an empty set', async () => {
  mock.load.mockRejectedValueOnce(new Error('private data'));
  const response = await readCases(id, 'instructor');
  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain('private data');
});
