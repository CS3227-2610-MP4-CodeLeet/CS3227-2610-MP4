/* eslint-disable max-lines-per-function -- behavioral test suites keep related scenarios together. */
/* eslint-disable sonarjs/no-duplicate-string -- repeated expected text documents the user-facing contract. */
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ loadBrowserRuntime: vi.fn() }));

vi.mock('./runtime-assets', () => ({
  loadBrowserRuntime: mocks.loadBrowserRuntime,
}));

import { BrowserRunnerClient, createSandboxDocument } from './browser-client';
import { sameProjectRunner } from './runner-environment';

const localOrigin = 'http://127.0.0.1:3130';
const input = {
  language: 'python' as const,
  source: 'print(1)',
  stdin: '',
  timeoutMs: 5000,
};
const successfulRun = {
  status: 'ok',
  stdout: '1\n',
  stderr: '',
  executionMs: 7,
};

// jsdom does not implement HTMLIFrameElement.sandbox; model only its token API.
Object.defineProperty(HTMLIFrameElement.prototype, 'sandbox', {
  configurable: true,
  get() {
    return {
      add: (token: string) => {
        const tokens = new Set(
          this.getAttribute('sandbox')?.split(/\s+/).filter(Boolean),
        );
        tokens.add(token);
        this.setAttribute('sandbox', [...tokens].join(' '));
      },
    };
  },
});

function createLocalClient() {
  const client = new BrowserRunnerClient(localOrigin);
  const frame = document.querySelector('iframe')!;
  const nonce = new URL(frame.src).searchParams.get('nonce')!;
  const postMessage = vi.spyOn(frame.contentWindow!, 'postMessage');
  return { client, frame, nonce, postMessage };
}

// eslint-disable-next-line max-params
function message(
  frame: HTMLIFrameElement,
  nonce: string,
  origin: string,
  data: Record<string, unknown>,
  source: MessageEventSource | null = frame.contentWindow,
) {
  window.dispatchEvent(
    new MessageEvent('message', {
      data: { ...data, nonce },
      origin,
      source,
    }),
  );
}

function postedRun(postMessage: ReturnType<typeof vi.spyOn>) {
  const runCall = postMessage.mock.calls.find(
    ([value]: [unknown]) => (value as { type?: string }).type === 'run',
  );
  expect(runCall).toBeDefined();
  return runCall![0] as { id: string; input: typeof input; type: string };
}

beforeEach(() => {
  vi.useRealTimers();
  mocks.loadBrowserRuntime.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
  document.body.replaceChildren();
});

describe('BrowserRunnerClient message lifecycle', () => {
  it('resolves a run only after the trusted frame reports a valid result', async () => {
    const { client, frame, nonce, postMessage } = createLocalClient();
    message(frame, nonce, localOrigin, { type: 'ready' });

    const resultPromise = client.run(input);
    await Promise.resolve();
    const posted = postedRun(postMessage);
    expect(posted).toMatchObject({ type: 'run', input });

    message(frame, nonce, localOrigin, {
      type: 'result',
      id: posted.id,
      result: successfulRun,
    });

    await expect(resultPromise).resolves.toEqual(successfulRun);
    client.dispose();
    expect(document.querySelector('iframe')).toBeNull();
  });

  it('ignores untrusted, mismatched, oversized, and malformed result messages', async () => {
    const { client, frame, nonce, postMessage } = createLocalClient();
    message(frame, nonce, localOrigin, { type: 'ready' });
    const resultPromise = client.run(input);
    await Promise.resolve();
    const posted = postedRun(postMessage);

    message(
      frame,
      nonce,
      localOrigin,
      {
        type: 'result',
        id: posted.id,
        result: successfulRun,
      },
      {} as Window,
    );
    message(frame, nonce, 'https://foreign.example', {
      type: 'result',
      id: posted.id,
      result: successfulRun,
    });
    message(frame, 'wrong-nonce', localOrigin, {
      type: 'result',
      id: posted.id,
      result: successfulRun,
    });
    message(frame, nonce, localOrigin, {
      type: 'result',
      id: 'another-run',
      result: successfulRun,
    });
    message(frame, nonce, localOrigin, {
      type: 'result',
      id: posted.id,
      result: { ...successfulRun, stdout: 'x'.repeat(8193) },
    });
    message(frame, nonce, localOrigin, {
      type: 'result',
      id: posted.id,
      result: { ...successfulRun, executionMs: Number.NaN },
    });

    message(frame, nonce, localOrigin, {
      type: 'result',
      id: posted.id,
      result: successfulRun,
    });
    await expect(resultPromise).resolves.toEqual(successfulRun);
    client.dispose();
  });

  it('rejects runs when the frame reports an initialization failure', async () => {
    const { client, frame, nonce } = createLocalClient();
    message(frame, nonce, localOrigin, { type: 'unavailable' });

    await expect(client.run(input)).rejects.toThrow(
      'Browser runtime could not initialize. Reload and try again.',
    );
    client.dispose();
  });
});

