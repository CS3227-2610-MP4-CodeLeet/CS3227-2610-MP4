export type AppRole = 'student' | 'instructor' | 'admin';

export function isAppRole(value: unknown): value is AppRole {
  return value === 'student' || value === 'instructor' || value === 'admin';
}

export function hasInstructorAccess(role: AppRole | null): boolean {
  return role === 'instructor' || role === 'admin';
}

export function canAccessRole(
  expected: AppRole,
  actual: AppRole | null,
): boolean {
  return expected === 'instructor'
    ? hasInstructorAccess(actual)
    : actual === expected;
}
