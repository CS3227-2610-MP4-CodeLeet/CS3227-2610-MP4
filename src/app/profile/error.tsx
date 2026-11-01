'use client';

export default function ProfileError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-xl space-y-4 px-4 py-12" role="alert">
      <h1 className="text-xl font-semibold">Profile is unavailable</h1>
      <p className="text-sm text-muted-foreground">
        We couldn’t load your account details. Please try again.
      </p>
      <button onClick={reset} className="rounded-md border px-3 py-2 text-sm">
        Try again
      </button>
    </main>
  );
}
