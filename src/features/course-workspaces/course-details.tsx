'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { CourseWorkspaceRecord } from './contracts';
import { courseRequest, messageFor } from './course-request';

export function CourseDetails({ course }: { course: CourseWorkspaceRecord }) {
  const router = useRouter();
  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      await courseRequest(`/api/courses/${course.id}`, 'PATCH', {
        title,
        description,
      });
      setSaved(true);
      router.refresh();
    } catch (requestError) {
      setError(messageFor(requestError, 'Course details could not be saved.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-4 rounded-xl border p-5">
      <h2 className="text-xl font-semibold">Course details</h2>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="text-sm">
          Course details saved.
        </p>
      )}
      <label className="block space-y-1 text-sm font-medium">
        <span>Course title</span>
        <input
          required
          maxLength={120}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2"
        />
      </label>
      <label className="block space-y-1 text-sm font-medium">
        <span>Description</span>
        <textarea
          maxLength={4000}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="min-h-24 w-full rounded-md border bg-background px-3 py-2"
        />
      </label>
      <button
        disabled={busy}
        className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
      >
        Save details
      </button>
    </form>
  );
}
