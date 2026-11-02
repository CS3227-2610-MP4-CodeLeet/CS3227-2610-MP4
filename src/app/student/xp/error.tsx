'use client';
import { useRouter } from 'next/navigation';
export default function XpError() {
  const router = useRouter();
  return (
    <section className="space-y-4 rounded-lg border p-6">
      <h1 className="text-xl font-semibold">XP could not be loaded</h1>
      <button
        type="button"
        onClick={() => router.refresh()}
        className="rounded-md border px-3 py-2 text-sm"
      >
        Try again
      </button>
    </section>
  );
}
