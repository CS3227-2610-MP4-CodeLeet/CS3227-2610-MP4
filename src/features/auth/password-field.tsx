'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export function PasswordField({
  confirmation = false,
  newPassword = false,
}: {
  confirmation?: boolean;
  newPassword?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const name = confirmation ? 'confirmPassword' : 'password';
  const label = confirmation ? 'Confirm password' : 'Password';
  const Icon = visible ? EyeOff : Eye;
  return (
    <div className="space-y-2 text-sm">
      <label htmlFor={name}>{label}</label>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={visible ? 'text' : 'password'}
          required
          minLength={8}
          autoComplete={newPassword ? 'new-password' : 'current-password'}
          className="w-full rounded-md border bg-background py-2 pr-12 pl-3"
        />
        <button
          type="button"
          aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
          aria-pressed={visible}
          aria-controls={name}
          onClick={() => setVisible(!visible)}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          <Icon aria-hidden="true" className="size-4" />
        </button>
      </div>
    </div>
  );
}
