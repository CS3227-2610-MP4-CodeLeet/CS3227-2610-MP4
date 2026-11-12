import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  emptyListFilters,
  titleSearchPattern,
  type ListFilters,
} from '@/features/student-lists/filters';
import {
  HISTORY_PAGE_SIZE,
  parseHistoryItems,
  type HistoryPage,
} from './history';
import { parseHistoryCursor, type HistoryCursor } from './history-cursor';

type HistoryOptions = {
  studentId: string;
  courseId: string;
  page: number;
  filters?: ListFilters;
  cursor?: HistoryCursor | null;
  backwards?: boolean;
};

function validPosition({ page, cursor, backwards }: HistoryOptions) {
  if (!Number.isInteger(page) || page < 1 || page > 10_000) return false;
  if ((page > 1 || backwards) && !cursor) return false;
  return (
    !cursor || Boolean(parseHistoryCursor(`${cursor.submittedAt}|${cursor.id}`))
  );
}

function historyQuery(client: SupabaseClient, options: HistoryOptions) {
  const { studentId, courseId, filters = emptyListFilters } = options;
  const assignmentJoin = filters.q
    ? 'assignments!inner(title)'
    : 'assignments(title)';
  let query = client
    .from('submissions')
    .select(
      `id,assignment_id,course_id,language,revision,created_at,is_late,due_at_submission,${assignmentJoin}`,
    )
    .eq('student_id', studentId)
    .eq('course_id', courseId);
  if (filters.language) query = query.eq('language', filters.language);
  if (filters.q)
    query = query.filter(
      'assignments.title',
      'imatch',
      titleSearchPattern(filters.q),
    );
  return query;
}

export async function loadSubmissionHistory(
  client: SupabaseClient,
  options: HistoryOptions,
): Promise<HistoryPage | null> {
  try {
    if (!validPosition(options)) return null;
    const { cursor, backwards = false, page } = options;
    let query = historyQuery(client, options);
    if (cursor) {
      const comparison = backwards ? 'gt' : 'lt';
      query = query.or(
        `created_at.${comparison}.${cursor.submittedAt},and(created_at.eq.${cursor.submittedAt},id.${comparison}.${cursor.id})`,
      );
    }
    const { data, error } = await query
      .order('created_at', { ascending: backwards })
      .order('id', { ascending: backwards })
      .limit(HISTORY_PAGE_SIZE + 1);
    if (error) return null;
    const rows = parseHistoryItems(data);
    const visible = rows.slice(0, HISTORY_PAGE_SIZE);
    return {
      rows: backwards ? visible.reverse() : visible,
      hasNext:
        (backwards ? visible.length > 0 : rows.length > HISTORY_PAGE_SIZE) &&
        page < 10_000,
    };
  } catch {
    return null;
  }
}
