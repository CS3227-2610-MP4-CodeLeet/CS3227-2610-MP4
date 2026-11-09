export default function ManageUsersLoading() {
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">
      <div className="space-y-2">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-4 w-96 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-44 animate-pulse rounded-xl border bg-muted/40" />
      <div className="h-64 animate-pulse rounded-xl border bg-muted/40" />
    </main>
  );
}
