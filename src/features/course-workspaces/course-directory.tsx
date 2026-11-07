'use client';

import { useEffect, useRef, useState } from 'react';
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
  const [activeModal, setActiveModal] = useState<'none' | 'create' | 'join'>(
    'none',
  );

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-10">
      <CourseDirectoryHeader />

      <section aria-labelledby="course-list-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 id="course-list-heading" className="text-xl font-semibold">
            Your courses
          </h2>
          <div className="flex items-center gap-3">
            {canCreate && (
              <button
                type="button"
                onClick={() => setActiveModal('create')}
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Create course
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveModal('join')}
              className="rounded-md border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted"
            >
              Join course
            </button>
          </div>
        </div>

        {initialCourses.length === 0 ? (
          <EmptyCourses />
        ) : (
          <CourseList
            courses={initialCourses}
            currentUserId={currentUserId}
            platformAdmin={platformAdmin}
          />
        )}
      </section>

      {activeModal !== 'none' && (
        <CourseActionModal
          activeModal={activeModal}
          onClose={() => setActiveModal('none')}
        />
      )}
    </main>
  );
}

function CourseDirectoryHeader() {
  return (
    <header className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Your teaching and learning spaces
      </p>
      <h1 className="text-3xl font-semibold">Courses</h1>
      <p className="max-w-2xl text-sm text-muted-foreground">
        Each course keeps its members, settings and work together. You can have
        a different role in each course.
      </p>
    </header>
  );
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function trapTabKey(event: KeyboardEvent, container: HTMLElement) {
  if (event.key !== 'Tab') return;
  const focusables = Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  );
  if (focusables.length === 0) {
    event.preventDefault();
    return;
  }
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function useFocusTrap(onClose: () => void) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousActive = document.activeElement as HTMLElement | null;
    const container = containerRef.current;
    if (container) {
      const focusables =
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      const first = focusables[0] ?? container;
      first.focus();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      } else if (container) {
        trapTabKey(event, container);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousActive?.focus();
    };
  }, [onClose]);

  return containerRef;
}

function CourseActionModal({
  activeModal,
  onClose,
}: {
  activeModal: 'create' | 'join';
  onClose: () => void;
}) {
  const containerRef = useFocusTrap(onClose);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={containerRef}
        tabIndex={-1}
        className="relative w-full max-w-lg rounded-xl border bg-card p-6 shadow-xl focus:outline-none"
      >
        {activeModal === 'create' ? (
          <CourseCreateForm onSuccess={onClose} onCancel={onClose} />
        ) : (
          <CourseJoinForm onSuccess={onClose} onCancel={onClose} />
        )}
      </div>
    </div>
  );
}

function EmptyCourses() {
  return (
    <div className="rounded-xl border border-dashed p-6">
      <h3 className="text-lg font-medium">No courses yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Create a course if you teach, or join one with the code from your
        instructor.
      </p>
    </div>
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
  );
}
