/* eslint-disable max-lines-per-function -- behavioral test suites keep related scenarios together. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReviewServiceError } from '@/features/codementor/review-service';
import { POST } from './route';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  compare: vi.fn(),
  readCourseAccess: vi.fn(),
}));
vi.mock('@/lib/auth/verified-user', () => ({
  getVerifiedUserRole: mocks.getUser,
}));
vi.mock('@/lib/courses/access', () => ({
  readCourseAccess: mocks.readCourseAccess,
}));
vi.mock('@/features/codementor/review-service', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/features/codementor/review-service')
  >()),
  performContextComparison: mocks.compare,
}));
const submissionId = '00000000-0000-4000-8000-000000000001';
const courseInstructorId = 'course-instructor';
function request(body: unknown, origin = 'http://localhost') {
  return new Request('http://localhost/api/ai/context-comparison', {
    method: 'POST',
    headers: { origin, host: 'localhost', 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}
beforeEach(() => {
  vi.stubEnv('APP_SITE_URL', '');
  mocks.getUser.mockReset();
  mocks.compare.mockReset();
  mocks.readCourseAccess.mockReset().mockResolvedValue({
    role: 'instructor',
    lifecycle: 'active',
    featureEnabled: true,
  });
});

function authorizedSupabase() {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: { assignments: { course_id: 'course-a' } },
      error: null,
    }),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  const supabase = { from: vi.fn().mockReturnValue(query) };
  return { query, supabase };
}

describe('context comparison API', () => {
  it('requires instructor membership and the course AI feature before comparison', async () => {
    const { supabase } = authorizedSupabase();
    mocks.getUser.mockResolvedValue({
      supabase,
      user: { id: 'course-student' },
      role: 'instructor',
    });
    mocks.readCourseAccess.mockResolvedValue({
      role: 'student',
      lifecycle: 'active',
      featureEnabled: true,
    });
    expect((await POST(request({ submissionId }) as never)).status).toBe(404);
    expect(mocks.compare).not.toHaveBeenCalled();
  });

  it('rejects origin and authentication failures and delegates course authorization to the service', async () => {
    expect(
      (await POST(request({ submissionId }, 'https://attacker.test') as never))
        .status,
    ).toBe(403);
    mocks.getUser.mockResolvedValueOnce({
      supabase: {},
      user: null,
      role: null,
    });
    expect((await POST(request({ submissionId }) as never)).status).toBe(401);
    const { supabase } = authorizedSupabase();
    mocks.getUser.mockResolvedValueOnce({
      supabase,
      user: { id: courseInstructorId },
      role: 'student',
    });
    mocks.compare.mockResolvedValueOnce({ authorized: true });
    expect((await POST(request({ submissionId }) as never)).status).toBe(200);
    expect(mocks.compare).toHaveBeenCalledWith(
      supabase,
      courseInstructorId,
      submissionId,
    );
    expect(mocks.readCourseAccess).toHaveBeenCalledWith(
      supabase,
      courseInstructorId,
      'course-a',
      'ai',
    );
    mocks.getUser.mockResolvedValueOnce({
      supabase,
      user: { id: 'teacher' },
      role: 'instructor',
    });
    expect((await POST(request({ bad: true }) as never)).status).toBe(400);
  });

  it('returns comparison output for the authenticated instructor', async () => {
    const { query, supabase } = authorizedSupabase();
    mocks.getUser.mockResolvedValue({
      supabase,
      user: { id: 'teacher' },
      role: 'admin',
    });
    mocks.compare.mockResolvedValue({
      optimized: { inputTokens: 10 },
      broader: { inputTokens: 20 },
    });
    const response = await POST(request({ submissionId }) as never);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.comparison.optimized.inputTokens).toBe(10);
    expect(json.requestId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(query.eq).toHaveBeenCalledWith('id', submissionId);
    expect(mocks.compare).toHaveBeenCalledWith(
      supabase,
      'teacher',
      submissionId,
    );
  });

  it.each([
    ['not_found', 404, 'Submission not found.'],
    ['context_too_large', 413, 'Authorized context exceeds the review budget.'],
    ['quota_exceeded', 429, 'Daily AI review limit reached.'],
    ['unavailable', 503, 'AI review is not configured.'],
    [
      'invalid_model_output',
      502,
      'One review response could not be validated.',
    ],
    ['provider_error', 502, 'AI review is temporarily unavailable.'],
  ] as const)(
    'maps service error %s to a safe response',
    async (code, status, message) => {
      const { supabase } = authorizedSupabase();
      mocks.getUser.mockResolvedValue({
        supabase,
        user: { id: 'teacher' },
        role: 'instructor',
      });
      mocks.compare.mockRejectedValue(new ReviewServiceError(code));
      const response = await POST(request({ submissionId }) as never);
      expect(response.status).toBe(status);
      expect((await response.json()).error.message).toBe(message);
    },
  );

  it('hides unexpected provider details behind a stable server error', async () => {
    const { supabase } = authorizedSupabase();
    mocks.getUser.mockResolvedValue({
      supabase,
      user: { id: 'teacher' },
      role: 'instructor',
    });
    mocks.compare.mockRejectedValue(new Error('secret provider response'));
    const response = await POST(request({ submissionId }) as never);
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error.message).toBe('Context comparison failed.');
    expect(json.error.message).not.toContain('secret');
  });
});
