'use client';

import { PendingButton } from '@/components/ui/pending-button';
import { useState } from 'react';

type Result = {
  result: {
    criteria: Array<{
      criterionId: string;
      suggestedScore: number;
      feedback: string;
    }>;
    overallFeedback: string;
    totalScore: number;
  };
  inputTokens: number;
  cacheHit: boolean;
};

type Comparison = { optimized: Result; broader: Result };

async function executeComparison(submissionId: string) {
  const response = await fetch('/api/ai/context-comparison', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ submissionId }),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error?.message ?? 'Comparison failed.');
  return data.comparison as Comparison;
}

function calculateTokenSavings(comparison: Comparison | null): number {
  if (!comparison || comparison.broader.inputTokens <= 0) return 0;
  return Math.max(
    0,
    Math.round(
      ((comparison.broader.inputTokens - comparison.optimized.inputTokens) /
        comparison.broader.inputTokens) *
        100,
    ),
  );
}

export function ContextComparison({ submissionId }: { submissionId: string }) {
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function compare() {
    setBusy(true);
    setMessage('');
    setComparison(null);
    try {
      const result = await executeComparison(submissionId);
      setComparison(result);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Comparison failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4 rounded-xl border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold">Context strategy comparison</h2>
          <p className="text-sm text-muted-foreground">
            Runs focused and broader owner-authorized contexts. Each uncached
            model run uses one instructor quota slot.
          </p>
        </div>
        <PendingButton
          pending={busy}
          disabled={busy}
          onClick={compare}
          className="rounded-md border px-3 py-2 text-sm disabled:opacity-60"
        >
          {busy ? 'Comparing…' : 'Compare contexts'}
        </PendingButton>
      </div>

      {message && (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      )}

      {comparison && <ComparisonResultsView comparison={comparison} />}
    </section>
  );
}

function ComparisonResultsView({ comparison }: { comparison: Comparison }) {
  const tokenSavingsPercent = calculateTokenSavings(comparison);

  return (
    <div className="space-y-4">
      <ComparisonSummary
        tokenSavingsPercent={tokenSavingsPercent}
        optimizedTokens={comparison.optimized.inputTokens}
        broaderTokens={comparison.broader.inputTokens}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <ComparisonResult
          label="Focused Context (Optimized)"
          description="Curated prompt containing only assignment instructions, rubric criteria, and student source code."
          item={comparison.optimized}
        />
        <ComparisonResult
          label="Broader Context (Baseline)"
          description="Expanded prompt containing ambient metadata, timestamps, and submission lifecycle details."
          item={comparison.broader}
        />
      </div>

      <ComparisonAdvisory />
    </div>
  );
}

function ComparisonSummary({
  tokenSavingsPercent,
  optimizedTokens,
  broaderTokens,
}: {
  tokenSavingsPercent: number;
  optimizedTokens: number;
  broaderTokens: number;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
      <div className="flex items-center gap-2">
        <span className="font-semibold">
          {tokenSavingsPercent}% token reduction
        </span>
        <span className="text-muted-foreground">
          ({optimizedTokens.toLocaleString()} vs {broaderTokens.toLocaleString()}{' '}
          tokens)
        </span>
      </div>
      <span className="text-xs text-muted-foreground">
        Context engineering saves bandwidth &amp; cost
      </span>
    </div>
  );
}

function ComparisonAdvisory() {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
      <strong>Advisory:</strong> AI-generated evaluations and scores are
      advisory suggestions for instructor review. They do not alter student
      grades or publish results without explicit instructor grading.
    </div>
  );
}

function ComparisonResult({
  label,
  description,
  item,
}: {
  label: string;
  description: string;
  item: Result;
}) {
  return (
    <article className="space-y-3 rounded-lg border p-4">
      <div className="flex justify-between gap-3">
        <div>
          <h3 className="font-medium">{label}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {item.inputTokens.toLocaleString()} estimated input tokens ·{' '}
          {item.cacheHit ? 'cache' : 'provider'}
        </span>
      </div>
      <p className="text-sm">Suggested total: {item.result.totalScore}</p>
      <p className="whitespace-pre-wrap text-sm">
        {item.result.overallFeedback}
      </p>
      <ul className="space-y-2 text-sm">
        {item.result.criteria.map((criterion) => (
          <li key={criterion.criterionId}>
            <strong>{criterion.suggestedScore}</strong> {criterion.feedback}
          </li>
        ))}
      </ul>
    </article>
  );
}
