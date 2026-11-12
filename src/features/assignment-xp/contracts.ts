import { z } from 'zod';
import { xpRevisionSchema } from '@/lib/courses/xp-pagination';
export const maxXpSchema = z.number().int().min(0).max(100_000);
type XpAssignmentInput = { maxXp?: number; dueAt?: string | null };
export function xpAssignmentArguments(input: XpAssignmentInput) {
  if (input.maxXp === undefined) return {};
  return {
    p_max_xp: input.maxXp,
    p_update_due_at: input.dueAt !== undefined,
    ...(input.dueAt !== undefined ? { p_due_at: input.dueAt } : {}),
  };
}
export function assignmentSaveRpc(input: XpAssignmentInput) {
  return input.maxXp === undefined
    ? 'save_assignment'
    : 'save_assignment_with_xp';
}
const awardSchema = z
  .object({
    assignment_id: z.uuid(),
    assignment_title: z.string().nullable(),
    awarded_xp: maxXpSchema,
    max_xp: maxXpSchema.nullable(),
    updated_at: z.iso.datetime({ offset: true }),
  })
  .strict();
export const xpSummarySchema = z
  .object({
    revision: xpRevisionSchema,
    restarted: z.boolean(),
    total_xp: z.string().regex(/^(0|[1-9]\d*)$/),
    page: z.number().int().min(1).max(10000),
    has_more: z.boolean(),
    awards: z.array(awardSchema).max(25),
  })
  .strict();
export type XpSummary = z.infer<typeof xpSummarySchema>;
export function formatXp(value: string | number) {
  return new Intl.NumberFormat('en-SG').format(BigInt(value));
}
