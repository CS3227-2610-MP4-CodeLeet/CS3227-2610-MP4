import { z } from 'zod';

export const usernameValue = z.string().trim().min(1).max(80);
export const profileInput = z.object({ username: usernameValue }).strict();
export const profileResult = z.object({ profile: profileInput });
