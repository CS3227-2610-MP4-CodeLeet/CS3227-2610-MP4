'use client';

import { useState } from 'react';
import type { AssignmentLanguage } from '@/features/student-assignments/types';
import type { PracticeCase } from './practice-tests';
import { PracticeRunner } from './practice-runner';

export function AssignmentPractice({
  runnerOrigin,
  language,
  source,
  examples,
}: {
  runnerOrigin: string | null;
  language: AssignmentLanguage;
  source: string;
  examples: readonly PracticeCase[] | null;
}) {
  const [useExamples, setUseExamples] = useState(false);
  if (!runnerOrigin)
    return (
      <p className="text-sm text-muted-foreground">
        Browser code execution is not configured for this deployment.
      </p>
    );
  return (
    <PracticeRunner
      runnerOrigin={runnerOrigin}
      key={useExamples ? 'examples' : 'custom'}
      language={language}
      source={source}
      cases={useExamples ? (examples ?? []) : []}
      caseKind={useExamples ? 'examples' : 'published'}
      beforeCases={
        examples && (
          <div className="space-y-2 rounded-md border bg-muted/30 p-3 text-sm">
            <label className="flex items-center gap-2 font-medium">
              <input
                type="checkbox"
                checked={useExamples}
                onChange={(event) => setUseExamples(event.target.checked)}
                aria-describedby="example-tests-description"
                className="size-4 accent-cyan-700"
              />
              Use example test cases
            </label>
            <div
              id="example-tests-description"
              className="space-y-1 text-xs text-muted-foreground"
            >
              <p>Read two integers from standard input and print their sum.</p>
              <p>These examples are not your assignment’s tests.</p>
            </div>
          </div>
        )
      }
    />
  );
}
