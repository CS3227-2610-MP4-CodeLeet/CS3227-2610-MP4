import { expect, it } from 'vitest';
import {
  maxXpSchema,
  xpAssignmentArguments,
  xpSummarySchema,
  formatXp,
} from './contracts';
it('accepts explicit zero and the cap; rejects fractional, negative, over-cap or coerced amounts', () => {
  for (const amount of [0, 100, 100000])
    expect(maxXpSchema.parse(amount)).toBe(amount);
  for (const amount of [-1, 0.5, 100001, '100', NaN, Infinity])
    expect(maxXpSchema.safeParse(amount).success).toBe(false);
});
it('preserves the missing-vs-null deadline distinction when using the XP-aware RPC', () => {
  expect(xpAssignmentArguments({ maxXp: 100 })).toEqual({
    p_max_xp: 100,
    p_update_due_at: false,
  });
  expect(xpAssignmentArguments({ maxXp: 0, dueAt: null })).toEqual({
    p_max_xp: 0,
    p_update_due_at: true,
    p_due_at: null,
  });
  expect(xpAssignmentArguments({})).toEqual({});
});
it('validates source-free awards and exact large totals without floating point coercion', () => {
  const value = {
    total_xp: '9007199254740993',
    page: 1,
    revision: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    restarted: false,
    has_more: false,
    awards: [],
  };
  expect(xpSummarySchema.parse(value)).toEqual(value);
  expect(formatXp(value.total_xp)).toBe('9,007,199,254,740,993');
  expect(xpSummarySchema.safeParse({ ...value, total_xp: '-1' }).success).toBe(
    false,
  );
  expect(
    xpSummarySchema.safeParse({ ...value, source: 'hidden' }).success,
  ).toBe(false);
});
