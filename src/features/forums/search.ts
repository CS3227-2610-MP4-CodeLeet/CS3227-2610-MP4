import { z } from 'zod';
import { titleSearchPattern } from '@/features/student-lists/filters';

const term = z
  .string()
  .refine((value) => !/[\u0000-\u001f\u007f]/.test(value))
  .trim()
  .max(160)
  .default('');

export function parseForumSearch(value: unknown): string | null {
  const parsed = term.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function forumSearchExpression(query: string) {
  // Regex escaping and PostgREST quoted-value escaping are separate boundaries.
  const pattern = titleSearchPattern(query)
    .replaceAll('\\', '\\\\')
    .replaceAll('"', '\\"');
  return `title.imatch."${pattern}",body.imatch."${pattern}"`;
}

export function forumSearchUrl(path: string, page: number, query = '') {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  params.set('page', String(page));
  return `${path}?${params}`;
}
