import { z } from 'zod';
import { parseHistoryPage, type HistoryItem } from './history';
import {
  buildListUrl,
  type ListFilters,
  type ListSearchParams,
} from '@/features/student-lists/filters';

const cursorParts = z.tuple([
  z.iso.datetime({ offset: true }).max(40),
  z.uuid(),
]);
export type HistoryCursor = { submittedAt: string; id: string };

export function parseHistoryCursor(value: unknown): HistoryCursor | null {
  if (typeof value !== 'string' || value.length > 90) return null;
  const result = cursorParts.safeParse(value.split('|'));
  return result.success
    ? { submittedAt: result.data[0], id: result.data[1] }
    : null;
}

export function parseHistoryNavigation(params: ListSearchParams) {
  const page = parseHistoryPage(params.page);
  if (
    page === null ||
    (params.after !== undefined && params.before !== undefined)
  )
    return null;
  const rawCursor = params.after ?? params.before;
  if (rawCursor === undefined)
    return { page: 1, cursor: null, backwards: false, legacy: page > 1 };
  const cursor = parseHistoryCursor(rawCursor);
  if (!cursor || (params.after !== undefined && page === 1)) return null;
  return {
    page,
    cursor,
    backwards: params.before !== undefined,
    legacy: false,
  };
}

export function buildHistoryUrl(
  path: string,
  filters: ListFilters,
  navigation: {
    page: number;
    cursor?: Pick<HistoryItem, 'submittedAt' | 'id'>;
    backwards?: boolean;
  },
) {
  const [base, query] = buildListUrl(path, filters, navigation.page).split('?');
  const params = new URLSearchParams(query);
  if (navigation.cursor)
    params.set(
      navigation.backwards ? 'before' : 'after',
      `${navigation.cursor.submittedAt}|${navigation.cursor.id}`,
    );
  return params.size ? `${base}?${params}` : base;
}
