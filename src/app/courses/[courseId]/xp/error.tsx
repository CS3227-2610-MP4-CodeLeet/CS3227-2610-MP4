'use client';

import { useRouter } from 'next/navigation';

export default function XpError() {
  const router = useRouter();
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <section role="alert" className="space-y-4 rounded-lg border p-6">
        <h1 className="text-xl font-semibold">XP could not be loaded</h1>
        <button
          type="button"
          onClick={() => router.refresh()}
          className="rounded-md border px-3 py-2 text-sm"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
