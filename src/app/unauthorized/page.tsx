import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center gap-4 px-6">
      <h1 className="text-3xl font-semibold">
        This account cannot access that page
      </h1>
      <p className="text-muted-foreground">
        Ask a project administrator to verify your account role.
      </p>
      <Link href="/" className="underline">
        Return home
      </Link>
    </main>
  );
}
