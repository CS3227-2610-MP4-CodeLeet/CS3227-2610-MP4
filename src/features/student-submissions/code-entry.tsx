'use client';

import { useRef, useState } from 'react';
import type { AssignmentLanguage } from '@/features/student-assignments/types';
import { languageLabels } from '@/features/student-assignments/types';
import { MAX_SOURCE_BYTES, validateSource } from './source-validation';
import { PracticeRunner } from './practice-runner';
import type { PracticeCase } from './practice-tests';

export function CodeEntry({
  language,
  practiceCases,
}: {
  language: AssignmentLanguage;
  practiceCases?: readonly PracticeCase[];
}) {
  const [source, setSource] = useState('');
  const [checked, setChecked] = useState(false);
  const editor = useRef<HTMLTextAreaElement>(null);
  const validation = validateSource(source);
  const showError = Boolean(
    validation.error && (checked || validation.byteLength > MAX_SOURCE_BYTES),
  );

  return (
    <section
      aria-labelledby="code-entry-heading"
      className="min-w-0 space-y-5 rounded-xl border bg-card p-6 sm:p-8"
    >
      <header className="space-y-2">
        <h2 id="code-entry-heading" className="text-xl font-semibold">
          Your code
        </h2>
        <p className="text-sm text-muted-foreground">
          Language: {languageLabels[language]} · fixed for this assignment
        </p>
      </header>
      <p
        id="submission-preview-note"
        className="text-sm leading-relaxed text-muted-foreground"
      >
        Submission is not connected yet. Code is not saved.{' '}
        {practiceCases
          ? 'Run code or published tests for browser-only practice.'
          : 'Execution is not enabled.'}{' '}
        Leaving or refreshing the page clears it.
      </p>
      <div className="space-y-2">
        <label htmlFor="source-code" className="block text-sm font-medium">
          {languageLabels[language]} source code
        </label>
        <textarea
          ref={editor}
          id="source-code"
          rows={14}
          value={source}
          onChange={(event) => setSource(event.target.value)}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          wrap="off"
          aria-invalid={showError}
          aria-describedby={`source-size submission-preview-note${showError ? ' source-error' : ''}`}
          className="block min-h-72 w-full min-w-0 max-w-full resize-y rounded-md border bg-background p-4 font-mono text-sm leading-6 outline-none focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive"
        />
        <p
          id="source-size"
          aria-live="polite"
          className={`text-sm ${validation.byteLength > MAX_SOURCE_BYTES ? 'text-destructive' : 'text-muted-foreground'}`}
        >
          {validation.byteLength.toLocaleString('en-US')} /{' '}
          {MAX_SOURCE_BYTES.toLocaleString('en-US')} UTF-8 bytes (32 KiB limit)
        </p>
        {showError && (
          <p
            id="source-error"
            role="alert"
            className="text-sm text-destructive"
          >
            {validation.error}
          </p>
        )}
        {checked && !validation.error && (
          <p role="status" className="text-sm text-muted-foreground">
            Code meets the local input rules. This check does not execute or
            submit code.
          </p>
        )}
      </div>
      {practiceCases && (
        <PracticeRunner
          language={language}
          source={source}
          cases={practiceCases}
        />
      )}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            setChecked(true);
            if (validation.error) editor.current?.focus();
          }}
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Check code
        </button>
        <button
          type="button"
          disabled
          aria-describedby="submission-preview-note"
          className="cursor-not-allowed rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground opacity-50"
        >
          Submit code
        </button>
      </div>
    </section>
  );
}
