'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { installUnsavedCodeGuard } from './unsaved-code-guard';

const subscribeReady = () => () => undefined;
const clientReady = () => true;
const serverReady = () => false;

export function useSubmissionDraft(initialSource = '') {
  const ready = useSyncExternalStore(subscribeReady, clientReady, serverReady);
  const [source, setSource] = useState(initialSource);
  const [savedSource, setSavedSource] = useState(initialSource);
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

  return { source, setSource, dirty, ready, submissionAttempt, acknowledge };
}
