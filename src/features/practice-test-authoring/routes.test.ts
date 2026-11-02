import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mock = vi.hoisted(() => ({
  identity: vi.fn(),
  load: vi.fn(),
  rpc: vi.fn(),
}));
vi.mock('@/lib/auth/verified-user', () => ({
  getVerifiedUserRole: mock.identity,
}));
vi.mock('./queries.server', () => ({
  loadPublicCases: mock.load,
  loadOwnerCases: mock.load,
}));
import { readCases, updateCases } from './routes';
const id = 'b2000000-0000-4000-8000-000000000001';
const req = (body: unknown, origin = 'http://localhost:3000') =>
  new NextRequest('http://localhost:3000/api/tests', {
    method: 'PATCH',
    headers: { origin, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('APP_SITE_URL', 'http://localhost:3000');
  mock.identity.mockResolvedValue({
    user: { id: 'owner' },
    role: 'instructor',
    supabase: { rpc: mock.rpc },
  });
  mock.load.mockResolvedValue({ version: 0, cases: [] });
  mock.rpc.mockResolvedValue({
    data: { version: 1, published_revision: 0 },
    error: null,
  });
});
it('accepts fully JSON-escaped valid case strings while bounding raw bodies', async () => {
  const cases = Array.from({ length: 5 }, () => ({
    id: crypto.randomUUID(),
    name: '😀'.repeat(120),
    stdin: '\u0001'.repeat(4096),
    expected_stdout: '\u0001'.repeat(8192),
  }));
  const request = req({ action: 'save', expectedVersion: 0, cases });
  expect(
    Number(new TextEncoder().encode(await request.clone().text()).length),
  ).toBeGreaterThan(370_000);
  expect((await updateCases(request, id)).status).toBe(200);
  expect(
    (await updateCases(req({ padding: 'x'.repeat(400_000) }), id)).status,
  ).toBe(400);
});
it('rejects cross-origin writes before identity or storage', async () => {
  expect((await updateCases(req({}, 'https://bad.example'), id)).status).toBe(
    403,
  );
  expect(mock.identity).not.toHaveBeenCalled();
});
it('rejects missing identity, students and invalid IDs', async () => {
  mock.identity.mockResolvedValueOnce({
    user: null,
    role: null,
    supabase: null,
  });
  expect((await updateCases(req({}), id)).status).toBe(401);
  mock.identity.mockResolvedValueOnce({
    user: { id: 's' },
    role: 'student',
    supabase: { rpc: mock.rpc },
  });
  expect((await updateCases(req({}), id)).status).toBe(403);
  expect((await updateCases(req({}), 'bad')).status).toBe(404);
  expect(mock.rpc).not.toHaveBeenCalled();
});
it('saves only validated fields with verified scope', async () => {
  const response = await updateCases(
    req({ action: 'save', expectedVersion: 0, cases: [] }),
    id,
  );
  expect(response.status).toBe(200);
  expect(mock.rpc).toHaveBeenCalledWith('save_practice_tests', {
    p_assignment_id: id,
    p_expected_version: 0,
    p_action: 'save',
    p_cases: [],
  });
  expect(response.headers.get('cache-control')).toBe('private, no-store');
});
it('rejects forged identity/results, malformed/oversized JSON', async () => {
  for (const body of [
    { action: 'save', expectedVersion: 0, cases: [], studentId: id },
    { action: 'publish', expectedVersion: 0, cases: [] },
    { padding: 'x'.repeat(370000) },
  ])
    expect((await updateCases(req(body), id)).status).toBe(400);
  expect(mock.rpc).not.toHaveBeenCalled();
});
it('maps conflicts and owner denial without raw database diagnostics', async () => {
  mock.rpc.mockResolvedValueOnce({
    error: { code: '40001', message: 'private raw sql' },
    data: null,
  });
  const conflict = await updateCases(
    req({ action: 'save', expectedVersion: 0, cases: [] }),
    id,
  );
  expect(conflict.status).toBe(409);
  expect(await conflict.text()).not.toContain('private raw sql');
  mock.rpc.mockResolvedValueOnce({ error: { code: '42501' }, data: null });
  expect(
    (await updateCases(req({ action: 'unpublish', expectedVersion: 1 }), id))
      .status,
  ).toBe(404);
});
it('requires a student for the public projection and returns unavailable as 404', async () => {
  expect((await readCases(id, 'student')).status).toBe(403);
  mock.identity.mockResolvedValue({
    user: { id: 's' },
    role: 'student',
    supabase: {},
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
