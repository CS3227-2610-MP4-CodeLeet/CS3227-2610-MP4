import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  exchange: vi.fn(),
  getUser: vi.fn(),
  role: vi.fn(),
}));
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { exchangeCodeForSession: mocks.exchange, getUser: mocks.getUser },
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: mocks.role }) }),
    }),
  })),
}));
import { GET } from './route';

const base = 'http://localhost:3000';
beforeEach(() => {
  mocks.exchange.mockResolvedValue({ error: null });
  mocks.getUser.mockResolvedValue({
    data: { user: { id: 'synthetic-id' } },
    error: null,
  });
  mocks.role.mockResolvedValue({ data: { role: 'student' }, error: null });
});
afterEach(() => vi.clearAllMocks());

describe('recovery callback boundary', () => {
  it('preserves the normal instructor callback destination', async () => {
    mocks.role.mockResolvedValue({ data: { role: 'instructor' }, error: null });
    const response = await GET(
      new NextRequest(`${base}/auth/callback?code=synthetic`),
    );
    expect(response.headers.get('location')).toBe(`${base}/instructor`);
  });
  it('preserves the normal callback without a code', async () => {
    const response = await GET(new NextRequest(`${base}/auth/callback`));
    expect(response.headers.get('location')).toBe(`${base}/sign-in`);
  });
  it('routes verified recovery to the fixed password page', async () => {
    const response = await GET(
      new NextRequest(
        `${base}/auth/callback?code=synthetic&next=/reset-password`,
      ),
    );
    expect(response.headers.get('location')).toBe(`${base}/reset-password`);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('referrer-policy')).toBe('no-referrer');
    expect(mocks.role).not.toHaveBeenCalled();
  });
  it('rejects a recovery callback without a code', async () => {
    const response = await GET(
      new NextRequest(`${base}/auth/callback?next=/reset-password`),
    );
    expect(response.headers.get('location')).toBe(
      `${base}/forgot-password?error=invalid-link`,
    );
    expect(mocks.exchange).not.toHaveBeenCalled();
  });
  it('handles expired codes without exposing provider text', async () => {
    mocks.exchange.mockResolvedValue({
      error: new Error('Private provider detail'),
    });
    const response = await GET(
      new NextRequest(
        `${base}/auth/callback?code=expired&next=/reset-password`,
      ),
    );
    expect(response.headers.get('location')).toBe(
      `${base}/forgot-password?error=invalid-link`,
    );
  });
  it('requires a verified identity even after code exchange', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Invalid identity'),
    });
    const response = await GET(
      new NextRequest(
        `${base}/auth/callback?code=synthetic&next=/reset-password`,
      ),
    );
    expect(response.headers.get('location')).toBe(
      `${base}/forgot-password?error=invalid-link`,
    );
  });
});

describe('callback failure and redirect handling', () => {
  it('fails closed when the provider throws', async () => {
    mocks.exchange.mockRejectedValue(new Error('Network failure'));
    const response = await GET(
      new NextRequest(
        `${base}/auth/callback?code=synthetic&next=/reset-password`,
      ),
    );
    expect(response.headers.get('location')).toBe(
      `${base}/forgot-password?error=invalid-link`,
    );
  });
  it.each([
    'https://example.test/steal',
    '//example.test',
    '/reset-password/other',
  ])('ignores an arbitrary next target %s', async (next) => {
    const response = await GET(
      new NextRequest(
        `${base}/auth/callback?code=synthetic&next=${encodeURIComponent(next)}`,
      ),
    );
    expect(response.headers.get('location')).toBe(
      `${base}/student/assignments`,
    );
  });
});
