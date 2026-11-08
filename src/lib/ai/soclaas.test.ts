import { afterEach, describe, expect, it, vi } from 'vitest';
import { requestSoCLaaS } from './soclaas';

const fakeKey = 'test-secret';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('server-only SoCLaaS client', () => {
  it('stays unavailable unless explicitly configured', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('SOCLAAS_AI_ENABLED', 'false');
    await expect(
      requestSoCLaaS({ system: 'system', user: 'data' }),
    ).rejects.toMatchObject({ category: 'unavailable' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends one bounded JSON-only request without tools and never returns the key', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content:
                  '{"summary":"Hint","strengths":[],"nextSteps":[],"questions":[]}',
              },
            },
          ],
          usage: { prompt_tokens: 12, completion_tokens: 20 },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('SOCLAAS_AI_ENABLED', 'true');
    vi.stubEnv('SOCLAAS_BASE_URL', 'https://provider.example/v1/');
    vi.stubEnv('SOCLAAS_API_KEY', fakeKey);
    vi.stubEnv('SOCLAAS_MODEL', 'test-model');
    const response = await requestSoCLaaS({
      system: 'system',
      user: 'serialized input',
    });
    const [url, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(String(init?.body));
    expect(url).toBe('https://provider.example/v1/chat/completions');
    expect(body.max_tokens).toBe(800);
    expect(body.response_format).toEqual({ type: 'json_object' });
    expect(body).not.toHaveProperty('tools');
    expect(body.messages[1].content).toBe('serialized input');
    expect(response.inputTokens).toBe(12);
    expect(JSON.stringify(response)).not.toContain(fakeKey);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('hides raw provider diagnostics', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response('sensitive upstream response', { status: 503 }),
      ),
    );
    vi.stubEnv('SOCLAAS_AI_ENABLED', 'true');
    vi.stubEnv('SOCLAAS_BASE_URL', 'https://provider.example');
    vi.stubEnv('SOCLAAS_API_KEY', fakeKey);
    vi.stubEnv('SOCLAAS_MODEL', 'test-model');
    await expect(
      requestSoCLaaS({ system: 'system', user: 'data' }),
    ).rejects.toMatchObject({ message: 'provider_error' });
  });
});
