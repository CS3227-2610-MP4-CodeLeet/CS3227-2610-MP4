'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AssignmentPractice } from '@/features/student-submissions/assignment-practice';
import type { PracticeCase } from '@/features/student-submissions/practice-tests';
import { CodeEditor } from '@/features/student-submissions/code-editor';
import { useSubmissionDraft } from '@/features/student-submissions/use-submission-draft';
import {
  languageLabels,
  type AssignmentLanguage,
} from '@/features/student-assignments/types';

type SubmissionFormProps = {
  assignmentId: string;
  language: AssignmentLanguage;
  browserRunnerOrigin?: string | null;
  testExamples?: readonly PracticeCase[] | null;
  initialSource?: string;
  editingRevision?: number;
};

function DraftStatus({ dirty }: { dirty: boolean }) {
  return (
    <p role="status" className="text-sm text-muted-foreground">
      {dirty ? 'Unsaved changes' : 'No unsaved changes'}
    </p>
  );
}

function SubmissionFooter({
  busy,
  disabled,
  message,
}: {
  busy: boolean;
  disabled: boolean;
  message: string;
}) {
  return (
    <footer className="space-y-3 border-t pt-5">
      <button
        type="submit"
        disabled={disabled}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {busy ? 'Saving…' : 'Submit revision'}
      </button>
      {message && (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      )}
    </footer>
  );
}

export function SubmissionForm({
  assignmentId,
  language,
  browserRunnerOrigin = null,
  testExamples = null,
  initialSource = '',
  editingRevision,
}: SubmissionFormProps) {
  const router = useRouter();
  const { source, setSource, dirty, ready, submissionAttempt, acknowledge } =
    useSubmissionDraft(initialSource);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const submitted = submissionAttempt();
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ assignmentId, ...submitted }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error?.message ?? 'Submission failed.');
      setMessage(`Saved revision ${result.submission.revision}.`);
      acknowledge(submitted.source);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Submission failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="space-y-3 rounded-xl border bg-card p-5" onSubmit={submit}>
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-semibold">{languageLabels[language]} submission</h2>
        <span className="text-xs text-muted-foreground">
          {source.length.toLocaleString()} / 8,000 characters
        </span>
      </div>
      {editingRevision !== undefined && (
        <p className="text-sm text-muted-foreground">
          Editing revision {editingRevision}
        </p>
      )}
      <CodeEditor
        disabled={!ready}
        language={language}
        source={source}
        onChange={setSource}
        maxLength={8_000}
        rows={18}
      />
      <DraftStatus dirty={dirty} />
      <AssignmentPractice
        runnerOrigin={browserRunnerOrigin}
        source={source}
        language={language}
        examples={testExamples}
      />
      <SubmissionFooter
        busy={busy}
        disabled={!ready || busy || !source.trim()}
        message={message}
      />
    </form>
  );
}
