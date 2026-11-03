import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { parseHistoryItems } from '@/features/student-submissions/history';
import { PROGRESS_LIST_LIMIT, recentGradesSchema } from './contracts';

export async function loadRecentSubmissions(
  client: SupabaseClient,
  studentId: string,
) {
  try {
    const { data, error } = await client
      .from('submissions')
      .select(
        'id,assignment_id,language,revision,created_at,is_late,due_at_submission,assignments(title)',
      )
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(PROGRESS_LIST_LIMIT);
    if (error || !Array.isArray(data) || data.length > PROGRESS_LIST_LIMIT)
      return null;
    return parseHistoryItems(data);
  } catch {
    return null;
  }
}

export async function loadRecentGrades(
  client: SupabaseClient,
  studentId: string,
) {
  try {
    const { data, error } = await client
      .from('grades')
      .select(
        'id,submission_id,total_score,published_at,submissions!inner(language,revision,assignments(title))',
      )
      .eq('submissions.student_id', studentId)
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(PROGRESS_LIST_LIMIT);
    if (error) return null;
    return recentGradesSchema.parse(data);
  } catch {
    return null;
  }
}
