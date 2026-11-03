'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

export function usePendingNavigation() {
  const router = useRouter();
  const [navigating, startTransition] = useTransition();
  function navigate(path: string) {
    startTransition(() => {
      router.replace(path);
      router.refresh();
    });
  }
  return { navigating, navigate };
}
