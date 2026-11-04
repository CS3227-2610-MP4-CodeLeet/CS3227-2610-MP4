'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

function useCourseSubmission(path: string) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(body: unknown) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = (await response.json()) as {
        courseId?: string;
        error?: { message?: string };
      };
      if (!response.ok || !result.courseId)
        throw new Error(
          result.error?.message ?? 'Course request failed. Try again.',
        );
      router.push(`/courses/${result.courseId}`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Course request failed. Try again.',
      );
    } finally {
      setBusy(false);
    }
  }
  return { error, busy, submit };
}

export function CourseCreateForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const { error, busy, submit } = useCourseSubmission('/api/courses');

  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit({ title, description });
  }

  return (
    <form onSubmit={create} className="space-y-4 rounded-xl border p-5">
      <div>
        <h2 className="text-xl font-semibold">Create a course</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          You will own the new course.
        </p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
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
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Create course
      </button>
    </form>
  );
}

export function CourseJoinForm() {
  const [code, setCode] = useState('');
  const { error, busy, submit } = useCourseSubmission('/api/courses/join');

  function join(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit({ code: code.trim() });
  }

  return (
    <form onSubmit={join} className="space-y-4 rounded-xl border p-5">
      <div>
        <h2 className="text-xl font-semibold">Join a course</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the active student join code from your instructor.
        </p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <label className="block space-y-1 text-sm font-medium">
        <span>Join code</span>
        <input
          required
          minLength={20}
          maxLength={128}
          autoComplete="off"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2"
        />
      </label>
      <button
        disabled={busy}
        className="rounded-md border px-4 py-2 text-sm font-medium"
      >
        Join course
      </button>
    </form>
  );
}
