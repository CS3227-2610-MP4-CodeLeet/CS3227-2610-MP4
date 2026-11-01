import { z } from 'zod';

export const appRoleSchema = z.enum(['student', 'instructor', 'admin']);
export const adminUserSchema = z
  .object({
    user_id: z.uuid(),
    email: z.string().nullable(),
    display_name: z.string(),
    role: appRoleSchema,
  })
  .strict();
export const roleChangeSchema = z.object({ role: appRoleSchema }).strict();
export const userIdSchema = z.uuid();

export type AdminUser = z.infer<typeof adminUserSchema>;
export type AppRole = z.infer<typeof appRoleSchema>;
