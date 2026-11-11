'use client';

export default function GradesError() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <section role="alert" className="space-y-4 rounded-xl border bg-card p-8">
        <h1 className="text-2xl font-semibold">Grades could not be loaded</h1>
        <p className="text-sm text-muted-foreground">Please try again.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
