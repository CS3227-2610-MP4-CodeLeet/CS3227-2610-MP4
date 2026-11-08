'use client';

import { PendingButton } from '@/components/ui/pending-button';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AssignmentPractice } from '@/features/student-submissions/assignment-practice';
import type { PracticeCase } from '@/features/student-submissions/practice-tests';
import { CodeEditor } from '@/features/student-submissions/code-editor';
import { useSubmissionDraft } from '@/features/student-submissions/use-submission-draft';
import { DraftRecovery } from '@/features/student-submissions/draft-recovery';
import type { DraftContext } from '@/features/student-submissions/draft-storage';
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
  draftContext?: DraftContext;
  previewMode?: boolean;
};

function DraftStatus({ dirty }: { dirty: boolean }) {
  return (
    <p role="status" className="text-sm text-muted-foreground">
      {dirty ? 'Unsaved changes' : 'No unsaved changes'}
    </p>
  );
}

function SubmissionEditor({
  language,
  editingRevision,
  draft,
  recover,
}: {
  language: AssignmentLanguage;
  editingRevision?: number;
  draft: ReturnType<typeof useSubmissionDraft>;
  recover: boolean;
}) {
  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-semibold">{languageLabels[language]} submission</h2>
        <span className="text-xs text-muted-foreground">
          {draft.source.length.toLocaleString()} / 8,000 characters
        </span>
      </div>
      {editingRevision !== undefined && (
        <p className="text-sm text-muted-foreground">
          Editing revision {editingRevision}
        </p>
      )}
      {recover && <DraftRecovery {...draft.browserDraft} />}
      <CodeEditor
        disabled={!draft.ready}
        language={language}
        source={draft.source}
        onChange={draft.setSource}
        maxLength={8_000}
        rows={18}
      />
      <DraftStatus dirty={draft.dirty} />
    </>
  );
}

function SubmissionFooter({
  busy,
  disabled,
  message,
  previewMode = false,
}: {
  busy: boolean;
  disabled: boolean;
  message: string;
  previewMode?: boolean;
}) {
  return (
    <footer className="space-y-3 border-t pt-5">
      {previewMode ? (
        <div className="flex flex-wrap items-center gap-3">
          <PendingButton
            pending={false}
            type="button"
            disabled={true}
            className="cursor-not-allowed rounded-md bg-muted px-4 py-2 text-sm font-medium text-muted-foreground opacity-60"
          >
            Submit revision
          </PendingButton>
          <span className="text-xs text-muted-foreground">
            Submissions disabled in preview mode
          </span>
        </div>
      ) : (
        <PendingButton
          pending={busy}
          type="submit"
          disabled={disabled}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Submit revision'}
        </PendingButton>
      )}
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
  draftContext,
  previewMode = false,
}: SubmissionFormProps) {
  const router = useRouter();
  const draft = useSubmissionDraft(initialSource, draftContext);
  const { source, ready, submissionAttempt, acknowledge } = draft;
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (previewMode || busy || !ready) return;
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
      <SubmissionEditor
        language={language}
        editingRevision={editingRevision}
        draft={draft}
        recover={!!draftContext}
      />
      <AssignmentPractice
        assignmentId={assignmentId}
        runnerOrigin={browserRunnerOrigin}
        source={source}
        language={language}
        examples={testExamples}
        previewMode={previewMode}
      />
      <SubmissionFooter
        busy={busy}
        disabled={!ready || busy || !source.trim()}
        message={message}
        previewMode={previewMode}
      />
    </form>
  );
}
