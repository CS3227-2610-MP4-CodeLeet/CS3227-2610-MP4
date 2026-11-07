'use client';

export default function SubmissionsError() {
  return (
    <section role="alert" className="space-y-4 rounded-xl border bg-card p-8">
      <h1 className="text-2xl font-semibold">
        Submissions could not be loaded
      </h1>
      <p className="text-sm text-muted-foreground">
        Please try again. Your saved revisions have not been changed.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Try again
      </button>
    </section>
  );
}
