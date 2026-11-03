'use client';

import type { ComponentProps } from 'react';
import { useFormStatus } from 'react-dom';
import { LoaderCircle } from 'lucide-react';

type Props = ComponentProps<'button'> & {
  pending: boolean;
  pendingLabel?: string;
};

export function PendingButton({
  pending,
  pendingLabel,
  disabled,
  children,
  ...props
}: Props) {
  return (
    <button {...props} disabled={pending || disabled} aria-busy={pending}>
      {pending && (
        <LoaderCircle
          aria-hidden="true"
          className="mr-2 inline-block size-4 animate-spin align-middle motion-reduce:animate-none"
        />
      )}
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}

export function FormSubmitButton(props: Omit<Props, 'pending'>) {
  const { pending } = useFormStatus();
  return <PendingButton {...props} type="submit" pending={pending} />;
}
