'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AssignmentPractice } from '@/features/student-submissions/assignment-practice';
import type { PracticeCase } from '@/features/student-submissions/practice-tests';
import { CodeEditor } from '@/features/student-submissions/code-editor';
import {
  languageLabels,
  type AssignmentLanguage,
} from '@/features/student-assignments/types';

type SubmissionFormProps = {
  assignmentId: string;
  language: AssignmentLanguage;
  browserRunEnabled?: boolean;
  testExamples?: readonly PracticeCase[] | null;
};

export function SubmissionForm({
  assignmentId,
  language,
  browserRunEnabled = false,
  testExamples = null,
}: SubmissionFormProps) {
  const router = useRouter();
  const [source, setSource] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ assignmentId, source, requestId }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error?.message ?? 'Submission failed.');
      setMessage(`Saved revision ${result.submission.revision}.`);
      setRequestId(crypto.randomUUID());
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
      <CodeEditor
        language={language}
        source={source}
        onChange={setSource}
        maxLength={8_000}
        rows={18}
      />
      <p className="text-sm text-muted-foreground">
        Submit saves a revision for feedback. Practice runs stay in your browser
        and do not determine your grade.
      </p>
      {message && (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      )}
      <button
        disabled={busy || !source.trim()}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {busy ? 'Saving…' : 'Submit revision'}
      </button>
      <AssignmentPractice
        enabled={browserRunEnabled}
        source={source}
        language={language}
        examples={testExamples}
      />
    </form>
  );
}
