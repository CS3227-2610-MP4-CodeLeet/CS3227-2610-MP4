import Link from 'next/link';

export default function AssignmentNotFound() {
  return (
    <section className="space-y-4 rounded-xl border bg-card p-8">
      <h1 className="text-2xl font-semibold">Assignment unavailable</h1>
      <p className="text-muted-foreground">
        This assignment could not be found or is not available.
      </p>
      <Link
        href="/student/assignments"
        className="font-medium underline underline-offset-4"
      >
        Back to assignments
      </Link>
    </section>
  );
}
