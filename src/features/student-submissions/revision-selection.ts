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
  if (courseId) {
    return `/courses/${courseId}/assignments/${assignmentId}?fromRevision=${revisionId}`;
  }
  return `/student/assignments/${assignmentId}?fromRevision=${revisionId}`;
}
