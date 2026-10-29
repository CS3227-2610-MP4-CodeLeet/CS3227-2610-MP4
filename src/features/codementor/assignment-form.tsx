'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  assignmentLanguages,
  languageLabels,
  type AssignmentLanguage,
} from '@/features/student-assignments/types';

type Criterion = {
  id: string;
  title: string;
  description: string;
  maxScore: number;
};
type AssignmentDraft = {
  id: string;
  title: string;
  instructions: string;
  language: AssignmentLanguage;
  languageLocked?: boolean;
  publication_status: 'draft' | 'published';
  version: number;
  criteria?: Criterion[];
};
type AssignmentFieldsData = Omit<AssignmentDraft, 'criteria'> & {
  criteria: Criterion[];
};
type Payload = {
  title: string;
  instructions: string;
  language: string;
  rubric: Criterion[];
  publicationStatus: string;
  expectedVersion?: number;
};
const defaultCriterion: Criterion = {
  id: '',
  title: 'Correctness',
  description: 'Correctness and clarity of the solution.',
  maxScore: 10,
};
const blankAssignment: AssignmentFieldsData = {
  id: '',
  title: '',
  instructions: '',
  language: 'python',
  publication_status: 'draft',
  version: 0,
  criteria: [defaultCriterion],
};

function assignmentFieldsData(
  assignment?: AssignmentDraft,
): AssignmentFieldsData {
  if (!assignment) return blankAssignment;
  return {
    ...assignment,
    criteria: assignment.criteria?.length
      ? assignment.criteria
      : [defaultCriterion],
  };
}

function readText(form: FormData, key: string) {
  return String(form.get(key) ?? '');
}
function readTextList(form: FormData, key: string) {
  return form.getAll(key).map(String);
}
function criteriaFor(form: FormData): Criterion[] {
  const ids = readTextList(form, 'criterionId');
  const titles = readTextList(form, 'criterionTitle');
  const descriptions = readTextList(form, 'criterionDescription');
  const scores = readTextList(form, 'criterionMaxScore');
  return titles.map((title, index) => ({
    id: ids[index] || crypto.randomUUID(),
    title,
    description: descriptions[index] ?? '',
    maxScore: Number(scores[index]),
  }));
}
function buildPayload(form: FormData, assignment?: AssignmentDraft): Payload {
  const payload: Payload = {
    title: readText(form, 'title'),
    instructions: readText(form, 'instructions'),
    language: readText(form, 'language'),
    rubric: criteriaFor(form),
    publicationStatus: readText(form, 'publicationStatus') || 'draft',
  };
  if (assignment) payload.expectedVersion = assignment.version;
  return payload;
}
async function sendAssignment(
  assignment: AssignmentDraft | undefined,
  payload: Payload,
) {
  const endpoint = assignment
    ? `/api/assignments/${assignment.id}`
    : '/api/assignments';
  const method = assignment ? 'PATCH' : 'POST';
  const response = await fetch(endpoint, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.error?.message ?? 'Assignment could not be saved.');
}
function makeSubmit(
  assignment: AssignmentDraft | undefined,
  setBusy: (busy: boolean) => void,
  setMessage: (message: string) => void,
  router: ReturnType<typeof useRouter>,
) {
  return async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      await sendAssignment(
        assignment,
        buildPayload(new FormData(event.currentTarget), assignment),
      );
      router.push('/instructor');
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Assignment could not be saved.',
      );
    } finally {
      setBusy(false);
    }
  };
}

export function AssignmentForm({
  assignment,
}: {
  assignment?: AssignmentDraft;
}) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <form
      onSubmit={makeSubmit(assignment, setBusy, setMessage, router)}
      className="max-w-3xl space-y-5 rounded-xl border bg-card p-6"
    >
      <AssignmentFields assignment={assignmentFieldsData(assignment)} />
      <StatusMessage message={message} />
      <SaveButton busy={busy} />
    </form>
  );
}

function AssignmentFields({
  assignment,
}: {
  assignment: AssignmentFieldsData;
}) {
  return (
    <>
      <label className="block space-y-2 text-sm">
        Title
        <input
          name="title"
          required
          maxLength={160}
          defaultValue={assignment.title}
          className="w-full rounded-md border bg-background px-3 py-2"
        />
      </label>
      <label className="block space-y-2 text-sm">
        Instructions
        <textarea
          name="instructions"
          required
          maxLength={12000}
          rows={8}
          defaultValue={assignment.instructions}
          className="w-full rounded-md border bg-background px-3 py-2"
        />
      </label>
      <AssignmentLanguageField assignment={assignment} />
      <PrivateRubricFields criteria={assignment.criteria} />
      <label className="block space-y-2 text-sm">
        Status
        <select
          name="publicationStatus"
          defaultValue={assignment.publication_status}
          className="w-full rounded-md border bg-background px-3 py-2"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </label>
    </>
  );
}

