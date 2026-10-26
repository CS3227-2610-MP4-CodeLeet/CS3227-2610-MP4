export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center gap-6 px-6 py-16">
      <p className="text-sm font-medium tracking-wide text-muted-foreground">
        CS3227 · CodeLeet
      </p>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
        Programming Assignment Platform
      </h1>
      <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
        A place to practise programming, submit assignments and learn from
        feedback.
      </p>
      <p className="rounded-lg border bg-card p-5 text-card-foreground">
        Coming soon. Student and instructor features are under development.
      </p>
    </main>
  );
}
