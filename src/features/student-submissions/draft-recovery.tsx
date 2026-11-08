import type { DraftStatus } from './draft-controller';

type Choice = 'restore' | 'discard' | 'keep' | 'load';
const buttonStyle =
  'rounded-md border bg-background px-3 py-2 text-sm hover:bg-accent';
const messages: Partial<Record<DraftStatus, string>> = {
  saving: 'Saving draft…',
  saved: 'Draft saved on this device',
  error: "Couldn't save draft on this device",
  stopped: 'Your session has ended. Sign in again to continue.',
};

export function DraftRecovery({
  status,
  savedAt,
  resolve,
}: {
  status: DraftStatus;
  savedAt?: number;
  resolve: (choice: Choice) => void;
}) {
  if (status !== 'recover' && status !== 'conflict')
    return messages[status] ? (
      <p role="status" className="text-sm text-muted-foreground">
        {messages[status]}
      </p>
    ) : null;
  const recovery = status === 'recover';
  return (
    <section
      aria-label={recovery ? 'Recover unfinished code' : 'Draft conflict'}
      className="space-y-3 rounded-lg border bg-muted/40 p-4"
    >
      <p className="text-sm">
        {recovery
          ? 'You have an unfinished draft on this device.'
          : 'This draft changed in another tab. Choose which code to keep.'}
      </p>
      {savedAt !== undefined && (
        <p className="text-xs text-muted-foreground">
          Saved{' '}
          <time dateTime={new Date(savedAt).toISOString()}>
            {new Date(savedAt).toLocaleString()}
          </time>
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={buttonStyle}
          onClick={() => resolve(recovery ? 'restore' : 'load')}
        >
          {recovery ? 'Restore draft' : 'Load other draft'}
        </button>
        <button
          type="button"
          className={buttonStyle}
          onClick={() => resolve(recovery ? 'discard' : 'keep')}
        >
          {recovery ? 'Discard draft' : 'Keep this tab’s code'}
        </button>
      </div>
    </section>
  );
}
