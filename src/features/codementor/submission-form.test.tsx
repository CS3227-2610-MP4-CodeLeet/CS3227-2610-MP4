/* eslint-disable sonarjs/no-duplicate-string -- repeated expected text documents the user-facing contract. */
// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SubmissionForm } from './submission-form';

const router = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('@/features/student-submissions/code-editor', () => ({
  CodeEditor: ({
    language,
    source,
    onChange,
  }: {
    language: string;
    source: string;
    onChange: (value: string) => void;
  }) => (
    <textarea
      aria-label={`${language === 'java' ? 'Java' : 'Python'} source code`}
      value={source}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));
vi.mock('@/features/student-submissions/assignment-practice', () => ({
  AssignmentPractice: () => <p>Practice runner</p>,
}));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('student submission form', () => {
  it('submits the changed draft with an idempotency key and acknowledges the saved revision', async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ submission: { revision: 4 } }), {
        status: 201,
      }),
    );
    vi.stubGlobal('fetch', fetch);
    render(
      <SubmissionForm
        assignmentId="assignment-1"
        language="python"
        initialSource="print(1)"
        editingRevision={3}
      />,
    );
    expect(screen.getByText('Editing revision 3')).toBeTruthy();
    expect(screen.getByText('No unsaved changes')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Python source code'), {
      target: { value: 'print(2)' },
    });
    expect(screen.getByText('Unsaved changes')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Submit revision' }));
    await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    const payload = JSON.parse(fetch.mock.calls[0][1].body as string);
    expect(payload).toMatchObject({
      assignmentId: 'assignment-1',
      source: 'print(2)',
    });
    expect(payload.requestId).toMatch(/^[0-9a-f-]{36}$/i);
    expect((await screen.findByText('Saved revision 4.')).textContent).toBe(
      'Saved revision 4.',
    );
    expect(screen.getByText('No unsaved changes')).toBeTruthy();
    expect(router.refresh).toHaveBeenCalledOnce();
  });

  it('prevents blank submissions and reports a stable service error', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ error: { message: 'Submission is not allowed.' } }),
          { status: 403 },
        ),
      );
    vi.stubGlobal('fetch', fetch);
    render(<SubmissionForm assignmentId="assignment-2" language="java" />);
    expect(
      (
        screen.getByRole('button', {
          name: 'Submit revision',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    fireEvent.change(screen.getByLabelText('Java source code'), {
      target: { value: 'class Main {}' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit revision' }));
    expect(
      (await screen.findByText('Submission is not allowed.')).textContent,
    ).toBe('Submission is not allowed.');
    expect(fetch).toHaveBeenCalledOnce();
  });
});
