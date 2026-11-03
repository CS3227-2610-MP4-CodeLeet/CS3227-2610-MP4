import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  perform: vi.fn(),
  clients: vi.fn(),
  session: vi.fn(),
}));
vi.mock('@/features/auth/sign-in-service.server', () => ({
  performSignIn: mocks.perform,
}));
vi.mock('@/lib/supabase/metadata.server', () => ({
  createSignInClients: mocks.clients,
}));
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: mocks.session,
}));
import { POST } from './route';
const endpoint = 'http://localhost:3000/api/auth/sign-in';
const body = { identifier: 'Paul', password: 'Synthetic!Password' };
function request(value: unknown = body, origin = 'http://localhost:3000') {
  return new Request(endpoint, {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.clients.mockReturnValue({});
  mocks.perform.mockResolvedValue({ kind: 'success' });
});
it('rejects cross-origin, forged and oversized requests before metadata/auth calls', async () => {
  expect((await POST(request(body, 'https://evil.example.test'))).status).toBe(
    403,
  );
  expect((await POST(request({ ...body, studentId: 'forged' }))).status).toBe(
    400,
  );
  expect(
    (await POST(request({ ...body, password: 'x'.repeat(9000) }))).status,
  ).toBe(413);
  expect(mocks.clients).not.toHaveBeenCalled();
});
it('returns only success without session, role or email fields and disables caching', async () => {
  const result = await POST(request());
  expect(await result.json()).toEqual({ ok: true });
  expect(result.headers.get('cache-control')).toBe('private, no-store');
  expect(mocks.perform).toHaveBeenCalledWith(
    body,
    expect.objectContaining({ getPasswordClient: mocks.session }),
  );
});
it.each([
  ['credentials', 401],
  ['unavailable', 503],
  ['limited', 429],
] as const)('sanitizes %s failures', async (kind, status) => {
  mocks.perform.mockResolvedValue({ kind, retryAfter: 27 });
  const result = await POST(request());
  expect(result.status).toBe(status);
  if (kind === 'limited') expect(result.headers.get('retry-after')).toBe('27');
  const json = await result.json();
  expect(json.error.requestId).toMatch(/^[a-f0-9-]{36}$/);
});
it('fails safely when required privileged configuration is missing', async () => {
  mocks.clients.mockImplementation(() => {
    throw new Error('private secret configuration');
  });
  const result = await POST(request());
  expect(result.status).toBe(503);
  expect(await result.text()).not.toContain('private secret');
  expect(mocks.perform).not.toHaveBeenCalled();
});
