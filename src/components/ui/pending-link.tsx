'use client';

import Link, { useLinkStatus } from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { LoaderCircle } from 'lucide-react';
import { buttonVariants, type ButtonVariantProps } from './button-variants';

const spinnerClassName =
  'size-4 shrink-0 animate-spin motion-reduce:animate-none';

type PendingLinkProps = ComponentProps<typeof Link> & {
  /** Leading icon; swapped for the spinner while pending so width is stable. */
  icon?: ReactNode;
  /** Trailing decoration such as an arrow; kept while pending. */
  trailingIcon?: ReactNode;
  /** Optional replacement label shown while the destination loads. */
  pendingLabel?: string;
  /** Hide the label visually (e.g. collapsed sidebar); keeps it for screen readers. */
  hideLabel?: boolean;
};

/**
 * Standalone indicator for links with custom markup (for example a card).
 * Must render inside a `<Link>`; it is empty until that link is pending.
 */
export function LinkPendingSpinner({ label = 'Loading' }: { label?: string }) {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <LoaderCircle
        aria-hidden="true"
        data-testid="link-pending-spinner"
        className={spinnerClassName}
      />
      {label}…
    </span>
  );
}

/**
 * Renders inside a `<Link>` so `useLinkStatus` reports that link's pending
 * navigation. Used by `PendingLink` for icon/label links.
 */
export function LinkPendingContent({
  icon,
  trailingIcon,
  pendingLabel,
  hideLabel = false,
  children,
}: {
  icon?: ReactNode;
  trailingIcon?: ReactNode;
  pendingLabel?: string;
  hideLabel?: boolean;
  children: ReactNode;
}) {
  const { pending } = useLinkStatus();
  const label = pending && pendingLabel ? pendingLabel : children;
  return (
    <>
      {pending ? (
        <LoaderCircle
          aria-hidden="true"
          data-testid="link-pending-spinner"
          className={spinnerClassName}
        />
      ) : (
        icon
      )}
      {hideLabel ? (
        <span className="sr-only">{label}</span>
      ) : (
        <span className="min-w-0 truncate">{label}</span>
      )}
      {trailingIcon}
      {pending && <span className="sr-only"> (loading)</span>}
    </>
  );
}

/** A navigation link that shows a spinner while its destination loads. */
export function PendingLink({
  icon,
  trailingIcon,
  pendingLabel,
  hideLabel,
  children,
  ...props
}: PendingLinkProps) {
  return (
    <Link {...props}>
      <LinkPendingContent
        icon={icon}
        trailingIcon={trailingIcon}
        pendingLabel={pendingLabel}
        hideLabel={hideLabel}
      >
        {children}
      </LinkPendingContent>
    </Link>
  );
}

/** A navigation link styled as a button, with pending feedback. */
export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: PendingLinkProps & ButtonVariantProps) {
  return (
    <PendingLink
      {...props}
      className={buttonVariants({ variant, size, className })}
    />
  );
}
