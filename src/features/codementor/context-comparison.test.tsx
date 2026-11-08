/* eslint-disable max-lines-per-function -- behavioral test suites keep related scenarios together. */
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ContextComparison } from './context-comparison';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('context strategy comparison', { timeout: 15000 }, () => {
  it('submits the submission id and renders both authorized context results', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            comparison: {
              optimized: {
                result: {
                  criteria: [
                    {
                      criterionId: 'logic',
                      suggestedScore: 6,
                      feedback: 'Focused feedback',
                    },
                  ],
                  overallFeedback: 'Focused review',
                  totalScore: 6,
                },
                inputTokens: 120,
                cacheHit: true,
              },
              broader: {
                result: {
                  criteria: [
                    {
                      criterionId: 'logic',
                      suggestedScore: 7,
                      feedback: 'Broader feedback',
                    },
                  ],
                  overallFeedback: 'Broader review',
                  totalScore: 7,
                },
                inputTokens: 260,
                cacheHit: false,
              },
            },
          }),
          { status: 200 },
        ),
      ),
    );
    render(<ContextComparison submissionId="submission-9" />);
    fireEvent.click(screen.getByRole('button', { name: 'Compare contexts' }));
    expect(await screen.findByText(/Focused Context \(Optimized\)/i)).toBeTruthy();
    expect(screen.getByText(/Broader Context \(Baseline\)/i)).toBeTruthy();
    expect(screen.getByText(/54% token reduction/i)).toBeTruthy();
    expect(screen.getByText(/advisory suggestions/i)).toBeTruthy();
    expect(screen.getByText('120 estimated input tokens · cache')).toBeTruthy();
    expect(
      screen.getByText('260 estimated input tokens · provider'),
    ).toBeTruthy();
    expect(screen.getByText('Focused feedback')).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith(
      '/api/ai/context-comparison',
      expect.objectContaining({
        body: JSON.stringify({ submissionId: 'submission-9' }),
      }),
    );
  }, 10000);

  it('reports server and network failures in an accessible status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: { message: 'Context comparison unavailable.' },
          }),
          { status: 503 },
        ),
      ),
    );
    render(<ContextComparison submissionId="submission-10" />);
    fireEvent.click(screen.getByRole('button', { name: 'Compare contexts' }));
    expect((await screen.findByRole('status')).textContent).toBe(
      'Context comparison unavailable.',
    );
  });
});
