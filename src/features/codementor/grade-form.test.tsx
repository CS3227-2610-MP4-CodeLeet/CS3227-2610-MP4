/* eslint-disable max-lines-per-function -- the suite keeps the grade save and recovery cases together. */
/* eslint-disable sonarjs/no-duplicate-string -- repeated form labels make the assertions clear. */
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GradeForm } from './grade-form';

const criteria = [
  { id: 'logic', title: 'Logic', maxScore: 10 },
  { id: 'style', title: 'Style', maxScore: 5 },
];
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('instructor grade form', () => {
  it('saves explicit scores, feedback, publication choice, and the current version', async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ grade: { version: 5 } }), {
        status: 200,
      }),
    );
    vi.stubGlobal('fetch', fetch);
    render(
      <GradeForm
        submissionId="submission-1"
        criteria={criteria}
        grade={{
          id: 'grade',
          scores: { logic: 7, style: 3 },
          feedback: 'Good',
          total_score: 10,
          published_at: null,
          version: 4,
        }}
      />,
    );
    fireEvent.change(screen.getByLabelText('Logic (/10)'), {
      target: { value: '8.5' },
    });
    fireEvent.change(screen.getByLabelText('Feedback'), {
      target: { value: 'Clear explanation' },
    });
    fireEvent.click(screen.getByLabelText('Publish this grade to the student'));
    expect(screen.getByText('Total: 11.5')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Save and publish' }));
    expect((await screen.findByRole('status')).textContent).toBe(
      'Grade saved and published.',
    );
    expect(fetch).toHaveBeenCalledWith(
      '/api/grades/submission-1',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({
          scores: { logic: 8.5, style: 3 },
          feedback: 'Clear explanation',
          totalScore: 11.5,
          publish: true,
          expectedVersion: 4,
        }),
      }),
    );
  });

  it('saves a draft and displays service errors without publishing', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({ error: { message: 'Grade changed elsewhere.' } }),
            { status: 409 },
          ),
        ),
    );
    render(
      <GradeForm
        submissionId="submission-2"
        criteria={criteria.slice(0, 1)}
        grade={null}
      />,
    );
    fireEvent.change(screen.getByLabelText('Logic (/10)'), {
      target: { value: '7.5' },
    });
    fireEvent.change(screen.getByLabelText('Feedback'), {
      target: { value: 'Retain this feedback after the conflict.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    expect((await screen.findByRole('status')).textContent).toBe(
      'Grade changed elsewhere.',
    );
    expect(screen.getByRole('button', { name: 'Save draft' })).toBeTruthy();
    expect(
      (screen.getByLabelText('Logic (/10)') as HTMLInputElement).value,
    ).toBe('7.5');
    expect(
      (screen.getByLabelText('Feedback') as HTMLTextAreaElement).value,
    ).toBe('Retain this feedback after the conflict.');
  });
});
