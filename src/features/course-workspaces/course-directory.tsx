'use client';

import type { CourseSummary } from './contracts';
import { CourseCard } from './course-card';
import { CourseCreateForm, CourseJoinForm } from './course-entry-forms';

type Props = {
  initialCourses: CourseSummary[];
  canCreate: boolean;
  currentUserId: string;
  platformAdmin: boolean;
};

export function CourseDirectory({
  initialCourses,
  canCreate,
  currentUserId,
  platformAdmin,
}: Props) {
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-10">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Your teaching and learning spaces
        </p>
        <h1 className="text-3xl font-semibold">Courses</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Each course keeps its members, settings and work together. You can
          have a different role in each course.
        </p>
      </header>
      {initialCourses.length === 0 ? (
        <EmptyCourses />
      ) : (
        <CourseList
          courses={initialCourses}
          currentUserId={currentUserId}
          platformAdmin={platformAdmin}
        />
      )}
      <section className="grid gap-6 lg:grid-cols-2">
        {canCreate && <CourseCreateForm />}
        <CourseJoinForm />
      </section>
    </main>
  );
}

function EmptyCourses() {
  return (
    <section className="rounded-xl border border-dashed p-6">
      <h2 className="text-lg font-medium">No courses yet</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Create a course if you teach, or join one with the code from your
        instructor.
      </p>
    </section>
  );
}

function CourseList({
  courses,
  currentUserId,
  platformAdmin,
}: {
  courses: CourseSummary[];
  currentUserId: string;
  platformAdmin: boolean;
}) {
  return (
    <section aria-labelledby="course-list-heading" className="space-y-3">
      <h2 id="course-list-heading" className="text-xl font-semibold">
        Your courses
      </h2>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => (
          <li key={course.id}>
            <CourseCard
              course={course}
              currentUserId={currentUserId}
              platformAdmin={platformAdmin}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
