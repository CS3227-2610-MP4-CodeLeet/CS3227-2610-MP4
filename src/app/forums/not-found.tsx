import Link from 'next/link';
export default function DiscussionNotFound() {
  return (
    <section className="space-y-3 rounded-xl border bg-background p-6">
      <h1 className="text-xl font-semibold">Discussion unavailable</h1>
      <p className="text-sm text-muted-foreground">
        This discussion or page could not be found.
      </p>
      <Link href="/courses" className="text-sm underline">
        Choose a course
      </Link>
    </section>
  );
}
