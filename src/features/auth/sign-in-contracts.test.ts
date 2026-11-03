import { expect, it } from 'vitest';
import { signInInput } from './sign-in-contracts';
import { profileInput } from '@/features/profile/contracts';

it('accepts trimmed email/username identifiers without modifying passwords', () => {
  for (const identifier of ['  Paul C  ', 'PAUL', 'person@example.test'])
    expect(signInInput.parse({ identifier, password: ' unchanged ' })).toEqual({
      identifier: identifier.trim(),
      password: ' unchanged ',
    });
});
it.each(['', 'a'.repeat(81), 'broken@email', 'a\0b', 'a\nb'])(
  'rejects invalid identifiers',
  (identifier) => {
    expect(
      signInInput.safeParse({ identifier, password: 'password' }).success,
    ).toBe(false);
  },
);
it('bounds passwords and rejects forged fields', () => {
  expect(
    signInInput.safeParse({ identifier: 'Paul', password: 'x'.repeat(1025) })
      .success,
  ).toBe(false);
  expect(
    signInInput.safeParse({
      identifier: 'Paul',
      password: '',
      role: 'instructor',
    }).success,
  ).toBe(false);
});
it.each(['a@b', 'a\0b', 'a\nb'])(
  'rejects ambiguous or control-containing username claims',
  (username) => {
    expect(profileInput.safeParse({ username }).success).toBe(false);
  },
);
