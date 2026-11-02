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
};
export function AssignmentPractice({
  runnerOrigin,
  language,
  source,
  examples,
  assignmentId,
}: Props) {
  const [useExamples, setUseExamples] = useState(false);
  const published = usePublishedCases(assignmentId);
  const ready = canShowCases(published, assignmentId);
  const allowExamples = ready && published.cases.length === 0;
  const showingExamples = useExamples && allowExamples;
  if (!runnerOrigin)
    return (
      <p className="text-sm text-muted-foreground">
        Code runner is unavailable.
      </p>
    );
  return (
    <PracticeRunner
      runnerOrigin={runnerOrigin}
      key={showingExamples ? 'examples' : 'custom'}
      language={language}
      source={source}
      cases={showingExamples ? (examples ?? []) : published.cases}
      casesReady={ready}
      loadCases={
        assignmentId && !showingExamples ? published.refresh : undefined
      }
      caseKind={showingExamples ? 'examples' : 'published'}
      beforeCases={(busy) => (
        <>
          {assignmentId && (
            <PublishedCasesControls state={published} busy={busy} />
          )}
          {examples && allowExamples && (
            <ExampleCaseToggle
              checked={useExamples}
              onChange={setUseExamples}
            />
          )}
        </>
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
