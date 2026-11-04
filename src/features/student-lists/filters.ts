import { z } from 'zod';
import {
  assignmentLanguages,
  type AssignmentLanguage,
} from '@/features/student-assignments/types';

export type ListSearchParams = Record<string, string | string[] | undefined>;
const filtersSchema = z.object({
  q: z
    .string()
    .refine((value) => !/[\u0000-\u001f\u007f]/.test(value))
    .trim()
    .max(160)
    .default(''),
  language: z.enum(['', ...assignmentLanguages]).default(''),
});
export type ListFilters = z.infer<typeof filtersSchema>;
export const emptyListFilters: ListFilters = { q: '', language: '' };

export function parseListFilters(params: ListSearchParams): ListFilters | null {
  const result = filtersSchema.safeParse({
    q: params.q,
    language: params.language,
  });
  return result.success ? result.data : null;
}

export function hasListFilters(filters: ListFilters) {
  return Boolean(filters.q || filters.language);
}

export function titleSearchPattern(query: string) {
  return query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function matchesListFilters(
  item: { title: string; language: AssignmentLanguage },
  filters: ListFilters,
) {
  return (
    (!filters.language || filters.language === item.language) &&
    item.title.toLowerCase().includes(filters.q.toLowerCase())
  );
}

export function buildListUrl(path: string, filters: ListFilters, page = 1) {
  const query = new URLSearchParams();
  if (filters.q) query.set('q', filters.q);
  if (filters.language) query.set('language', filters.language);
  if (page > 1) query.set('page', String(page));
  return query.size ? `${path}${path.includes('?') ? '&' : '?'}${query}` : path;
}
