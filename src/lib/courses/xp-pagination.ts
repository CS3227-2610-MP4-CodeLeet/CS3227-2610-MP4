import { z } from 'zod';

export const xpRevisionSchema = z.string().regex(/^[a-f0-9]{32}$/);

export function parseXpRevision(value: string | string[] | undefined) {
  if (value === undefined) return { revision: undefined };
  const parsed = xpRevisionSchema.safeParse(value);
  return parsed.success ? { revision: parsed.data } : null;
}
