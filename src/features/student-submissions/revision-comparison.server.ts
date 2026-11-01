import 'server-only';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  assignmentLanguageSchema,
  submissionInputSchema,
} from '@/features/codementor/contracts';
import type { ComparisonSelection } from './comparison-selection';

const revision = z.number().int().positive().max(2_147_483_647);
const anchorSchema = z.object({
  id: z.uuid(),
  assignment_id: z.uuid(),
  language: assignmentLanguageSchema,
  revision,
  assignments: z.unknown(),
});
const sourceSchema = z.object({
  id: z.uuid(),
  revision,
  source: submissionInputSchema.shape.source,
});
type Anchor = z.infer<typeof anchorSchema>;

function ownAssignment(
  client: SupabaseClient,
  studentId: string,
  anchor: Anchor,
) {
  return client
    .from('submissions')
    .select('id,source,revision')
    .eq('student_id', studentId)
    .eq('assignment_id', anchor.assignment_id)
    .eq('language', anchor.language);
}

async function loadContext(
  client: SupabaseClient,
  studentId: string,
  id: string,
) {
  const { data, error } = await client
    .from('submissions')
    .select('id,assignment_id,language,revision,assignments(title)')
    .eq('id', id)
    .eq('student_id', studentId)
    .maybeSingle();
  if (error) return null;
  const anchor = anchorSchema.parse(data);
  const latest = await client
    .from('submissions')
    .select('revision')
    .eq('student_id', studentId)
    .eq('assignment_id', anchor.assignment_id)
    .eq('language', anchor.language)
    .order('revision', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latest.error) return null;
  const latestRevision = revision.parse(latest.data?.revision);
  return latestRevision >= anchor.revision ? { anchor, latestRevision } : null;
}

function selectPair(
  selection: ComparisonSelection,
  current: number,
  latest: number,
) {
  const pair = {
    before: selection.before ?? Math.max(1, current - 1),
    after: selection.after ?? (current === 1 ? latest : current),
  };
  return z
    .object({ before: revision.max(latest), after: revision.max(latest) })
    .parse(pair);
}

export async function loadRevisionComparison(
  client: SupabaseClient,
  studentId: string,
  id: string,
  selection: ComparisonSelection,
) {
  try {
    if (!z.uuid().safeParse(id).success) return null;
    const context = await loadContext(client, studentId, id);
    if (!context) return null;
    const { anchor, latestRevision } = context;
    const pair = selectPair(selection, anchor.revision, latestRevision);
    if (latestRevision === 1) return { ...context, before: null, after: null };
    const wanted = [...new Set([pair.before, pair.after])];
    const { data, error } = await ownAssignment(client, studentId, anchor)
      .in('revision', wanted)
      .limit(2);
    if (error) return null;
    const rows = z.array(sourceSchema).max(2).parse(data);
    const before = rows.find((row) => row.revision === pair.before);
    const after = rows.find((row) => row.revision === pair.after);
    if (!before || !after || rows.length !== wanted.length) return null;
    return { ...context, before, after };
  } catch {
    return null;
  }
}

export type RevisionComparison = NonNullable<
  Awaited<ReturnType<typeof loadRevisionComparison>>
>;
