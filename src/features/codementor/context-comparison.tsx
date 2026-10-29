'use client';

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

export function ContextComparison({ submissionId }: { submissionId: string }) {
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function compare() {
    setBusy(true);
    setMessage('');
    setComparison(null);
    try {
      const response = await fetch('/api/ai/context-comparison', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ submissionId }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error?.message ?? 'Comparison failed.');
      setComparison(data.comparison);
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
        <button
          disabled={busy}
          onClick={compare}
          className="rounded-md border px-3 py-2 text-sm disabled:opacity-60"
        >
          {busy ? 'Comparing…' : 'Compare contexts'}
        </button>
      </div>
      {message && (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      )}
      {comparison && (
        <div className="grid gap-4 md:grid-cols-2">
          <ComparisonResult
            label="Focused context"
            item={comparison.optimized}
          />
          <ComparisonResult
            label="Broader authorized context"
            item={comparison.broader}
          />
        </div>
      )}
    </section>
  );
}

function ComparisonResult({ label, item }: { label: string; item: Result }) {
  return (
    <article className="space-y-3 rounded-lg border p-4">
      <div className="flex justify-between gap-3">
        <h3 className="font-medium">{label}</h3>
        <span className="text-xs text-muted-foreground">
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
