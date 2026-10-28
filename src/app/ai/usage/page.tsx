import { redirect } from 'next/navigation';
import { getVerifiedUserRole } from '@/lib/auth/verified-user';

type UsageEvent = {
  review_type: string;
  status: string;
  error_category: string | null;
  latency_ms: number | null;
  input_tokens: number | null;
  output_tokens: number | null;
  token_source: string | null;
  cache_hit: boolean;
  created_at: string;
};

export const dynamic = 'force-dynamic';

export default async function AIUsagePage() {
  const { supabase, user, role } = await getVerifiedUserRole();
  if (!user || !role) redirect('/sign-in');
  const { data: usage, error } = await supabase
    .from('ai_usage')
    .select(
      'review_type,status,error_category,latency_ms,input_tokens,output_tokens,token_source,cache_hit,created_at',
    )
    .eq('requester_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw new Error('Usage data could not be loaded');
  const summary = summarizeUsage(usage ?? []);
  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-10">
      <header>
        <p className="text-sm text-muted-foreground">
          {role === 'student' ? 'Student' : 'Instructor'} account
        </p>
        <h1 className="text-3xl font-semibold">AI usage</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Recent private usage events for your account. Token counts may be
          provider reported or estimated.
        </p>
      </header>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Successful reviews" value={summary.successes} />
        <Metric label="Cache hits" value={summary.cacheHits} />
        <Metric label="Input tokens" value={summary.inputTokens} />
        <Metric label="Output tokens" value={summary.outputTokens} />
      </section>
      <UsageEvents usage={usage ?? []} />
    </main>
  );
}

function summarizeUsage(usage: UsageEvent[]) {
  return {
    successes: usage.filter((event) => event.status === 'succeeded').length,
    cacheHits: usage.filter((event) => event.cache_hit).length,
    inputTokens: usage.reduce(
      (total, event) => total + (event.input_tokens ?? 0),
      0,
    ),
    outputTokens: usage.reduce(
      (total, event) => total + (event.output_tokens ?? 0),
      0,
    ),
  };
}

function UsageEvents({ usage }: { usage: UsageEvent[] }) {
  if (!usage.length)
    return (
      <p className="rounded-xl border p-6 text-muted-foreground">
        No AI usage recorded yet.
      </p>
    );
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-left text-sm">
        <thead className="border-b bg-muted">
          <tr>
            <th className="p-3">Time</th>
            <th className="p-3">Review</th>
            <th className="p-3">Status</th>
            <th className="p-3">Tokens</th>
            <th className="p-3">Latency</th>
            <th className="p-3">Cache</th>
          </tr>
        </thead>
        <tbody>
          {usage.map((event, index) => (
            <UsageRow key={`${event.created_at}-${index}`} event={event} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UsageRow({ event }: { event: UsageEvent }) {
  const status = event.error_category
    ? `${event.status} · ${event.error_category}`
    : event.status;
  const tokens = `${event.input_tokens ?? '—'} / ${event.output_tokens ?? '—'} (${event.token_source ?? '—'})`;
  return (
    <tr className="border-b last:border-0">
      <td className="p-3">{new Date(event.created_at).toLocaleString()}</td>
      <td className="p-3">{event.review_type}</td>
      <td className="p-3">{status}</td>
      <td className="p-3">{tokens}</td>
      <td className="p-3">{event.latency_ms ?? '—'} ms</td>
      <td className="p-3">{event.cache_hit ? 'hit' : 'miss'}</td>
    </tr>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-xl border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value.toLocaleString()}</p>
    </article>
  );
}
