import { z } from 'zod';

export const usernameValue = z.string().trim().min(1).max(80);
export const claimableUsername = usernameValue.refine(
  (value) => !/[@\u0000-\u001f\u007f-\u009f]/.test(value),
);
export const profileInput = z.object({ username: claimableUsername }).strict();
export const profileResult = z.object({
  profile: z.object({ username: usernameValue }),
});
