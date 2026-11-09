'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

export function SubmissionFilters({
  courseId,
  assignments,
  currentAssignmentId,
  showAllRevisions,
}: {
  courseId: string;
  assignments: Array<{ id: string; title: string }>;
  currentAssignmentId: string;
  showAllRevisions: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function updateQuery(newAssignmentId: string, newShowAll: boolean) {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    if (newAssignmentId && newAssignmentId !== 'all') {
      params.set('assignmentId', newAssignmentId);
    } else {
      params.delete('assignmentId');
    }
    if (newShowAll) {
      params.set('viewAll', 'true');
    } else {
      params.delete('viewAll');
    }
    const query = params.toString();
    startTransition(() => {
      router.push(
        `/courses/${courseId}/submissions${query ? `?${query}` : ''}`,
      );
    });
  }

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-4 text-sm transition-opacity ${
        isPending ? 'opacity-70' : 'opacity-100'
      }`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <label
          htmlFor="assignment-filter"
          className="font-medium text-muted-foreground"
        >
          Assignment:
        </label>
        <select
          id="assignment-filter"
          value={currentAssignmentId}
          onChange={(e) => updateQuery(e.target.value, showAllRevisions)}
          className="rounded-lg border bg-background px-3 py-1.5 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All assignments ({assignments.length})</option>
          {assignments.map((assignment) => (
            <option key={assignment.id} value={assignment.id}>
              {assignment.title}
            </option>
          ))}
        </select>
      </div>

      <label className="flex cursor-pointer items-center gap-2 select-none">
        <input
          type="checkbox"
          checked={showAllRevisions}
          onChange={(e) => updateQuery(currentAssignmentId, e.target.checked)}
          className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <span className="font-medium">Show all revisions</span>
      </label>
    </div>
  );
}
