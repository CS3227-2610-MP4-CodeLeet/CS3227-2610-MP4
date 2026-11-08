'use client';

import { useRef, useState } from 'react';
import type { RefObject } from 'react';
import { Code2, FileCode2 } from 'lucide-react';
import type { AssignmentLanguage } from '@/features/student-assignments/types';
import { languageLabels } from '@/features/student-assignments/types';
import { MAX_SOURCE_BYTES, validateSource } from './source-validation';
import { PracticeRunner } from './practice-runner';
import type { PracticeCase } from './practice-tests';
import { CodeEditor } from './code-editor';

type SourceValidation = ReturnType<typeof validateSource>;

function SourceEditor({
  language,
  source,
  validation,
  checked,
  editor,
  onChange,
}: {
  language: AssignmentLanguage;
  source: string;
  validation: SourceValidation;
  checked: boolean;
  editor: RefObject<HTMLTextAreaElement | null>;
  onChange: (source: string) => void;
}) {
  const showError = Boolean(
    validation.error && (checked || validation.byteLength > MAX_SOURCE_BYTES),
  );
  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#182331]">
        <SourceEditorToolbar language={language} />
        <CodeEditor
          language={language}
          source={source}
          onChange={onChange}
          editorRef={editor}
          rows={10}
          invalid={showError}
          describedBy={`source-size submission-preview-note${showError ? ' source-error' : ''}`}
        />
      </div>
      <SourceValidationStatus validation={validation} checked={checked} />
    </div>
  );
}

function SourceEditorToolbar({ language }: { language: AssignmentLanguage }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-[#202e3e] px-4 py-2.5 text-xs text-slate-600 dark:text-slate-300">
      <label htmlFor="source-code" className="inline-flex items-center gap-2">
        <FileCode2
          aria-hidden="true"
          className="size-3.5 text-cyan-700 dark:text-cyan-300"
        />
        <span className="sr-only">{languageLabels[language]} source code</span>
        <span aria-hidden="true">
          {language === 'java' ? 'Main.java' : 'solution.py'}
        </span>
      </label>
      <span>UTF-8</span>
    </div>
  );
}

function SourceValidationStatus({
  validation,
  checked,
}: {
  validation: SourceValidation;
  checked: boolean;
}) {
  const showError = Boolean(
    validation.error && (checked || validation.byteLength > MAX_SOURCE_BYTES),
  );
  return (
    <>
      <p
        id="source-size"
        aria-live="polite"
        className={`text-xs ${validation.byteLength > MAX_SOURCE_BYTES ? 'text-destructive' : 'text-muted-foreground'}`}
      >
        {validation.byteLength.toLocaleString('en-US')} /{' '}
        {MAX_SOURCE_BYTES.toLocaleString('en-US')} UTF-8 bytes (32 KiB limit)
      </p>
      {showError && (
        <p id="source-error" role="alert" className="text-sm text-destructive">
          {validation.error}
        </p>
      )}
      {checked && !validation.error && (
        <p role="status" className="text-sm text-muted-foreground">
          Code meets the local input rules. This check does not execute or
          submit code.
        </p>
      )}
    </>
  );
}

function CodeEntryActions({ onCheck }: { onCheck: () => void }) {
  return (
    <div className="flex flex-wrap justify-between gap-3">
      <button
        type="button"
        onClick={onCheck}
        className="rounded px-1 py-1 text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Check code
      </button>
      <button
        type="button"
        disabled
        aria-describedby="submission-preview-note"
        className="cursor-not-allowed rounded px-1 py-1 text-xs font-medium text-muted-foreground opacity-50"
      >
        Submit code
      </button>
    </div>
  );
}

export function CodeEntry({
  language,
  practiceCases,
  runnerOrigin,
}: {
  language: AssignmentLanguage;
  practiceCases?: readonly PracticeCase[];
  runnerOrigin: string | null;
}) {
  const [source, setSource] = useState('');
  const [checked, setChecked] = useState(false);
  const editor = useRef<HTMLTextAreaElement>(null);
  const validation = validateSource(source);
  const checkSource = () => {
    setChecked(true);
    if (validation.error) editor.current?.focus();
  };
  return (
    <section
      aria-labelledby="code-entry-heading"
      className="min-w-0 overflow-hidden rounded-lg border bg-white dark:bg-slate-900 shadow-sm shadow-slate-200/30 dark:shadow-none"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 sm:px-7">
        <h2
          id="code-entry-heading"
          className="flex items-center gap-2 text-base font-semibold"
        >
          <Code2
            aria-hidden="true"
            className="size-4 text-cyan-700 dark:text-cyan-300"
          />{' '}
          Your code
        </h2>
        <p className="text-xs text-muted-foreground">
          Language: {languageLabels[language]} · fixed for this assignment
        </p>
      </header>
      <div className="space-y-3 px-4 py-4 sm:px-6">
        <p
          id="submission-preview-note"
          className="text-xs leading-5 text-muted-foreground"
        >
          Your code is not saved. Submission is not connected.
        </p>
        <SourceEditor
          language={language}
          source={source}
          validation={validation}
          checked={checked}
          editor={editor}
          onChange={setSource}
        />
        <CodeEntryActions onCheck={checkSource} />
        {practiceCases && runnerOrigin && (
          <PracticeRunner
            runnerOrigin={runnerOrigin}
            language={language}
            source={source}
            cases={practiceCases}
          />
        )}
      </div>
    </section>
  );
}
