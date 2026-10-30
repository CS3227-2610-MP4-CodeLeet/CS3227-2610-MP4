import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  HISTORY_PAGE_SIZE,
  parseHistoryItems,
  type HistoryPage,
} from './history';

export async function loadSubmissionHistory(
  client: SupabaseClient,
  studentId: string,
  page: number,
): Promise<HistoryPage | null> {
  try {
    const offset = (page - 1) * HISTORY_PAGE_SIZE;
    const { data, error } = await client
      .from('submissions')
      .select(
        'id,assignment_id,language,revision,created_at,assignments(title)',
      )
      .eq('student_id', studentId)
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
