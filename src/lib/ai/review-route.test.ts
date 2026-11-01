import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  getVerifiedUserRole: vi.fn(),
  performReview: vi.fn(),
}));

vi.mock('@/lib/auth/verified-user', () => ({
  getVerifiedUserRole: mocks.getVerifiedUserRole,
}));
vi.mock('@/features/codementor/review-service', () => ({
  performReview: mocks.performReview,
  ReviewServiceError: class ReviewServiceError extends Error {
    constructor(readonly code: string) {
      super(code);
    }
  },
}));

import { handleReview } from './review-route';

const userId = '20000000-0000-4000-8000-000000000001';
const submissionId = '50000000-0000-4000-8000-000000000001';

function request(
  body: unknown = { submissionId },
  origin = 'http://localhost:3000',
) {
  return new NextRequest('http://localhost:3000/api/ai/review', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.stubEnv('APP_SITE_URL', 'http://localhost:3000');
  vi.clearAllMocks();
  mocks.getVerifiedUserRole.mockResolvedValue({
    user: { id: userId },
    role: 'instructor',
    supabase: {},
  });
  mocks.performReview.mockResolvedValue({
    result: {
      criteria: [],
      overallFeedback: 'Consider negative values.',
      totalScore: 0,
    },
    cacheHit: false,
  });
});

describe('shared AI review route', () => {
  it('rejects a foreign origin before verifying identity', async () => {
    const response = await handleReview(
      request({ submissionId }, 'https://foreign.example'),
      'instructor',
    );

    expect(response.status).toBe(403);
    expect(mocks.getVerifiedUserRole).not.toHaveBeenCalled();
    expect(mocks.performReview).not.toHaveBeenCalled();
  });

  it('rejects unauthenticated requests before loading review context', async () => {
    mocks.getVerifiedUserRole.mockResolvedValueOnce({
      user: null,
      role: null,
      supabase: null,
    });

    const response = await handleReview(request(), 'student');

    expect(response.status).toBe(401);
    expect(mocks.performReview).not.toHaveBeenCalled();
  });

  it('rejects a student from the instructor evaluation route', async () => {
    mocks.getVerifiedUserRole.mockResolvedValueOnce({
      user: { id: userId },
      role: 'student',
      supabase: {},
    });

    const response = await handleReview(request(), 'instructor');

    expect(response.status).toBe(403);
    expect(mocks.performReview).not.toHaveBeenCalled();
  });

  it('rejects client-supplied source or rubric instead of trusting it as context', async () => {
    mocks.getVerifiedUserRole.mockResolvedValueOnce({
      user: { id: userId },
      role: 'student',
      supabase: {},
    });
    const response = await handleReview(
      request({ submissionId, source: 'forged()', rubric: ['private'] }),
      'student',
    );

    expect(response.status).toBe(400);
    expect(mocks.performReview).not.toHaveBeenCalled();
  });

  it('passes only the verified identity, role, and submission ID to the review service', async () => {
    const response = await handleReview(request(), 'instructor');

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(mocks.performReview).toHaveBeenCalledWith(
      {},
      userId,
      'instructor',
      submissionId,
    );
  });
});
