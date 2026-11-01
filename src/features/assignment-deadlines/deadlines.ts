import { z } from 'zod';

export const dueAtSchema = z.iso
  .datetime({ offset: true })
  .nullable()
  .optional();
export type SubmissionStatus =
  'Not submitted' | 'Overdue' | 'Submitted' | 'Submitted late';

export function deadlineRpcArguments(dueAt: string | null | undefined) {
  return dueAt === undefined ? {} : { p_due_at: dueAt };
}

export function deadlineFromInput(value: string): string | null {
  if (!value) return null;
  const instant = `${value}:00+08:00`;
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) ||
    !dueAtSchema.safeParse(instant).success
  )
    throw new Error('Choose a valid due date.');
  return new Date(instant).toISOString();
}

export function deadlineToInput(value: string | null | undefined) {
  if (!value) return '';
  return new Date(Date.parse(value) + 8 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);
}

export function formatDeadline(value: string) {
  return new Date(value).toLocaleString('en-SG', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Singapore',
  });
}

export function submissionStatus(
  dueAt: string | null | undefined,
  latest: { is_late: boolean } | null,
  now = Date.now(),
): SubmissionStatus {
  if (latest) return latest.is_late ? 'Submitted late' : 'Submitted';
  return dueAt && now > Date.parse(dueAt) ? 'Overdue' : 'Not submitted';
}
