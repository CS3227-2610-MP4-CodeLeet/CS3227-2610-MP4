export default function InstructorSubmissionsLoading() {
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-10 animate-pulse">
      <div className="space-y-2">
        <div className="h-4 w-32 rounded bg-muted" />
        <div className="h-8 w-48 rounded bg-muted" />
      </div>

      <div className="h-14 rounded-xl border bg-muted/40" />

      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-xl border bg-card p-5"
          >
            <div className="space-y-2">
              <div className="h-5 w-40 rounded bg-muted" />
              <div className="h-4 w-60 rounded bg-muted" />
            </div>
            <div className="flex items-center gap-4">
              <div className="h-6 w-20 rounded-full bg-muted" />
              <div className="h-8 w-16 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
