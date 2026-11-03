import 'server-only';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { assignmentLanguageSchema } from '@/features/codementor/contracts';
import {
  emptyListFilters,
  titleSearchPattern,
  type ListFilters,
} from '@/features/student-lists/filters';
import { submissionStatus } from './deadlines';

const assignmentSchema = z.object({
  id: z.uuid(),
  title: z.string().min(1),
  language: assignmentLanguageSchema,
  publication_status: z.literal('published'),
  due_at: z.iso.datetime({ offset: true }).nullable(),
  submissions: z
    .array(
      z.object({ revision: z.number().int().positive(), is_late: z.boolean() }),
    )
    .max(1),
});

export async function loadPublishedAssignments(
  client: SupabaseClient,
  studentId: string,
  courseId: string,
  filters: ListFilters = emptyListFilters,
) {
  try {
    let query = client
      .from('assignments')
      .select(
        'id,title,language,publication_status,due_at,submissions(revision,is_late)',
      )
      .eq('publication_status', 'published')
      .eq('course_id', courseId)
      .eq('submissions.student_id', studentId)
      .order('revision', { referencedTable: 'submissions', ascending: false })
      .limit(1, { referencedTable: 'submissions' });
    if (filters.language) query = query.eq('language', filters.language);
    if (filters.q)
      query = query.filter('title', 'imatch', titleSearchPattern(filters.q));
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .order('id', { ascending: false });
    if (error) return null;
    const now = Date.now();
    return z
      .array(assignmentSchema)
      .parse(data)
      .map(({ submissions, ...assignment }) => ({
        ...assignment,
        submission_status: submissionStatus(
          assignment.due_at,
          submissions[0] ?? null,
          now,
        ),
      }));
  } catch {
    return null;
  }
}
