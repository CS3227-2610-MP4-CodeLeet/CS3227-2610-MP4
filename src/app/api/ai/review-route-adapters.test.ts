import { describe, expect, it, vi } from 'vitest';
import { POST as studentReview } from './student-review/route';
import { POST as instructorReview } from './instructor-review/route';

const mocks = vi.hoisted(() => ({ handle: vi.fn() }));
vi.mock('@/lib/ai/review-route', () => ({ handleReview: mocks.handle }));

describe('AI review role adapters', () => {
  it('selects the student and instructor review policies at their route boundaries', async () => {
    const request = new Request('http://localhost/api/ai/review', {
      method: 'POST',
    });
    mocks.handle.mockResolvedValue(new Response('{}'));
    await studentReview(request as never);
    expect(mocks.handle).toHaveBeenLastCalledWith(request, 'student');
    await instructorReview(request as never);
    expect(mocks.handle).toHaveBeenLastCalledWith(request, 'instructor');
    expect(mocks.handle).toHaveBeenCalledTimes(2);
  });
});
