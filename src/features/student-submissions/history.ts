import { z } from 'zod';
import { assignmentLanguageSchema } from '@/features/codementor/contracts';

export const HISTORY_PAGE_SIZE = 25;
const titleSchema = z.object({ title: z.string().min(1) });
const rowSchema = z.object({
  id: z.uuid(),
  assignment_id: z.uuid(),
  language: assignmentLanguageSchema,
  revision: z.number().int().positive(),
  created_at: z.iso.datetime({ offset: true }),
  assignments: z.unknown().optional(),
});

export function parseHistoryPage(value: string | string[] | undefined) {
  if (value === undefined) return 1;
  if (typeof value !== 'string' || !/^[1-9]\d{0,4}$/.test(value)) return null;
  const page = Number(value);
  return page <= 10_000 ? page : null;
}

export function assignmentTitle(value: unknown) {
  const result = titleSchema.safeParse(Array.isArray(value) ? value[0] : value);
  return result.success ? result.data.title : 'Assignment unavailable';
}

export function parseHistoryItems(data: unknown) {
  return z
    .array(rowSchema)
    .parse(data)
    .map((row) => ({
      id: row.id,
      assignmentId: row.assignment_id,
      title: assignmentTitle(row.assignments),
      language: row.language,
      revision: row.revision,
      submittedAt: row.created_at,
    }));
}

export type HistoryItem = ReturnType<typeof parseHistoryItems>[number];
export type HistoryPage = { rows: HistoryItem[]; hasNext: boolean };
