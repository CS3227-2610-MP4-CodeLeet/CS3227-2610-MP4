'use client';

import { useState } from 'react';

type Feedback = {
  summary: string;
  strengths: string[];
  nextSteps: string[];
  questions: string[];
};
type Evaluation = {
  criteria: Array<{
    criterionId: string;
    suggestedScore: number;
    feedback: string;
  }>;
  overallFeedback: string;
  totalScore: number;
};

export function ReviewButton({
  role,
  submissionId,
}: {
  role: 'student' | 'instructor';
  submissionId: string;
}) {
  const [result, setResult] = useState<Feedback | Evaluation | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function requestReview() {
    setBusy(true);
    setMessage('');
    setResult(null);
    try {
      const endpoint =
        role === 'student'
          ? '/api/ai/student-review'
          : '/api/ai/instructor-review';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ submissionId }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error?.message ?? 'Review failed.');
      setResult(data.result);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Review failed.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-4 rounded-xl border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">
            {role === 'student' ? 'Learning feedback' : 'AI rubric suggestions'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {role === 'student'
              ? 'Hints are for learning and do not affect grades.'
              : 'Suggestions require instructor review and explicit grade publication.'}
          </p>
        </div>
        <button
          onClick={requestReview}
          disabled={busy}
          className="rounded-md border px-3 py-2 text-sm disabled:opacity-60"
        >
          {busy ? 'Reviewing…' : 'Request review'}
        </button>
      </div>
      {message && (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      )}
      {result && <ReviewResult role={role} result={result} />}
    </section>
  );
}

function ReviewResult({
  role,
  result,
}: {
  role: 'student' | 'instructor';
  result: Feedback | Evaluation;
}) {
  if (role === 'student') {
    const feedback = result as Feedback;
    return (
      <div className="space-y-3 border-t pt-4">
        <p className="whitespace-pre-wrap">{feedback.summary}</p>
        <ReviewList title="What is working" items={feedback.strengths} />
        <ReviewList title="Next steps" items={feedback.nextSteps} />
        <ReviewList title="Questions to consider" items={feedback.questions} />
      </div>
    );
  }
  const evaluation = result as Evaluation;
  return (
    <div className="space-y-3 border-t pt-4">
      <p className="whitespace-pre-wrap">
        {evaluation.overallFeedback} Suggested total: {evaluation.totalScore}
      </p>
      <ul className="space-y-2">
        {evaluation.criteria.map((criterion) => (
          <li key={criterion.criterionId} className="rounded-md bg-muted p-3">
            <strong>{criterion.suggestedScore}</strong>
            <span className="ml-2">{criterion.feedback}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReviewList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <h3 className="text-sm font-medium">{title}</h3>
      <ul className="list-disc pl-5 text-sm">
        {items.map((item, index) => (
          <li key={`${title}-${index}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
