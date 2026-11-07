import { redirect, notFound } from 'next/navigation';
import { getVerifiedUserRole } from '@/lib/auth/verified-user';
import { readCourseAccess } from '@/lib/courses/access';

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

export default async function CourseAIUsagePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const { supabase, user, role } = await getVerifiedUserRole();
  if (!user || !role) redirect('/sign-in');

  const access = await readCourseAccess(supabase, user.id, courseId, 'ai');
  if (!access || (access.lifecycle === 'active' && !access.featureEnabled)) {
    notFound();
  }

  const { data: usage, error } = await supabase
    .from('ai_usage')
    .select(
      'review_type,status,error_category,latency_ms,input_tokens,output_tokens,token_source,cache_hit,created_at',
    )
    .eq('requester_id', user.id)
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw new Error('Usage data could not be loaded');

  const summary = summarizeUsage(usage ?? []);

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold">AI Usage</h1>
        <p className="text-sm text-muted-foreground">
          Your personal CodeMentor review metrics and token consumption for this
          course.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Reviews" value={summary.totalReviews} />
        <StatCard label="Cache Hit Rate" value={`${summary.cacheHitRate}%`} />
        <StatCard label="Avg Latency" value={`${summary.avgLatencyMs}ms`} />
        <StatCard
          label="Total Tokens"
          value={summary.totalTokens.toLocaleString()}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Recent Reviews</h2>
        {summary.events.length === 0 ? (
          <p className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
            No AI reviews recorded for this course yet.
          </p>
        ) : (
          <RecentReviewsTable events={summary.events} />
        )}
      </section>
    </main>
  );
}

function RecentReviewsTable({ events }: { events: UsageEvent[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-sm">
        <thead className="border-b bg-muted/50 text-xs text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Time</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Tokens (In / Out)</th>
            <th className="px-4 py-3">Latency</th>
            <th className="px-4 py-3">Cache</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {events.map((event, i) => (
            <tr key={i} className="hover:bg-muted/20">
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {new Date(event.created_at).toLocaleString()}
              </td>
              <td className="px-4 py-3 capitalize">{event.review_type}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(
                    event.status,
                  )}`}
                >
                  {event.status}
                </span>
              </td>
              <td className="px-4 py-3 font-mono text-xs">
                {event.input_tokens ?? 0} / {event.output_tokens ?? 0}
              </td>
              <td className="px-4 py-3 font-mono text-xs">
                {event.latency_ms ? `${event.latency_ms}ms` : '-'}
              </td>
              <td className="px-4 py-3 text-xs">
                {event.cache_hit ? (
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    HIT
                  </span>
                ) : (
                  <span className="text-muted-foreground">MISS</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function statusBadgeClass(status: string) {
  if (status === 'succeeded' || status === 'cache_hit') {
    return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300';
  }
  if (status === 'pending') {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
  }
  return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300';
}

function summarizeUsage(events: UsageEvent[]) {
  const totalReviews = events.length;
  const cacheHits = events.filter((e) => e.cache_hit).length;
  const cacheHitRate =
    totalReviews > 0 ? Math.round((cacheHits / totalReviews) * 100) : 0;
  const withLatency = events.filter((e) => e.latency_ms !== null);
  const avgLatencyMs =
    withLatency.length > 0
      ? Math.round(
          withLatency.reduce((sum, e) => sum + (e.latency_ms ?? 0), 0) /
            withLatency.length,
        )
      : 0;
  const totalTokens = events.reduce(
    (sum, e) => sum + (e.input_tokens ?? 0) + (e.output_tokens ?? 0),
    0,
  );
  return {
    totalReviews,
    cacheHitRate,
    avgLatencyMs,
    totalTokens,
    events,
  };
}
