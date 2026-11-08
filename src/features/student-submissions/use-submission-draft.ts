'use client';

import { useEffect, useRef } from 'react';
import { installUnsavedCodeGuard } from './unsaved-code-guard';
import { useBrowserDraft } from './use-browser-draft';
import type { DraftContext } from './draft-storage';

export function useSubmissionDraft(initialSource = '', context?: DraftContext) {
  const browserDraft = useBrowserDraft(initialSource, context);
  const { source, setSource, dirty } = browserDraft;
  const ready = !['loading', 'recover', 'stopped'].includes(
    browserDraft.status,
  );
  const attempt = useRef<{ source: string; requestId: string } | null>(null);

  useEffect(() => {
    if (dirty) return installUnsavedCodeGuard();
  }, [dirty]);

  function submissionAttempt() {
    if (!attempt.current || attempt.current.source !== source) {
      attempt.current = { source, requestId: crypto.randomUUID() };
    }
    return attempt.current;
  }

  function acknowledge(submittedSource: string) {
    browserDraft.acknowledge(submittedSource);
    attempt.current = null;
  }

  return {
    source,
    setSource,
    dirty,
    ready,
    submissionAttempt,
    acknowledge,
    browserDraft,
  };
}
