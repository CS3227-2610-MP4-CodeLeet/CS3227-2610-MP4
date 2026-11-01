import { z } from 'zod';

const selection = z.uuid().optional();

export function revisionSelection(value: unknown) {
  return selection.safeParse(value);
}

export function revisionEditorPath(assignmentId: string, revisionId: string) {
  return `/student/assignments/${assignmentId}?fromRevision=${revisionId}`;
}
