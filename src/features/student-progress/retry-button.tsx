'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { PendingButton } from '@/components/ui/pending-button';

export function ProgressRetryButton({ retry }: { retry?: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <PendingButton
      type="button"
      pending={pending}
      pendingLabel="Refreshing…"
      className="rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
      onClick={() => startTransition(retry ?? (() => router.refresh()))}
    >
      Try again
    </PendingButton>
  );
}
