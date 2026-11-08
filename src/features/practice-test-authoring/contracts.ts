import { z } from 'zod';

const literal = (maximum: number) =>
  z
    .string()
    .refine(
      (text) =>
        text.isWellFormed() &&
        !text.includes('\0') &&
        new TextEncoder().encode(text).length <= maximum,
    );
export const practiceCaseSchema = z
  .object({
    id: z.uuid(),
    name: z
      .string()
      .trim()
      .min(1)
      .refine(
        (text) =>
          text.isWellFormed() &&
          !text.includes('\0') &&
          Array.from(text).length <= 120,
      ),
    stdin: literal(4096),
    expected_stdout: literal(8192),
    is_public: z.boolean().default(true),
  })
  .strict();
export const caseSetSchema = z
  .array(practiceCaseSchema)
  .max(25)
  .refine(
    (cases) =>
      new Set(cases.map((item) => item.id.toLowerCase())).size === cases.length,
  );
const version = z.number().int().min(0).max(2_147_483_646);
export const practiceUpdateSchema = z.discriminatedUnion('action', [
  z
    .object({
      action: z.literal('save'),
      expectedVersion: version,
      cases: caseSetSchema,
    })
    .strict(),
  z
    .object({
      action: z.literal('publish'),
      expectedVersion: version,
      cases: caseSetSchema.refine((cases) => cases.length > 0),
    })
    .strict(),
  z
    .object({ action: z.literal('unpublish'), expectedVersion: version })
    .strict(),
]);
export const publicSetSchema = z
  .object({
    assignment_id: z.uuid(),
    assignment_revision: z.number().int().positive(),
    test_set_revision: z.number().int().nonnegative(),
    cases: caseSetSchema,
  })
  .strict();
export type AuthoredCase = z.infer<typeof practiceCaseSchema>;
export type PublicTestSet = z.infer<typeof publicSetSchema>;
export type PracticeUpdate = z.infer<typeof practiceUpdateSchema>;
