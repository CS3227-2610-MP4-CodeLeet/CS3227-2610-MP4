import { publicSetSchema } from './contracts';
export async function fetchPublicCases(
  id: string,
  signal?: AbortSignal,
  fetchImpl: typeof fetch = fetch,
) {
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
