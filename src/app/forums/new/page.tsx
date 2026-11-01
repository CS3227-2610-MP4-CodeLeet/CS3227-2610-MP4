import Link from 'next/link';
import { requireForumMember } from '@/features/forums/access.server';
import { ForumForm } from '@/features/forums/forum-form';

export default async function NewDiscussionPage() {
  await requireForumMember();
  return (
    <>
      <Link
        href="/forums"
        className="text-sm text-cyan-800 underline dark:text-cyan-300"
      >
        Back to forums
      </Link>
      <section className="space-y-5 rounded-xl border bg-background p-5 sm:p-6">
        <h1 className="text-2xl font-semibold">New discussion</h1>
        <ForumForm />
      </section>
    </>
  );
}
