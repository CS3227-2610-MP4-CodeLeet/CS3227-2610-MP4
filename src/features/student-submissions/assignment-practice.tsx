'use client';
import { useState } from 'react';
import type { AssignmentLanguage } from '@/features/student-assignments/types';
import type { PracticeCase } from './practice-tests';
import { PracticeRunner } from './practice-runner';
import { usePublishedCases } from '@/features/practice-test-authoring/use-published-cases';
import {
  PublishedCasesControls,
  ExampleCaseToggle,
} from '@/features/practice-test-authoring/student-controls';

type Props = {
  runnerOrigin: string | null;
  language: AssignmentLanguage;
  source: string;
  examples: readonly PracticeCase[] | null;
  assignmentId?: string;
  previewMode?: boolean;
};
function PracticeControls({
  assignmentId,
  published,
  allowExamples,
  hasExamples,
  useExamples,
  onToggleExamples,
  busy,
}: {
  assignmentId?: string;
  published: ReturnType<typeof usePublishedCases>;
  allowExamples: boolean;
  hasExamples: boolean;
  useExamples: boolean;
  onToggleExamples: (val: boolean) => void;
  busy: boolean;
}) {
  return (
    <>
      {assignmentId && <PublishedCasesControls state={published} busy={busy} />}
      {hasExamples && allowExamples && (
        <ExampleCaseToggle checked={useExamples} onChange={onToggleExamples} />
      )}
    </>
  );
}

function resolvePracticeCases(
  showingExamples: boolean,
  examples: readonly PracticeCase[] | null,
  publishedCases: readonly PracticeCase[],
) {
  if (showingExamples) {
    return examples ?? [];
  }
  return publishedCases;
}

function resolveRefreshHandler(
  assignmentId: string | undefined,
  showingExamples: boolean,
  refresh: () => Promise<unknown>,
) {
  if (assignmentId && !showingExamples) {
    return refresh;
  }
  return undefined;
}

export function AssignmentPractice({
  runnerOrigin,
  language,
  source,
  examples,
  assignmentId,
  previewMode = false,
}: Props) {
  const [useExamples, setUseExamples] = useState(false);
  const published = usePublishedCases(assignmentId, previewMode);
  const ready = canShowCases(published, assignmentId);
  const allowExamples = ready && published.cases.length === 0;
  const showingExamples = useExamples && allowExamples;
  if (!runnerOrigin)
    return (
      <p className="text-sm text-muted-foreground">
        Code runner is unavailable.
      </p>
    );
  const activeCases = resolvePracticeCases(
    showingExamples,
    examples,
    published.cases,
  );
  const refreshHandler = resolveRefreshHandler(
    assignmentId,
    showingExamples,
    published.refresh,
  );
  const caseKind = showingExamples ? 'examples' : 'published';

  return (
    <PracticeRunner
      runnerOrigin={runnerOrigin}
      key={caseKind}
      language={language}
      source={source}
      cases={activeCases}
      casesReady={ready}
      loadCases={refreshHandler}
      caseKind={caseKind}
      beforeCases={(busy) => (
        <PracticeControls
          assignmentId={assignmentId}
          published={published}
          allowExamples={allowExamples}
          hasExamples={Boolean(examples)}
          useExamples={useExamples}
          onToggleExamples={setUseExamples}
          busy={busy}
        />
      )}
    />
  );
}
function canShowCases(
  published: ReturnType<typeof usePublishedCases>,
  id?: string,
) {
  if (!id) return true;
  return published.ready && !published.error;
}
