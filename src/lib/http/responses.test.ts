import { expect, it } from 'vitest';
import { privateJson } from './responses';

it('marks private responses no-store and adds opaque IDs to errors', async () => {
  const response = privateJson(
    { error: { code: 'invalid_request', message: 'Request rejected.' } },
    400,
  );
  const body = await response.json();

  expect(response.status).toBe(400);
  expect(response.headers.get('cache-control')).toBe('private, no-store');
  expect(body.error.requestId).toMatch(/^[0-9a-f-]{36}$/i);
});
