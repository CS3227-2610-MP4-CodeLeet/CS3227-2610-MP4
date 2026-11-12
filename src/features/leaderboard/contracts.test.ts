import { expect, it } from 'vitest';
import { leaderboardSchema } from './contracts';
const valid = {
  page: 1,
  revision: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  restarted: false,
  has_more: false,
  own: { rank: null, total_xp: '0' },
  rows: [
    {
      position: 1,
      rank: '1',
      username: '<script>literal</script>',
      total_xp: '9007199254740993',
      is_current_user: false,
    },
  ],
};
it('accepts exact totals, shared ranks, Unicode names and a zero own summary', () => {
  expect(leaderboardSchema.parse(valid).rows[0].total_xp).toBe(
    '9007199254740993',
  );
  expect(
    leaderboardSchema.safeParse({
      ...valid,
      rows: [{ ...valid.rows[0], username: '😀'.repeat(80) }],
    }).success,
  ).toBe(true);
});
it('rejects private fields, invalid ranks and oversized result pages', () => {
  for (const row of [
    { ...valid.rows[0], student_id: 'peer' },
    { ...valid.rows[0], rank: '0' },
    { ...valid.rows[0], total_xp: '-1' },
  ])
    expect(leaderboardSchema.safeParse({ ...valid, rows: [row] }).success).toBe(
      false,
    );
  expect(
    leaderboardSchema.safeParse({
      ...valid,
      rows: Array.from({ length: 26 }, () => valid.rows[0]),
    }).success,
  ).toBe(false);
});
