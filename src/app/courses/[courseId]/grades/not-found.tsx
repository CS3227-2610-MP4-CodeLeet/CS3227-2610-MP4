import Link from 'next/link';

export default function GradesNotFound() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <section className="space-y-4 rounded-xl border bg-card p-8">
        <h1 className="text-2xl font-semibold">Grades page unavailable</h1>
        <p className="text-sm text-muted-foreground">
          Choose a course to view its grades.
        </p>
        <Link href="/courses" className="text-sm font-medium underline">
          Choose a course
        </Link>
      </section>
    </main>
  );
}
