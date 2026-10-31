import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({ getVerifiedUserRole: vi.fn(), rpc: vi.fn() }));
vi.mock('@/lib/auth/verified-user', () => ({
  getVerifiedUserRole: mocks.getVerifiedUserRole,
}));

import { GET } from './route';

const directoryUrl = 'http://localhost:3000/api/admin/users';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getVerifiedUserRole.mockResolvedValue({
    user: { id: '00000000-0000-4000-8000-000000000001' },
    role: 'admin',
    supabase: { rpc: mocks.rpc },
  });
  mocks.rpc.mockResolvedValue({
    data: [
      {
        user_id: '00000000-0000-4000-8000-000000000002',
        email: 'student@example.test',
        display_name: 'Student',
        role: 'student',
      },
    ],
    error: null,
  });
});

describe('GET /api/admin/users', () => {
  it('returns the restricted directory projection without caching', async () => {
    const response = await GET(
      new NextRequest(directoryUrl),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(await response.json()).toMatchObject({
      users: [{ email: 'student@example.test', role: 'student' }],
      nextAfter: null,
    });
    expect(mocks.rpc).toHaveBeenCalledWith('admin_list_users', {
      p_after_user_id: null,
      p_limit: 51,
    });
  });

  it('denies non-admins before reading the directory', async () => {
    mocks.getVerifiedUserRole.mockResolvedValueOnce({
      user: { id: 'student-id' },
      role: 'student',
      supabase: { rpc: mocks.rpc },
    });
    const response = await GET(
      new NextRequest(directoryUrl),
    );
    expect(response.status).toBe(403);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('rejects an invalid pagination cursor', async () => {
    const response = await GET(
      new NextRequest(`${directoryUrl}?after=invalid`),
    );
    expect(response.status).toBe(400);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('returns pages of 50 and an after cursor when another page exists', async () => {
    const rows = Array.from({ length: 51 }, (_, index) => ({
      user_id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
      email: `user${index + 1}@example.test`,
      display_name: `User ${index + 1}`,
      role: 'student',
    }));
    mocks.rpc.mockResolvedValueOnce({ data: rows, error: null });
    const response = await GET(
      new NextRequest(directoryUrl),
    );
    const payload = await response.json();
    expect(payload.users).toHaveLength(50);
    expect(payload.nextAfter).toBe(rows[49].user_id);
    expect(payload.users.some((row: { user_id: string }) => row.user_id === rows[50].user_id)).toBe(false);
  });
});
