import { describe, expect, it } from 'vitest';
import { readJsonBody, sameOriginRequest } from './request';

describe('HTTP request boundaries', () => {
  const localUrl = 'https://app.example';
  it('accepts same-origin JSON writes and rejects missing or foreign origins', () => {
    expect(
      sameOriginRequest(
        new Request(`${localUrl}/api`, { headers: { origin: localUrl } }),
      ),
    ).toBe(true);
    expect(
      sameOriginRequest(
        new Request(`${localUrl}/api`, {
          headers: { origin: 'https://attacker.example' },
        }),
      ),
    ).toBe(false);
    expect(sameOriginRequest(new Request(`${localUrl}/api`))).toBe(false);
  });

  it('parses JSON only under the size bound and returns a safe result', async () => {
    const ok = await readJsonBody(
      new Request(localUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{"ok":true}',
      }),
      32,
    );
    expect(ok).toEqual({ ok: true, value: { ok: true } });
    const oversized = await readJsonBody(
      new Request(localUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{"value":"long"}',
      }),
      8,
    );
    expect(oversized.ok).toBe(false);
    const wrongType = await readJsonBody(
      new Request(localUrl, {
        method: 'POST',
        headers: { 'content-type': 'text/plain' },
        body: '{}',
      }),
      32,
    );
    expect(wrongType.ok).toBe(false);
  });
});
