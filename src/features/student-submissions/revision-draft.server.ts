import 'server-only';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AssignmentLanguage } from '@/features/student-assignments/types';

const revisionDraft = z.object({
  id: z.uuid(),
  revision: z.number().int().positive(),
  source: z
    .string()
    .min(1)
    .max(8_000)
    .refine((value) => !value.includes('\0')),
});

export async function loadRevisionDraft(
  supabase: SupabaseClient,
  selection: {
    studentId: string;
    assignmentId: string;
    language: AssignmentLanguage;
    revisionId: string;
  },
) {
  const { studentId, assignmentId, language, revisionId } = selection;
  const { data, error } = await supabase
    .from('submissions')
    .select('id,source,revision')
    .eq('id', revisionId)
    .eq('student_id', studentId)
    .eq('assignment_id', assignmentId)
    .eq('language', language)
    .maybeSingle();
  if (error) return null;
  const parsed = revisionDraft.safeParse(data);
  return parsed.success ? parsed.data : null;
}
