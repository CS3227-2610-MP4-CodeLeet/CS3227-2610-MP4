import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));
import {
  confirmRoleChange,
  destinationForRole,
  UserDirectory,
} from './user-directory';

const users = [
  {
    user_id: '00000000-0000-4000-8000-000000000001',
    email: 'admin@example.test',
    display_name: 'Admin User',
    role: 'admin' as const,
  },
];

describe('admin user directory', () => {
  it('renders the approved account fields and role options', () => {
    const markup = renderToStaticMarkup(
      <UserDirectory
        currentUserId={users[0].user_id}
        initialUsers={users}
        initialNextAfter={null}
      />,
    );
    expect(markup).toContain('admin@example.test');
    expect(markup).toContain('Admin User');
    expect(markup).toContain(users[0].user_id);
    expect(markup).toContain('student');
    expect(markup).toContain('instructor');
    expect(markup).toContain('admin');
  });

  it('sends no role update when a self-change warning is cancelled', async () => {
    const confirm = vi.fn(() => false);
    const save = vi.fn();
    const navigate = vi.fn();
    await confirmRoleChange({
      targetUserId: users[0].user_id,
      currentUserId: users[0].user_id,
      role: 'instructor',
      confirm,
      save,
      navigate,
    });
    expect(confirm).toHaveBeenCalledOnce();
    expect(save).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('saves once after self-change confirmation and selects the resulting workspace', async () => {
    const confirm = vi.fn(() => true);
    const save = vi.fn().mockResolvedValue(undefined);
    const navigate = vi.fn();
    await confirmRoleChange({
      targetUserId: users[0].user_id,
      currentUserId: users[0].user_id,
      role: 'instructor',
      confirm,
      save,
      navigate,
    });
    expect(save).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith('/instructor');
    expect(destinationForRole('student')).toBe('/student/assignments');
  });
});
