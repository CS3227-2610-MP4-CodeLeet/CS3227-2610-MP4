import { z } from 'zod';
const positive = z.string().regex(/^[1-9]\d*$/);
const total = z.string().regex(/^(0|[1-9]\d*)$/);
export const leaderboardSchema = z
  .object({
    page: z.number().int().min(1).max(10000),
    has_more: z.boolean(),
    own: z
      .object({ rank: positive.nullable(), total_xp: total })
      .strict()
      .nullable(),
    rows: z
      .array(
        z
          .object({
            position: z.number().int().min(1).max(250000),
            rank: positive,
            username: z
              .string()
              .min(1)
              .refine((value) => Array.from(value).length <= 80),
            total_xp: positive,
            is_current_user: z.boolean(),
          })
          .strict(),
      )
      .max(25),
  })
  .strict();
export type Leaderboard = z.infer<typeof leaderboardSchema>;
