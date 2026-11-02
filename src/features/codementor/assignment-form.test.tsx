/* eslint-disable max-lines-per-function -- behavioral test suites keep related scenarios together. */
/* eslint-disable sonarjs/no-duplicate-string -- repeated expected text documents the user-facing contract. */
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AssignmentForm } from './assignment-form';

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('instructor assignment form', () => {
  it('creates a draft with its private rubric and navigates after saving', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response('{}', { status: 201 }));
    vi.stubGlobal('fetch', fetch);
    render(<AssignmentForm />);
    fireEvent.change(screen.getByLabelText('Maximum XP'), {
      target: { value: '0' },
    });
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Array basics' },
    });
    fireEvent.change(screen.getByLabelText('Instructions'), {
      target: { value: 'Read values and print a result.' },
    });
    fireEvent.change(screen.getByLabelText('Criterion 1 title'), {
      target: { value: 'Correctness' },
    });
    fireEvent.change(screen.getByLabelText('Criterion 1 description'), {
      target: { value: 'Checks the expected output.' },
    });
    fireEvent.change(screen.getByLabelText('Criterion 1 maximum score'), {
      target: { value: '8' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save assignment' }));
    expect(
      await screen.findByRole('button', { name: 'Save assignment' }),
    ).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith(
      '/api/assignments',
      expect.objectContaining({ method: 'POST' }),
    );
    const payload = JSON.parse(fetch.mock.calls[0][1].body as string);
    expect(payload).toMatchObject({
      title: 'Array basics',
      instructions: 'Read values and print a result.',
      language: 'python',
      publicationStatus: 'draft',
    });
    expect(payload.rubric).toEqual([
      expect.objectContaining({
        title: 'Correctness',
        description: 'Checks the expected output.',
        maxScore: 8,
      }),
    ]);
    expect(router.push).toHaveBeenCalledWith('/instructor');
    expect(router.refresh).toHaveBeenCalledOnce();
  });

  it('preserves locked assignment language and reports a service failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: { message: 'Assignment changed elsewhere.' },
          }),
          { status: 409 },
        ),
      ),
    );
    render(
      <AssignmentForm
        assignment={{
          id: 'assignment-1',
          title: 'Existing',
          instructions: 'Instructions',
          language: 'java',
          languageLocked: true,
          publication_status: 'published',
          version: 7,
          max_xp: 0,
          criteria: [
            {
              id: 'criterion-1',
              title: 'Correctness',
              description: 'Expected behavior',
              maxScore: 10,
            },
          ],
        }}
      />,
    );
    expect(
      (screen.getByLabelText('Language') as HTMLSelectElement).disabled,
    ).toBe(true);
    expect(
      screen.getByText('Language is fixed once students submit.'),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Save assignment' }));
    expect((await screen.findByRole('status')).textContent).toBe(
      'Assignment changed elsewhere.',
    );
    const payload = JSON.parse(
      (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string,
    );
    expect(payload).toMatchObject({
      language: 'java',
      expectedVersion: 7,
      publicationStatus: 'published',
    });
    expect(router.push).not.toHaveBeenCalled();
  });

  it('adds, edits, and removes rubric criteria while retaining one required row', () => {
    render(<AssignmentForm />);
    fireEvent.change(screen.getByLabelText('Maximum XP'), {
      target: { value: '0' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Add rubric criterion' }),
    );
    expect(screen.getByLabelText('Criterion 2 title')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Criterion 2 title'), {
      target: { value: 'Style' },
    });
    expect(
      (screen.getByLabelText('Criterion 2 title') as HTMLInputElement).value,
    ).toBe('Style');
    fireEvent.click(screen.getByRole('button', { name: 'Remove criterion 2' }));
    expect(screen.queryByLabelText('Criterion 2 title')).toBeNull();
    expect(
      (
        screen.getByRole('button', {
          name: 'Remove criterion 1',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });
});
