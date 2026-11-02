import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { caseSetSchema, publicSetSchema } from './contracts';
const loadFailure = 'Practice tests could not be loaded.';
const draftSchema = z.object({
  version: z.number().int().positive(),
  cases: caseSetSchema,
});
const publicationSchema = z.object({
  published_revision: z.number().int().positive(),
  published_at: z.string().nullable(),
});
const snapshotSchema = z.object({
  published_revision: z.number().int().positive(),
  cases: caseSetSchema,
});
function relation<T extends z.ZodType>(
  value: unknown,
  schema: T,
): z.infer<T> | null {
  if (value == null) return null;
  const parsed = z.union([schema, z.array(schema).max(1)]).parse(value);
  return Array.isArray(parsed) ? (parsed[0] ?? null) : parsed;
}
export async function loadPublicCases(client: SupabaseClient, id: string) {
  const { data, error } = await client
    .from('assignments')
    .select('id,version,assignment_practice_sets(published_revision,cases)')
    .eq('id', id)
    .eq('publication_status', 'published')
    .maybeSingle();
  if (error) throw new Error(loadFailure);
  if (!data) return null;
  const snapshot = relation(data.assignment_practice_sets, snapshotSchema);
  return publicSetSchema.parse({
    assignment_id: id,
    assignment_revision: data.version,
    test_set_revision: snapshot?.published_revision ?? 0,
    cases: snapshot?.cases ?? [],
  });
}
export async function loadOwnerCases(client: SupabaseClient, id: string) {
  const { data, error } = await client
    .from('assignments')
    .select(
      'id,title,language,assignment_practice_drafts(version,cases),assignment_practice_sets(published_revision,published_at)',
    )
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(loadFailure);
  if (!data) return null;
  return {
    assignment_id: id,
    title: String(data.title),
    language: String(data.language),
    ...(relation(data.assignment_practice_drafts, draftSchema) ?? {
      version: 0,
      cases: [],
    }),
    ...(relation(data.assignment_practice_sets, publicationSchema) ?? {
      published_revision: 0,
      published_at: null,
    }),
  };
}
export type OwnerTestSet = NonNullable<
  Awaited<ReturnType<typeof loadOwnerCases>>
>;
