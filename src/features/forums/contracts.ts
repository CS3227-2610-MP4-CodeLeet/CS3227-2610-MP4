import { z } from 'zod';

export const FORUM_PAGE_SIZE = 25;
const message = z.string().trim().min(1).max(8000);
const requestId = z.uuid();
export const forumInput = z.union([
  z
    .object({
      courseId: z.uuid(),
      title: z.string().trim().min(1).max(160),
      body: message,
      requestId,
    })
    .strict(),
  z
    .object({
      courseId: z.uuid(),
      threadId: z.uuid(),
      body: message,
      requestId,
    })
    .strict(),
]);

export function forumPage(value: string | string[] | undefined): number | null {
  if (value === undefined) return 1;
  if (typeof value !== 'string' || !/^[1-9]\d{0,4}$/.test(value)) return null;
  const page = Number(value);
  return page <= 10000 ? page : null;
}

export const forumPost = z.object({
  id: z.uuid(),
  body: z.string(),
  author_name: z.string(),
  author_role: z.enum(['student', 'instructor']),
  created_at: z.string().datetime({ offset: true }),
});
export const forumThread = forumPost.extend({ title: z.string() });
export type ForumPost = z.infer<typeof forumPost>;
export type ForumThread = z.infer<typeof forumThread>;
