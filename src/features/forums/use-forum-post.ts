'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { forumInput } from './contracts';

export function useForumPost({
  courseId,
  threadId,
}: {
  courseId: string;
  threadId?: string;
}) {
  const router = useRouter();
  const requestId = useRef<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  function edited() {
    requestId.current = null;
  }

  async function submit(form: HTMLFormElement) {
    const fields = new FormData(form);
    requestId.current ??= crypto.randomUUID();
    const input = forumInput.safeParse({
      courseId,
      ...(threadId ? { threadId } : { title: fields.get('title') }),
      body: fields.get('body'),
      requestId: requestId.current,
    });
    if (!input.success) {
      setError('Check the title and message lengths.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/forums/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input.data),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(
          response.status === 401
            ? 'Please sign in again before posting.'
            : (result.error?.message ??
                'Your post could not be saved. Try again.'),
        );
        return;
      }
      requestId.current = null;
      form.reset();
      router.push(`/courses/${courseId}/forums/${result.post.threadId}`);
      router.refresh();
    } catch {
      setError(
        'Your post could not be saved. Check your connection and try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  return { submit, busy, error, edited };
}
