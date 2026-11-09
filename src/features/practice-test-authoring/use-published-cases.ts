'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { AuthoredCase } from './contracts';
import { fetchInstructorPreviewCases, fetchPublicCases } from './public-client';

export function usePublishedCases(assignmentId?: string, previewMode = false) {
  const [cases, setCases] = useState<AuthoredCase[]>([]);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const generation = useRef(0);
  const invalidate = useCallback(() => {
    generation.current++;
  }, []);
  const refresh = useCallback(
    async (signal?: AbortSignal) => {
      if (!assignmentId) return [];
      const request = ++generation.current;
      try {
        const fetcher = previewMode
          ? fetchInstructorPreviewCases
          : fetchPublicCases;
        const data = await fetcher(assignmentId, signal);
        if (signal?.aborted || request !== generation.current)
          return data.cases;
        setCases(data.cases);
        setError('');
        setReady(true);
        return data.cases;
      } catch (cause) {
        if (!signal?.aborted && request === generation.current) {
          setCases([]);
          setError('Published tests could not be loaded. Try again.');
          setReady(true);
        }
        throw cause;
      }
    },
    [assignmentId, previewMode],
  );
  useEffect(() => {
    if (!assignmentId) return;
    const controller = new AbortController();
    void Promise.resolve()
      .then(() => refresh(controller.signal))
      .catch(() => {});
    return () => {
      invalidate();
      controller.abort();
    };
  }, [assignmentId, refresh, invalidate]);
  return { cases, error, ready, refresh };
}
