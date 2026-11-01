'use client';

import { useEffect, useRef, useState } from 'react';
import { installUnsavedCodeGuard } from './unsaved-code-guard';

export function useSubmissionDraft() {
  const [source, setSource] = useState('');
  const [savedSource, setSavedSource] = useState('');
  const attempt = useRef<{ source: string; requestId: string } | null>(null);
  const dirty = source !== savedSource;

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
    setSavedSource(submittedSource);
    attempt.current = null;
  }

  return { source, setSource, dirty, submissionAttempt, acknowledge };
}
