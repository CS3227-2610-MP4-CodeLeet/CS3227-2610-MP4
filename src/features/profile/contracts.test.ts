import { describe, expect, it } from 'vitest';
import { profileInput } from './contracts';

describe('profile input', () => {
  it('trims a valid username without interpreting markup', () => {
    expect(profileInput.parse({ username: ' <b>Username</b> ' })).toEqual({
      username: '<b>Username</b>',
    });
  });
  it('accepts the existing name limit', () => {
    expect(profileInput.safeParse({ username: '界'.repeat(80) }).success).toBe(
      true,
    );
  });
  it.each([
    {},
    { username: '' },
    { username: ' \n\t ' },
    { username: 'x'.repeat(81) },
    { username: 'Name', role: 'instructor' },
    { username: 'Name', id: crypto.randomUUID() },
    { username: 'Name', email: 'different@example.test' },
  ])('rejects invalid names or protected fields (%#)', (value) => {
    expect(profileInput.safeParse(value).success).toBe(false);
  });
});
