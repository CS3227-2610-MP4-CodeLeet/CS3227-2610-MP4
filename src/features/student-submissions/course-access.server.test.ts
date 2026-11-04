import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ read: vi.fn() }));
vi.mock('@/lib/courses/access', () => ({ readCourseAccess: mocks.read }));
import {
  hasInstructorAiReviewAccess,
  hasStudentAiReviewAccess,
} from './course-access.server';

const client = {} as never;
const courseId = '00000000-0000-4000-8000-000000000001';
const instructorRole = 'instructor';
const instructorId = 'instructor-1';

beforeEach(() => {
  mocks.read.mockResolvedValue({
    role: 'student',
    lifecycle: 'active',
    featureEnabled: true,
  });
});

describe('course AI review access', () => {
  it('allows a student to request AI feedback only in an active AI-enabled course', async () => {
    expect(await hasStudentAiReviewAccess(client, 'student-1', courseId)).toBe(
      true,
    );
    expect(mocks.read).toHaveBeenCalledWith(
      client,
      'student-1',
      courseId,
      'ai',
    );

    mocks.read.mockResolvedValueOnce({
      role: 'student',
      lifecycle: 'active',
      featureEnabled: false,
    });
    expect(await hasStudentAiReviewAccess(client, 'student-1', courseId)).toBe(
      false,
    );
    mocks.read.mockResolvedValueOnce({
      role: 'student',
      lifecycle: 'archived',
      featureEnabled: true,
    });
    expect(await hasStudentAiReviewAccess(client, 'student-1', courseId)).toBe(
      false,
    );
  });

  it('allows instructor AI review only in an active AI-enabled course', async () => {
    mocks.read.mockResolvedValue({
      role: instructorRole,
      lifecycle: 'active',
      featureEnabled: true,
    });
    expect(
      await hasInstructorAiReviewAccess(client, instructorId, courseId),
    ).toBe(true);

    mocks.read.mockResolvedValueOnce({
      role: instructorRole,
      lifecycle: 'active',
      featureEnabled: false,
    });
    expect(
      await hasInstructorAiReviewAccess(client, instructorId, courseId),
    ).toBe(false);
    mocks.read.mockResolvedValueOnce({
      role: instructorRole,
      lifecycle: 'archived',
      featureEnabled: true,
    });
    expect(
      await hasInstructorAiReviewAccess(client, instructorId, courseId),
    ).toBe(false);
  });
});
