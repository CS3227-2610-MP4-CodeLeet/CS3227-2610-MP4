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

export async function loadSubmissionHistory(
  client: SupabaseClient,
  {
    studentId,
    courseId,
    page,
    filters = emptyListFilters,
  }: {
    studentId: string;
    courseId: string;
    page: number;
    filters?: ListFilters;
  },
): Promise<HistoryPage | null> {
  try {
    const offset = (page - 1) * HISTORY_PAGE_SIZE;
    let query = client
      .from('submissions')
      .select(
        'id,assignment_id,course_id,language,revision,created_at,is_late,due_at_submission,assignments(title)',
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
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(offset, offset + HISTORY_PAGE_SIZE);
    if (error) return null;
    const rows = parseHistoryItems(data);
    return {
      rows: rows.slice(0, HISTORY_PAGE_SIZE),
      hasNext: rows.length > HISTORY_PAGE_SIZE && page < 10_000,
    };
  } catch {
    return null;
  }
}
