import { describe, expect, it } from 'vitest';
import { canAccessRole, hasInstructorAccess } from './roles';

describe('application role capabilities', () => {
  it('gives admins instructor access', () => {
    expect(hasInstructorAccess('admin')).toBe(true);
    expect(canAccessRole('instructor', 'admin')).toBe(true);
  });

  it('keeps student and admin expectations exact', () => {
    expect(canAccessRole('student', 'admin')).toBe(false);
    expect(canAccessRole('admin', 'instructor')).toBe(false);
  });
});
