'use client';

export default function AssignmentError() {
  return (
    <section role="alert" className="space-y-4 rounded-xl border bg-card p-8">
      <h1 className="text-2xl font-semibold">
        Assignments could not be loaded
      </h1>
      <p className="text-muted-foreground">
        Please try again. Your work has not been changed.
      </p>
      <button
        type="button"
        onClick={() => {
          // A fresh document clears the failed RSC response and preview query;
          // client navigation plus reset retained the cached error in testing.
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.assign('/student/assignments');
        }}
        className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Try again
      </button>
    </section>
  );
}
