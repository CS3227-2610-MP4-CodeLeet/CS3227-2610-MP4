import { z } from 'zod';

const selection = z.uuid().optional();

export function revisionSelection(value: unknown) {
  return selection.safeParse(value);
}

export function revisionEditorPath(
  assignmentId: string,
  revisionId: string,
  courseId?: string,
) {
  const query = new URLSearchParams({ fromRevision: revisionId });
  if (courseId) query.set('courseId', courseId);
  return `/student/assignments/${assignmentId}?${query}`;
}
