import { NextResponse } from 'next/server';

export function privateJson(body: unknown, status = 200) {
  const normalized = withRequestId(body);
  return NextResponse.json(normalized, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

function withRequestId(body: unknown) {
  if (!body || typeof body !== 'object' || !('error' in body)) return body;
  const error = body.error;
  if (!error || typeof error !== 'object') return body;
  return { ...body, error: { ...error, requestId: crypto.randomUUID() } };
}
