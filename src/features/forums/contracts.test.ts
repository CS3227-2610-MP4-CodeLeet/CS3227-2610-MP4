import { describe, expect, it } from 'vitest';
import { forumInput, forumPage } from './contracts';

const requestId = 'f0000000-0000-4000-8000-000000000001';
describe('forum contracts', () => {
  it('accepts plain text including markup without interpreting it', () => {
    expect(
      forumInput.parse({
        title: ' Hello ',
        body: '<script>text</script>',
        requestId,
      }),
    ).toEqual({ title: 'Hello', body: '<script>text</script>', requestId });
  });
  it.each([
    { title: ' ', body: 'Message', requestId },
    { title: 'x'.repeat(161), body: 'Message', requestId },
    { title: 'Hi', body: '\n\t', requestId },
    { title: 'Hi', body: 'x'.repeat(8001), requestId },
    { title: 'Hi', body: 'Message', requestId: 'bad' },
    { title: 'Hi', body: 'Message', requestId, authorId: requestId },
    { body: 'Reply', requestId, threadId: requestId, role: 'instructor' },
  ])('rejects invalid/forged inputs (%#)', (value) => {
    expect(forumInput.safeParse(value).success).toBe(false);
  });
  it('accepts a reply and exact content bounds', () => {
    expect(
      forumInput.safeParse({ threadId: requestId, body: 'Reply', requestId })
        .success,
    ).toBe(true);
    expect(
      forumInput.safeParse({
        title: 'x'.repeat(160),
        body: 'x'.repeat(8000),
        requestId,
      }).success,
    ).toBe(true);
  });
  it.each([undefined, '1', '2', '10000'])('accepts valid page %s', (value) => {
    expect(forumPage(value)).toBe(value ? Number(value) : 1);
  });
  it.each(['0', '-1', '1.5', '10001', 'no', ['1', '2']])(
    'rejects invalid page (%#)',
    (value) => {
      expect(forumPage(value)).toBeNull();
    },
  );
});
