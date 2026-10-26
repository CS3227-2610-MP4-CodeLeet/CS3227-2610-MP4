export default function AssignmentsLoading() {
  return (
    <div
      role="status"
      aria-label="Loading assignments"
      className="space-y-4 rounded-xl border bg-card p-8"
    >
      <p className="text-muted-foreground">Loading assignments…</p>
      <div
        aria-hidden="true"
        className="h-6 max-w-sm animate-pulse rounded bg-muted"
      />
      <div aria-hidden="true" className="h-20 animate-pulse rounded bg-muted" />
    </div>
  );
}
