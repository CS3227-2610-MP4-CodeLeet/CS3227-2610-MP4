import {
  ownerSetSchema,
  publicSetSchema,
  type PublicTestSet,
} from './contracts';

export async function fetchPublicCases(
  id: string,
  signal?: AbortSignal,
  fetchImpl: typeof fetch = fetch,
): Promise<PublicTestSet> {
  const response = await fetchImpl(
    `/api/student/assignments/${id}/test-cases`,
    { cache: 'no-store', signal },
  );
  if (!response.ok)
    throw new Error('Published tests could not be loaded. Try again.');
  const result = publicSetSchema.parse((await response.json()).data);
  if (result.assignment_id !== id)
    throw new Error('Published tests do not match this assignment.');
  return result;
}

export async function fetchInstructorPreviewCases(
  id: string,
  signal?: AbortSignal,
  fetchImpl: typeof fetch = fetch,
): Promise<PublicTestSet> {
  const response = await fetchImpl(`/api/assignments/${id}/practice-tests`, {
    cache: 'no-store',
    signal,
  });
  if (!response.ok)
    throw new Error('Published tests could not be loaded. Try again.');
  const result = ownerSetSchema.parse((await response.json()).data);
  if (result.assignment_id !== id)
    throw new Error('Published tests do not match this assignment.');
  return {
    assignment_id: result.assignment_id,
    assignment_revision: 1,
    test_set_revision: result.published_revision,
    cases: result.cases.filter((item) => item.is_public !== false),
  };
}
