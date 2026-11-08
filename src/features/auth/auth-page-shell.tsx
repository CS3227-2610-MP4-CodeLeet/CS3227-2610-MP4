import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { ButtonLink } from '@/components/ui/pending-link';

/**
 * Shared frame for signed-out account pages (sign in, sign up and password
 * recovery) with a consistent way back to the welcome page.
 */
export function AuthPageShell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl items-center justify-center px-6 py-12">
      <div className="flex w-full max-w-md flex-col gap-4">
        <ButtonLink
          href="/"
          variant="ghost"
          className="self-start"
          icon={<ArrowLeft aria-hidden="true" className="size-4 shrink-0" />}
        >
          Back to welcome page
        </ButtonLink>
        {children}
      </div>
    </main>
  );
}
