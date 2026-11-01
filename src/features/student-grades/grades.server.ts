import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  emptyListFilters,
  titleSearchPattern,
  type ListFilters,
} from '@/features/student-lists/filters';
import { GRADES_PAGE_SIZE, parseGradeItems, type GradesPage } from './grades';

export async function loadStudentGrades(
  client: SupabaseClient,
  studentId: string,
  page: number,
  filters: ListFilters = emptyListFilters,
): Promise<GradesPage | null> {
  try {
    const offset = (page - 1) * GRADES_PAGE_SIZE;
    let query = client
      .from('grades')
      .select(
        `id,submission_id,total_score,feedback,published_at,submissions!inner(language,revision,assignments${filters.q ? '!inner' : ''}(title))`,
      )
      .eq('submissions.student_id', studentId)
      .not('published_at', 'is', null);
    if (filters.language)
      query = query.eq('submissions.language', filters.language);
    if (filters.q)
      query = query.filter(
        'submissions.assignments.title',
        'imatch',
        titleSearchPattern(filters.q),
      );
    const { data, error } = await query
      .order('published_at', { ascending: false })
      .order('id', { ascending: false })
      .range(offset, offset + GRADES_PAGE_SIZE);
    if (error) return null;
    const rows = parseGradeItems(data);
    return {
      rows: rows.slice(0, GRADES_PAGE_SIZE),
      hasNext: rows.length > GRADES_PAGE_SIZE && page < 10_000,
    };
  } catch {
    return null;
  }
}
