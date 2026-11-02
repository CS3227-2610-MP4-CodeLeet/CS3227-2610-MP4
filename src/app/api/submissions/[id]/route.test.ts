import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), from: vi.fn() }));
vi.mock('@/lib/auth/verified-user', () => ({
  getVerifiedUserRole: mocks.getUser,
}));
const id = '00000000-0000-4000-8000-000000000001';
function setup(
  role: string,
  data: unknown,
  error: unknown = null,
  userId = 'student',
) {
  const query = {
    select() {
      return this;
    },
    eq() {
      return this;
    },
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
  };
  mocks.from.mockReturnValue(query);
  mocks.getUser.mockResolvedValue({
    user: { id: userId },
    role,
    supabase: { from: mocks.from },
  });
}
const get = (submissionId: string) =>
  GET(new Request('http://localhost') as never, {
    params: Promise.resolve({ id: submissionId }),
  });
beforeEach(() => {
  mocks.getUser.mockReset();
  mocks.from.mockReset();
});

describe('submission detail route', () => {
  it('requires a verified identity and hides malformed or missing submissions', async () => {
    mocks.getUser.mockResolvedValue({ user: null, role: null, supabase: null });
    expect((await get(id)).status).toBe(401);
    setup('student', null);
    expect((await get('invalid')).status).toBe(404);
    expect(mocks.from).not.toHaveBeenCalled();
    expect((await get(id)).status).toBe(404);
  });

  it('keeps other students private while allowing the owner and instructors to read', async () => {
    const submission = { id, student_id: 'owner', source: 'print(1)' };
    setup('student', submission, null, 'other');
    expect((await get(id)).status).toBe(404);
    setup('student', submission, null, 'owner');
    expect(await (await get(id)).json()).toEqual({ submission });
    setup('instructor', submission, null, 'teacher');
    expect((await get(id)).status).toBe(200);
  });

  it('maps database read errors to the same not-found response', async () => {
    setup('instructor', null, new Error('private database details'));
    const response = await get(id);
    expect(response.status).toBe(404);
    expect((await response.json()).error.message).toBe('Submission not found.');
  });
});
