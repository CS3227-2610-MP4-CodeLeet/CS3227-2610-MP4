'use client';

import { useProfileForm } from './use-profile-form';

export function ProfileForm({
  username: initialUsername,
  email,
  role,
  usernameLoginEnabled = true,
}: {
  username: string;
  email: string;
  role: string;
  usernameLoginEnabled?: boolean;
}) {
  const { username, edited, busy, error, saved, save } =
    useProfileForm(initialUsername);
  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <div className="space-y-2 text-sm font-medium">
        <label htmlFor="profile-username" className="block">
          Username
        </label>
        <input
          id="profile-username"
          name="username"
          autoComplete="nickname"
          value={username}
          onChange={(event) => edited(event.target.value)}
          maxLength={80}
          required
          disabled={busy}
          aria-describedby="username-help"
          className="w-full rounded-md border bg-background px-3 py-2.5"
        />
        <span
          id="username-help"
          className="block text-xs font-normal text-muted-foreground"
        >
          Your unique name in CodeLeet. Up to 80 characters, without @.
        </span>
      </div>
      <ProfileIdentity email={email} role={role} />
      {!usernameLoginEnabled && !saved && (
        <p className="text-sm text-muted-foreground">
          Choose an available username and save it to enable username sign-in.
          You can keep signing in with your email.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
      {saved && (
        <p
          role="status"
          className="text-sm text-emerald-700 dark:text-emerald-300"
        >
          Profile saved.
        </p>
      )}
      <button
        disabled={busy}
        className="rounded-md bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-60"
      >
        {busy ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}

function ProfileIdentity({ email, role }: { email: string; role: string }) {
  return (
    <>
      <ReadOnlyField label="Email" value={email} />
      <ReadOnlyField label="Role" value={role} />
      <p className="text-xs text-muted-foreground">
        Sign in with your email or username. Your email and role can’t be
        changed here.
      </p>
    </>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <label className="block space-y-2 text-sm font-medium">
      <span>{label}</span>
      <input
        readOnly
        value={value}
        autoComplete="off"
        className={`w-full rounded-md border bg-muted/50 px-3 py-2.5 text-muted-foreground ${label === 'Role' ? 'capitalize' : ''}`}
      />
    </label>
  );
}
