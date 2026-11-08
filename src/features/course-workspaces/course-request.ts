export async function courseRequest<
  T extends Record<string, unknown> = Record<string, unknown>,
>(path: string, method: string, body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method,
    headers:
      body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = (await response.json()) as T & {
    error?: { message?: string };
  };
  if (!response.ok)
    throw new Error(
      result.error?.message ?? 'Course settings could not be saved.',
    );
  return result;
}

export function messageFor(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
