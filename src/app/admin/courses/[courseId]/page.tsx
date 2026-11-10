import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { requireRole } from '@/lib/auth/verified-user';

export const dynamic = 'force-dynamic';

const courseIdSchema = z.string().uuid();

export default async function AdminCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { supabase } = await requireRole('admin');
  const { courseId: rawCourseId } = await params;
  const parsedCourseId = courseIdSchema.safeParse(rawCourseId);
  if (!parsedCourseId.success) notFound();

  const { data: course, error } = await supabase
    .from('courses')
    .select('id,owner_id,title,description,lifecycle,is_legacy')
    .eq('id', parsedCourseId.data)
    .maybeSingle();
  if (error) throw new Error('Course overview could not be loaded.');
  if (!course) notFound();

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-6 py-10">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Platform administration · read-only overview
        </p>
        <h1 className="text-3xl font-semibold">{course.title}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Course overview. Course activities and member information are
          available through course membership.
        </p>
        <Link
          href="/courses"
          className="inline-flex rounded-md border px-3 py-2 text-sm"
        >
          Back to courses
        </Link>
      </header>

      <section aria-labelledby="course-details-heading" className="space-y-4">
        <h2 id="course-details-heading" className="text-xl font-semibold">
          Course details
        </h2>
        <dl className="grid gap-4 rounded-xl border p-5 sm:grid-cols-2">
          <div className="space-y-1">
            <dt className="text-sm text-muted-foreground">Description</dt>
            <dd>{course.description || 'No description provided.'}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-sm text-muted-foreground">Status</dt>
            <dd>{course.lifecycle === 'active' ? 'Active' : 'Archived'}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-sm text-muted-foreground">Owner</dt>
            <dd>{course.owner_id === null ? 'Unassigned' : 'Assigned'}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-sm text-muted-foreground">Course type</dt>
            <dd>{course.is_legacy ? 'Legacy course' : 'Course'}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
