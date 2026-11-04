'use client';

import { PendingButton } from '@/components/ui/pending-button';

import { useForumPost } from './use-forum-post';

export function ForumForm({
  courseId,
  threadId,
}: {
  courseId: string;
  threadId?: string;
}) {
  const { submit, busy, error, edited } = useForumPost({ courseId, threadId });
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submit(event.currentTarget);
      }}
      onChange={edited}
      className="space-y-4"
    >
      {!threadId && (
        <label className="block space-y-2 text-sm font-medium">
          <span>Title</span>
          <input
            name="title"
            required
            maxLength={160}
            disabled={busy}
            className="w-full rounded-md border bg-background px-3 py-2"
            placeholder="What would you like to discuss?"
          />
        </label>
      )}
      <label className="block space-y-2 text-sm font-medium">
        <span>{threadId ? 'Your reply' : 'Message'}</span>
        <textarea
          name="body"
          required
          maxLength={8000}
          rows={threadId ? 5 : 8}
          disabled={busy}
          className="w-full resize-y rounded-md border bg-background px-3 py-2 font-normal leading-6"
          placeholder="Share a question or an idea…"
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
      <PendingButton
        pending={busy}
        disabled={busy}
        className="rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-60"
      >
        {busy ? 'Posting…' : threadId ? 'Post reply' : 'Create discussion'}
      </PendingButton>
    </form>
  );
}
