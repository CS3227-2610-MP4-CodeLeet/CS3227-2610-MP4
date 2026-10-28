export type JsonBodyResult =
  | { ok: true; value: unknown }
  | { ok: false; reason: 'content-type' | 'too-large' | 'invalid-json' };

export function sameOriginRequest(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    const actual = new URL(origin);
    const configuredSite = process.env.APP_SITE_URL;
    if (configuredSite) return actual.origin === new URL(configuredSite).origin;
    const requestUrl = new URL(request.url);
    const targetHost =
      request.headers.get('x-forwarded-host') ??
      request.headers.get('host') ??
      requestUrl.host;
    const forwardedProtocol = request.headers
      .get('x-forwarded-proto')
      ?.split(',')[0]
      .trim();
    return (
      actual.host === targetHost &&
      (!forwardedProtocol || actual.protocol === `${forwardedProtocol}:`)
    );
  } catch {
    return false;
  }
}

async function collectBoundedBytes(
  body: ReadableStream<Uint8Array>,
  maxBytes: number,
) {
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

function decodeJson(bytes: Uint8Array) {
  try {
    return {
      ok: true as const,
      value: JSON.parse(
        new TextDecoder('utf-8', { fatal: true }).decode(bytes),
      ),
    };
  } catch {
    return { ok: false as const, reason: 'invalid-json' as const };
  }
}

export async function readJsonBody(
  request: Request,
  maxBytes: number,
): Promise<JsonBodyResult> {
  const contentType = request.headers
    .get('content-type')
    ?.split(';', 1)[0]
    ?.trim()
    .toLowerCase();
  if (contentType !== 'application/json')
    return { ok: false, reason: 'content-type' };
  const statedLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(statedLength) && statedLength > maxBytes) {
    return { ok: false, reason: 'too-large' };
  }
  if (!request.body) return { ok: false, reason: 'invalid-json' };
  const bytes = await collectBoundedBytes(request.body, maxBytes);
  return bytes ? decodeJson(bytes) : { ok: false, reason: 'too-large' };
}
