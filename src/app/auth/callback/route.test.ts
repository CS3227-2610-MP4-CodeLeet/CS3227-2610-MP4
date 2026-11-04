import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  exchange: vi.fn(),
  getUser: vi.fn(),
  role: vi.fn(),
  rpc: vi.fn(),
}));
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { exchangeCodeForSession: mocks.exchange, getUser: mocks.getUser },
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: mocks.role }) }),
    }),
    rpc: mocks.rpc,
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
  mocks.rpc.mockResolvedValue({
    data: '00000000-0000-4000-8000-000000000002',
    error: null,
  });
});
afterEach(() => vi.clearAllMocks());

describe('recovery callback boundary', () => {
  it('routes instructors through course discovery after sign-in', async () => {
    mocks.role.mockResolvedValue({ data: { role: 'instructor' }, error: null });
    const response = await GET(
      new NextRequest(`${base}/auth/callback?code=synthetic`),
    );
    expect(response.headers.get('location')).toBe(`${base}/courses`);
  });
  it('routes admins through course discovery after sign-in', async () => {
    mocks.role.mockResolvedValue({ data: { role: 'admin' }, error: null });
    const response = await GET(
      new NextRequest(`${base}/auth/callback?code=synthetic`),
    );
    expect(response.headers.get('location')).toBe(`${base}/courses`);
  });
  it('routes students through course discovery after sign-in', async () => {
    mocks.role.mockResolvedValue({ data: { role: 'student' }, error: null });
    const response = await GET(
      new NextRequest(`${base}/auth/callback?code=synthetic`),
    );
    expect(response.headers.get('location')).toBe(`${base}/courses`);
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
    expect(response.headers.get('location')).toBe(`${base}/courses`);
  });
});

describe('course invitation callback', () => {
  it('grants membership only after exchanging the verified sign-in link', async () => {
    const response = await GET(
      new NextRequest(
        `${base}/auth/callback?code=synthetic&course_invite=abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN`,
      ),
    );
    expect(response.headers.get('location')).toBe(
      `${base}/courses/00000000-0000-4000-8000-000000000002`,
    );
    expect(mocks.rpc).toHaveBeenCalledWith('accept_course_invitation', {
      p_token: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN',
    });
    expect(response.headers.get('referrer-policy')).toBe('no-referrer');
  });
  it('does not call the acceptance RPC without a valid token or verified session', async () => {
    const invalid = await GET(
      new NextRequest(
        `${base}/auth/callback?code=synthetic&course_invite=short`,
      ),
    );
    expect(invalid.headers.get('location')).toBe(
      `${base}/sign-in?confirmed=error`,
    );
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('fails closed when the invite is revoked, expired or belongs to another email', async () => {
    mocks.rpc.mockResolvedValueOnce({
      data: null,
      error: new Error('invitation_unavailable'),
    });
    const response = await GET(
      new NextRequest(
        `${base}/auth/callback?code=synthetic&course_invite=abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN`,
      ),
    );
    expect(response.headers.get('location')).toBe(
      `${base}/sign-in?confirmed=error`,
    );
  });
});