describe('BrowserRunnerClient pending run lifecycle', () => {
  it('rejects concurrent runs while one request is pending', async () => {
    const { client, frame, nonce } = createLocalClient();
    message(frame, nonce, localOrigin, { type: 'ready' });
    const firstRun = client.run(input);
    await Promise.resolve();

    await expect(client.run(input)).rejects.toThrow(
      'A browser run is already active.',
    );
    client.dispose();
    await expect(firstRun).resolves.toMatchObject({ status: 'stopped' });
  });

  it('resolves pending work as stopped when disposed', async () => {
    const { client, frame, nonce } = createLocalClient();
    message(frame, nonce, localOrigin, { type: 'ready' });
    const resultPromise = client.run(input);
    await Promise.resolve();

    client.dispose();

    await expect(resultPromise).resolves.toEqual({
      status: 'stopped',
      stdout: '',
      stderr: '',
      executionMs: null,
    });
  });

  it('posts stop and settles a pending run after the worker shutdown grace period', async () => {
    vi.useFakeTimers();
    const { client, frame, nonce, postMessage } = createLocalClient();
    message(frame, nonce, localOrigin, { type: 'ready' });
    const resultPromise = client.run(input);
    await Promise.resolve();

    client.stop();
    expect(
      postMessage.mock.calls.some(
        ([value]) => (value as { type?: string }).type === 'stop',
      ),
    ).toBe(true);
    await vi.advanceTimersByTimeAsync(500);

    await expect(resultPromise).resolves.toMatchObject({ status: 'stopped' });
    expect(document.querySelector('iframe')).toBeNull();
  });

  it('settles a run that exceeds its deadline and permits disposal only once', async () => {
    vi.useFakeTimers();
    const { client, frame, nonce } = createLocalClient();
    message(frame, nonce, localOrigin, { type: 'ready' });
    const resultPromise = client.run(input);
    await Promise.resolve();

    await vi.advanceTimersByTimeAsync(60_000);

    await expect(resultPromise).resolves.toMatchObject({
      status: 'unavailable',
      stderr: 'Browser runner exceeded its loading deadline. Try again.',
    });
    client.dispose();
  });

  it('rejects configured origins outside local HTTP and credential-free HTTPS', () => {
    expect(() => new BrowserRunnerClient('http://localhost:3130')).toThrow(
      'The configured browser runner origin is invalid.',
    );
    expect(
      () => new BrowserRunnerClient('https://user@runner.example'),
    ).toThrow('The configured browser runner origin is invalid.');
    expect(
      () => new BrowserRunnerClient('https://runner.example/path'),
    ).toThrow('The configured browser runner origin is invalid.');
  });
});

describe('hosted browser runner initialization', () => {
  it('loads assets before initializing the opaque frame and sends run results', async () => {
    const runtime = {
      scripts: { lab: 'export async function run() {}' },
      assets: { pyodide: new ArrayBuffer(2) },
      bytes: 2,
    };
    mocks.loadBrowserRuntime.mockResolvedValue(runtime);
    const client = new BrowserRunnerClient(sameProjectRunner);
    const frame = document.querySelector('iframe')!;
    const nonce = frame.srcdoc.match(/nonce="([^"]+)"/)![1];
    const postMessage = vi.spyOn(frame.contentWindow!, 'postMessage');
    frame.dispatchEvent(new Event('load'));

    const resultPromise = client.run(input);
    await vi.waitFor(() => expect(mocks.loadBrowserRuntime).toHaveBeenCalled());
    expect(mocks.loadBrowserRuntime).toHaveBeenCalledWith(
      'python',
      expect.any(Function),
      expect.any(AbortSignal),
    );
    expect(postMessage.mock.calls[0][0]).toMatchObject({
      type: 'initialize',
      runtime,
    });
    message(frame, nonce, 'null', { type: 'ready' });
    await vi.waitFor(() =>
      expect(
        postMessage.mock.calls.some(
          ([value]) => (value as { type?: string }).type === 'run',
        ),
      ).toBe(true),
    );
    const posted = postedRun(postMessage);
    message(frame, nonce, 'null', {
      type: 'result',
      id: posted.id,
      result: successfulRun,
    });

    await expect(resultPromise).resolves.toEqual(successfulRun);
    client.dispose();
  });

  it('reports loading errors from the hosted runtime loader to the caller', async () => {
    mocks.loadBrowserRuntime.mockRejectedValue(
      new Error('manifest unavailable'),
    );
    const client = new BrowserRunnerClient(sameProjectRunner);
    document.querySelector('iframe')!.dispatchEvent(new Event('load'));

    await expect(client.run(input)).rejects.toThrow('manifest unavailable');
    client.dispose();
  });

  it('does not post loaded assets after the client has already been disposed', async () => {
    let finishLoad!: (value: unknown) => void;
    mocks.loadBrowserRuntime.mockImplementation(
      () => new Promise((resolve) => (finishLoad = resolve)),
    );
    const client = new BrowserRunnerClient(sameProjectRunner);
    const frame = document.querySelector('iframe')!;
    const postMessage = vi.spyOn(frame.contentWindow!, 'postMessage');
    frame.dispatchEvent(new Event('load'));
    const resultPromise = client.run(input);
    await vi.waitFor(() => expect(finishLoad).toBeTypeOf('function'));
    client.dispose();
    finishLoad({ scripts: { lab: 'x' }, assets: {}, bytes: 0 });

    await expect(resultPromise).resolves.toMatchObject({ status: 'stopped' });
    expect(postMessage).not.toHaveBeenCalled();
  });
});

it('escapes closing script text in generated bootstrap HTML', () => {
  const html = createSandboxDocument(
    'nonce',
    '</script><script>unexpected</script>',
  );

  expect(html).toContain('<\\/script');
  expect(html).not.toContain('</script><script>unexpected');
});
