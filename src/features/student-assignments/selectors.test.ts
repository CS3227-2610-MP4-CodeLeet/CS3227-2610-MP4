import { describe, expect, it } from 'vitest';
import {
  isAssignmentPreviewEnabled,
  publishedDetail,
  publishedSummaries,
} from './selectors';
import type { AssignmentRecord } from './types';

const records = [
  {
    id: 'b',
    title: 'Java sample',
    instructions: 'Public instructions',
    language: 'java',
    publication_status: 'published',
    private_rubric: 'PRIVATE_CANARY',
  },
  {
    id: 'a',
    title: 'Draft sample',
    instructions: 'DRAFT_CANARY',
    language: 'python',
    publication_status: 'draft',
  },
  {
    id: 'c',
    title: '<script>test()</script>',
    instructions: '<img src=x onerror=test()>',
    language: 'python',
    publication_status: 'published',
  },
] satisfies (AssignmentRecord & { private_rubric?: string })[];

describe('student public projections', () => {
  it('omits drafts, instructions and unknown private fields from summaries', () => {
    const result = publishedSummaries(records);
    expect(result.map((item) => item.id)).toEqual(['b', 'c']);
    expect(JSON.stringify(result)).not.toContain('PRIVATE_CANARY');
    expect(result.every((item) => !('instructions' in item))).toBe(true);
  });

  it('treats draft and missing detail identically and projects explicit public fields', () => {
    expect(publishedDetail(records, 'a')).toBeNull();
    expect(publishedDetail(records, 'missing')).toBeNull();
    expect(publishedDetail(records, 'b')).toEqual({
      id: 'b',
      title: 'Java sample',
      instructions: 'Public instructions',
      language: 'java',
      publication_status: 'published',
    });
  });

  it('preserves source text for safe rendering instead of interpreting markup', () => {
    expect(publishedDetail(records, 'c')?.instructions).toBe(
      '<img src=x onerror=test()>',
    );
    expect(publishedSummaries([])).toEqual([]);
  });
});

describe('preview environment boundary', () => {
  it.each([
    ['production', 'true', false],
    ['test', 'true', false],
    ['development', undefined, false],
    ['development', 'false', false],
    [undefined, 'true', false],
    ['development', 'true', true],
  ])('mode %s and flag %s gives %s', (mode, flag, expected) => {
    expect(isAssignmentPreviewEnabled(mode, flag)).toBe(expected);
  });
});
