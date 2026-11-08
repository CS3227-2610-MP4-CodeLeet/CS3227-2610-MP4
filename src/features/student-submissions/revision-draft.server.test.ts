import { expect, it } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { loadRevisionDraft } from './revision-draft.server';
import { revisionSelection, revisionEditorPath } from './revision-selection';

const revisionId = '10000000-0000-4000-8000-000000000010';
const assignmentId = '10000000-0000-4000-8000-000000000011';
const studentId = '10000000-0000-4000-8000-000000000012';

it.each([undefined, revisionId])(
  'accepts an absent or single UUID selection',
  (value) => {
    expect(revisionSelection(value)).toEqual({ success: true, data: value });
  },
);

it.each(['', 'not-a-uuid', [revisionId], [revisionId, revisionId]])(
  'rejects malformed or duplicate selections %j',
  (value) => expect(revisionSelection(value).success).toBe(false),
);

it('uses only assignment/revision identifiers in edit links', () => {
  expect(revisionEditorPath(assignmentId, revisionId)).toBe(
    `/student/assignments/${assignmentId}?fromRevision=${revisionId}`,
  );
  expect(revisionEditorPath(assignmentId, revisionId, 'course-a')).toBe(
    `/courses/course-a/assignments/${assignmentId}?fromRevision=${revisionId}`,
  );
});

function clientWith(response: unknown, status = 200) {
  let requested!: URL;
  const client = createClient('http://127.0.0.1:54321', 'synthetic-test-key', {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: async (input) => {
        requested = new URL(String(input));
        return new Response(JSON.stringify(response), {
          status,
          headers: { 'content-type': 'application/json' },
        });
      },
    },
  });
  return { client, requested: () => requested };
}

it.each(['python', 'java'] as const)(
  'loads exact %s source with all identity filters',
  async (language) => {
    const row = { id: revisionId, revision: 2, source: '  exact source\n\n' };
    const fixture = clientWith(row);
    expect(
      await loadRevisionDraft(fixture.client, {
        studentId,
        assignmentId,
        language,
        revisionId,
      }),
    ).toEqual(row);
    const params = fixture.requested().searchParams;
    expect(params.get('select')).toBe('id,source,revision');
    expect(params.get('student_id')).toBe(`eq.${studentId}`);
    expect(params.get('assignment_id')).toBe(`eq.${assignmentId}`);
    expect(params.get('language')).toBe(`eq.${language}`);
    expect(params.get('id')).toBe(`eq.${revisionId}`);
  },
);

it.each([
  null,
  { id: revisionId, revision: 0, source: 'x' },
  { id: revisionId, revision: 1, source: 'x'.repeat(8001) },
  { id: revisionId, revision: 1, source: 123 },
  { id: revisionId, revision: 1, source: 'bad\0source' },
])('fails closed on missing/invalid source data %j', async (row) => {
  const { client } = clientWith(row);
  expect(
    await loadRevisionDraft(client, {
      studentId,
      assignmentId,
      language: 'java',
      revisionId,
    }),
  ).toBeNull();
});

it('fails closed without exposing database error details', async () => {
  const { client } = clientWith(
    { message: 'private database detail', code: 'XX000' },
    500,
  );
  expect(
    await loadRevisionDraft(client, {
      studentId,
      assignmentId,
      language: 'java',
      revisionId,
    }),
  ).toBeNull();
});
