'use client';

import { useState, type FormEvent } from 'react';

export function SubmissionForm({ assignmentId }: { assignmentId: string }) {
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
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Submission failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="space-y-3 rounded-xl border bg-card p-5" onSubmit={submit}>
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-semibold">Python submission</h2>
        <span className="text-xs text-muted-foreground">
          {source.length.toLocaleString()} / 8,000 characters
        </span>
      </div>
      <textarea
        value={source}
        onChange={(event) => setSource(event.target.value)}
        maxLength={8_000}
        required
        rows={18}
        spellCheck={false}
        aria-label="Python source code"
        className="w-full resize-y rounded-md border bg-background p-3 font-mono text-sm"
      />
      <p className="text-sm text-muted-foreground">
        Submissions are stored for static educational feedback. This form does
        not run code.
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
    </form>
  );
}
