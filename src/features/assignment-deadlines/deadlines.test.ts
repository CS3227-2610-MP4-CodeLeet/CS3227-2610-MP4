import { expect, it } from 'vitest';
import {
  deadlineFromInput,
  deadlineToInput,
  submissionStatus,
  deadlineRpcArguments,
} from './deadlines';
import {
  assignmentInputSchema,
  submissionInputSchema,
} from '@/features/codementor/contracts';

const utcDue = '2026-11-13T06:00:00Z';
const assignmentInput = {
  title: 'Deadline exercise',
  instructions: 'Print a value.',
  rubric: [
    {
      id: '10000000-0000-4000-8000-000000000001',
      title: 'Output',
      description: 'Prints correctly.',
      maxScore: 10,
    },
  ],
};

it('accepts optional finite ISO deadline instants and explicit null', () => {
  for (const dueAt of [undefined, null, '2026-11-13T14:00:00+08:00']) {
    const result = assignmentInputSchema.safeParse({
      ...assignmentInput,
      ...(dueAt === undefined ? {} : { dueAt }),
    });
    expect(result.success).toBe(true);
  }
});

it.each(['infinity', '2026-11-13T14:00', '2026-02-30T14:00:00Z', 123])(
  'rejects invalid API due dates %j',
  (dueAt) => {
    expect(
      assignmentInputSchema.safeParse({ ...assignmentInput, dueAt }).success,
    ).toBe(false);
  },
);

it.each([
  { is_late: false },
  { created_at: '2000-01-01T00:00:00Z' },
  { due_at_submission: null },
])('rejects client timing claim %j', (claims) => {
  expect(
    submissionInputSchema.safeParse({
      assignmentId: assignmentInput.rubric[0].id,
      requestId: assignmentInput.rubric[0].id,
      source: 'print(1)',
      ...claims,
    }).success,
  ).toBe(false);
});

it('distinguishes omitted deadline updates from an explicit clear', () => {
  expect(deadlineRpcArguments(undefined)).toEqual({});
  expect(deadlineRpcArguments(null)).toEqual({ p_due_at: null });
  expect(deadlineRpcArguments(utcDue)).toEqual({
    p_due_at: utcDue,
  });
});

it('converts SGT input across UTC day boundaries and permits clearing', () => {
  expect(deadlineFromInput('2026-11-13T00:30')).toBe(
    '2026-11-12T16:30:00.000Z',
  );
  expect(deadlineToInput('2026-11-12T16:30:00Z')).toBe('2026-11-13T00:30');
  expect(deadlineFromInput('')).toBeNull();
  expect(deadlineToInput(null)).toBe('');
});

it.each([
  '2026-02-30T14:00',
  'not-a-date',
  '2026-11-13T24:00',
  '2026-11-13T14:00Z',
])('rejects invalid local due inputs %s', (input) => {
  expect(() => deadlineFromInput(input)).toThrow('Choose a valid due date.');
});

it('distinguishes missing, overdue and latest saved status with exact-boundary semantics', () => {
  const due = utcDue;
  const now = Date.parse(due);
  expect(submissionStatus(null, null, now)).toBe('Not submitted');
  expect(submissionStatus(due, null, now)).toBe('Not submitted');
  expect(submissionStatus(due, null, now + 1)).toBe('Overdue');
  expect(submissionStatus(due, { is_late: false }, now + 1)).toBe('Submitted');
  expect(submissionStatus(null, { is_late: true }, now)).toBe('Submitted late');
});
