import Link from 'next/link';

export default function GradesNotFound() {
  return (
    <section className="space-y-4 rounded-xl border bg-card p-8">
      <h1 className="text-2xl font-semibold">Grades page unavailable</h1>
      <p className="text-sm text-muted-foreground">
        Check your filters or return to your latest grades.
      </p>
      <Link href="/student/grades" className="text-sm font-medium underline">
        Back to My grades
      </Link>
    </section>
  );
}
