/* eslint-disable max-lines-per-function -- behavioral test suites keep related scenarios together. */
/* eslint-disable sonarjs/no-duplicate-string -- repeated expected text documents the user-facing contract. */
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ReviewButton } from './review-button';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('AI review presentation', () => {
  it('requests student learning feedback and renders only provided guidance', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            result: {
              summary: 'Work through the loop carefully.',
              strengths: ['Clear variables'],
              nextSteps: ['Try another input'],
              questions: [],
            },
          }),
          { status: 200 },
        ),
      ),
    );
    render(<ReviewButton role="student" submissionId="submission-1" />);
    expect(
      screen.getByText('Hints are for learning and do not affect grades.'),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Request review' }));
    expect(
      await screen.findByText('Work through the loop carefully.'),
    ).toBeTruthy();
    expect(screen.getByText('What is working')).toBeTruthy();
    expect(screen.getByText('Try another input')).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith(
      '/api/ai/student-review',
      expect.objectContaining({
        body: JSON.stringify({ submissionId: 'submission-1' }),
      }),
    );
  });

  it('shows instructor suggestions without presenting them as published grades', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            result: {
              overallFeedback: 'Review the edge cases.',
              totalScore: 7,
              criteria: [
                {
                  criterionId: 'logic',
                  suggestedScore: 7,
                  feedback: 'Mostly correct.',
                },
              ],
            },
          }),
          { status: 200 },
        ),
      ),
    );
    render(<ReviewButton role="instructor" submissionId="submission-2" />);
    expect(
      screen.getByText(
        'Suggestions require instructor review and explicit grade publication.',
      ),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Request review' }));
    expect(await screen.findByText(/Suggested total: 7/)).toBeTruthy();
    expect(screen.getByText('Mostly correct.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /publish/i })).toBeNull();
  });

  it('replaces previous output with a safe error message after a failed request', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({ error: { message: 'Review quota reached.' } }),
            { status: 429 },
          ),
        ),
    );
    render(<ReviewButton role="student" submissionId="submission-3" />);
    fireEvent.click(screen.getByRole('button', { name: 'Request review' }));
    expect((await screen.findByRole('status')).textContent).toBe(
      'Review quota reached.',
    );
  });
});
