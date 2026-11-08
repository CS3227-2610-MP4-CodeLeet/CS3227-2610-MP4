import { z } from 'zod';
import { claimableUsername } from '@/features/profile/contracts';

export const signInInput = z
  .object({
    identifier: z
      .string()
      .trim()
      .min(1)
      .max(254)
      .refine((value) =>
        value.includes('@')
          ? z.email().safeParse(value).success
          : claimableUsername.safeParse(value).success,
      ),
    password: z.string().min(1).max(1024),
  })
  .strict();
export type SignInInput = z.infer<typeof signInInput>;
