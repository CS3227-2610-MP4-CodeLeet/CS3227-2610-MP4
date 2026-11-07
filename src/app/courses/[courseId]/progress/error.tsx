'use client';

import { ProgressRetryButton } from '@/features/student-progress/retry-button';

export default function ProgressError({ retry }: { retry: () => void }) {
  return (
    <section role="alert" className="space-y-4 rounded-xl border bg-card p-8">
      <h1 className="text-2xl font-semibold">Progress could not be loaded</h1>
      <p className="text-sm text-muted-foreground">Please try again.</p>
      <ProgressRetryButton retry={retry} />
    </section>
  );
}