function PrivateRubricFields({ criteria }: { criteria: Criterion[] }) {
  const [rubric, setRubric] = useState(() =>
    criteria.map((criterion) => ({
      ...criterion,
      id: criterion.id || crypto.randomUUID(),
    })),
  );
  function updateCriterion(index: number, patch: Partial<Criterion>) {
    setRubric((current) =>
      current.map((criterion, currentIndex) =>
        currentIndex === index ? { ...criterion, ...patch } : criterion,
      ),
    );
  }
  function addCriterion() {
    setRubric((current) =>
      current.length >= 20
        ? current
        : [
            ...current,
            {
              id: crypto.randomUUID(),
              title: '',
              description: '',
              maxScore: 10,
            },
          ],
    );
  }
  return (
    <fieldset className="space-y-3 rounded-lg border p-4">
      <legend className="px-1 font-medium">Private rubric</legend>
      {rubric.map((criterion, index) => (
        <RubricCriterionFields
          key={criterion.id}
          criterion={criterion}
          index={index}
          canRemove={rubric.length > 1}
          onChange={updateCriterion}
          onRemove={(removeIndex) =>
            setRubric((current) =>
              current.filter((_, currentIndex) => currentIndex !== removeIndex),
            )
          }
        />
      ))}
      <button
        type="button"
        disabled={rubric.length >= 20}
        onClick={addCriterion}
        className="text-sm underline disabled:opacity-50"
      >
        Add rubric criterion
      </button>
    </fieldset>
  );
}

function RubricCriterionFields({
  criterion,
  index,
  canRemove,
  onChange,
  onRemove,
}: {
  criterion: Criterion;
  index: number;
  canRemove: boolean;
  onChange: (index: number, patch: Partial<Criterion>) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="space-y-3 rounded-md border p-3">
      <h3 className="font-medium">Criterion {index + 1}</h3>
      <input type="hidden" name="criterionId" value={criterion.id} />
      <label className="block space-y-2 text-sm">
        Criterion {index + 1} title
        <input
          name="criterionTitle"
          required
          maxLength={120}
          value={criterion.title}
          onChange={(event) => onChange(index, { title: event.target.value })}
          className="w-full rounded-md border bg-background px-3 py-2"
        />
      </label>
      <label className="block space-y-2 text-sm">
        Criterion {index + 1} description
        <textarea
          name="criterionDescription"
          required
          maxLength={1000}
          value={criterion.description}
          onChange={(event) =>
            onChange(index, { description: event.target.value })
          }
          className="w-full rounded-md border bg-background px-3 py-2"
        />
      </label>
      <label className="block space-y-2 text-sm">
        Criterion {index + 1} maximum score
        <input
          name="criterionMaxScore"
          type="number"
          min={1}
          max={100}
          required
          value={criterion.maxScore}
          onChange={(event) =>
            onChange(index, { maxScore: Number(event.target.value) })
          }
          className="w-full rounded-md border bg-background px-3 py-2"
        />
      </label>
      <button
        type="button"
        disabled={!canRemove}
        onClick={() => onRemove(index)}
        className="text-sm underline disabled:opacity-50"
        aria-label={`Remove criterion ${index + 1}`}
      >
        Remove criterion
      </button>
    </div>
  );
}

function StatusMessage({ message }: { message: string }) {
  return message ? (
    <p role="status" className="text-sm text-muted-foreground">
      {message}
    </p>
  ) : null;
}

function SaveButton({ busy }: { busy: boolean }) {
  return (
    <button
      disabled={busy}
      className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
    >
      {busy ? 'Saving…' : 'Save assignment'}
    </button>
  );
}

function AssignmentLanguageField({
  assignment,
}: {
  assignment: AssignmentFieldsData;
}) {
  return (
    <label className="block space-y-2 text-sm">
      Language
      <select
        name="language"
        aria-label="Language"
        disabled={assignment.languageLocked}
        defaultValue={assignment.language}
        className="w-full rounded-md border bg-background px-3 py-2"
      >
        {assignmentLanguages.map((language) => (
          <option key={language} value={language}>
            {languageLabels[language]}
          </option>
        ))}
      </select>
      {assignment.languageLocked && (
        <input type="hidden" name="language" value={assignment.language} />
      )}
      {assignment.languageLocked && (
        <span className="block text-xs text-muted-foreground">
          Language is fixed once students submit.
        </span>
      )}
    </label>
  );
}
