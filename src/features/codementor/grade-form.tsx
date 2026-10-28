'use client';

import { useState, type FormEvent } from 'react';

type Criterion = { id: string; title: string; maxScore: number };
type Grade = {
  id: string;
  scores: Record<string, number>;
  feedback: string;
  total_score: number | null;
  published_at: string | null;
  version: number;
};

async function saveGrade(
  submissionId: string,
  payload: {
    scores: Record<string, number>;
    feedback: string;
    totalScore: number;
    publish: boolean;
    expectedVersion: number;
  },
) {
  const response = await fetch(`/api/grades/${submissionId}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = (await response.json()) as {
    error?: { message?: string };
    grade: { version: number };
  };
  if (!response.ok)
    throw new Error(data.error?.message ?? 'Grade could not be saved.');
  return data.grade.version;
}

function GradeInputs({
  criteria,
  scores,
  onScoreChange,
  feedback,
  onFeedbackChange,
  publish,
  onPublishChange,
}: {
  criteria: Criterion[];
  scores: Record<string, string>;
  onScoreChange: (id: string, value: string) => void;
  feedback: string;
  onFeedbackChange: (value: string) => void;
  publish: boolean;
  onPublishChange: (value: boolean) => void;
}) {
  return (
    <>
      {criteria.map((criterion) => (
        <label
          key={criterion.id}
          className="flex items-center justify-between gap-4 text-sm"
        >
          {criterion.title} (/{criterion.maxScore})
          <input
            type="number"
            min={0}
            max={criterion.maxScore}
            step="0.5"
            value={scores[criterion.id]}
            onChange={(event) =>
              onScoreChange(criterion.id, event.target.value)
            }
            className="w-24 rounded-md border bg-background px-3 py-2"
          />
        </label>
      ))}
      <label className="block space-y-2 text-sm">
        Feedback
        <textarea
          value={feedback}
          maxLength={4000}
          onChange={(event) => onFeedbackChange(event.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2"
          rows={4}
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={publish}
          onChange={(event) => onPublishChange(event.target.checked)}
        />
        Publish this grade to the student
      </label>
    </>
  );
}

function GradeStatus({ message }: { message: string }) {
  return message ? (
    <p role="status" className="text-sm text-muted-foreground">
      {message}
    </p>
  ) : null;
}

function SaveGradeButton({
  busy,
  publish,
}: {
  busy: boolean;
  publish: boolean;
}) {
  return (
    <button
      disabled={busy}
      className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60"
    >
      {busy ? 'Saving…' : publish ? 'Save and publish' : 'Save draft'}
    </button>
  );
}

export function GradeForm({
  submissionId,
  criteria,
  grade,
}: {
  submissionId: string;
  criteria: Criterion[];
  grade: Grade | null;
}) {
  const [scores, setScores] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      criteria.map((item) => [item.id, String(grade?.scores[item.id] ?? 0)]),
    ),
  );
  const [feedback, setFeedback] = useState(grade?.feedback ?? '');
  const [publish, setPublish] = useState(Boolean(grade?.published_at));
  const [version, setVersion] = useState(grade?.version ?? 0);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const total = criteria.reduce(
    (sum, item) => sum + Number(scores[item.id] || 0),
    0,
  );
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const savedVersion = await saveGrade(submissionId, {
        scores: Object.fromEntries(
          criteria.map((item) => [item.id, Number(scores[item.id])]),
        ),
        feedback,
        totalScore: total,
        publish,
        expectedVersion: version,
      });
      setVersion(savedVersion);
      setMessage(publish ? 'Grade saved and published.' : 'Grade draft saved.');
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Grade could not be saved.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border bg-card p-5">
      <div>
        <h2 className="font-semibold">Instructor grade</h2>
        <p className="text-sm text-muted-foreground">
          AI suggestions do not change grades. Publishing is an explicit
          instructor action.
        </p>
      </div>
      <GradeInputs
        criteria={criteria}
        scores={scores}
        onScoreChange={(id, value) =>
          setScores((current) => ({ ...current, [id]: value }))
        }
        feedback={feedback}
        onFeedbackChange={setFeedback}
        publish={publish}
        onPublishChange={setPublish}
      />
      <p className="text-sm font-medium">Total: {total}</p>
      <GradeStatus message={message} />
      <SaveGradeButton busy={busy} publish={publish} />
    </form>
  );
}
