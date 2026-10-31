import type { BrowserRun, RunInput } from './practice-tests';
import { loadBrowserRuntime } from './runtime-assets';
import { sameProjectRunner } from './runner-environment';

const encoder = new TextEncoder();

export function isTrustedMessage(
  event: MessageEvent,
  frame: HTMLIFrameElement,
  expected: { nonce: string; origin: string; hosted: boolean },
) {
  return (
    event.source === frame.contentWindow &&
    event.origin === (expected.hosted ? 'null' : expected.origin) &&
    event.data?.nonce === expected.nonce
  );
}

function isExecutionTime(value: unknown) {
  return (
    value === null ||
    (typeof value === 'number' && Number.isFinite(value) && value >= 0)
  );
}

function parseBrowserRun(value: unknown): BrowserRun | null {
  if (!value || typeof value !== 'object') return null;
  const result = value as Partial<BrowserRun>;
  if (
    typeof result.status !== 'string' ||
    result.status.length > 40 ||
    typeof result.stdout !== 'string' ||
    typeof result.stderr !== 'string' ||
    encoder.encode(result.stdout + result.stderr).length > 8192 ||
    !isExecutionTime(result.executionMs)
  )
    return null;
  return result as BrowserRun;
}

export function createSandboxDocument(nonce: string, parentOrigin: string) {
  const policy = `default-src 'none'; base-uri 'none'; form-action 'none'; connect-src 'none'; img-src 'none'; object-src 'none'; frame-src 'none'; script-src 'nonce-${nonce}' blob:; worker-src blob:`;
  const bootstrap = `
const parentOrigin = ${JSON.stringify(parentOrigin)};
const nonce = ${JSON.stringify(nonce)};
let runtime;
let runtimeModule;
let active;
function reply(data) {
  parent.postMessage({ ...data, nonce }, parentOrigin);
}
function validInput(input) {
  return Boolean(input) && ['python', 'java'].includes(input.language) &&
    typeof input.source === 'string' && new TextEncoder().encode(input.source).length <= 32768 &&
    typeof input.stdin === 'string' && new TextEncoder().encode(input.stdin).length <= 4096 &&
    input.timeoutMs === 5000;
}
addEventListener('message', async (event) => {
  const data = event.data;
  if (event.source !== parent || event.origin !== parentOrigin || data?.nonce !== nonce) return;
  if (data.type === 'initialize' && !runtimeModule) {
    if (!data.runtime || typeof data.runtime.scripts?.lab !== 'string') return;
    runtime = data.runtime;
    try {
      const url = URL.createObjectURL(new Blob([runtime.scripts.lab], { type: 'text/javascript' }));
      runtimeModule = await import(url);
      URL.revokeObjectURL(url);
      reply({ type: 'ready' });
    } catch {
      reply({ type: 'unavailable' });
    }
    return;
  }
  if (data.type === 'stop' && data.id === active) {
    runtimeModule?.stop();
    return;
  }
  if (data.type !== 'run' || active || !runtimeModule || !validInput(data.input)) return;
  active = data.id;
  try {
    reply({ type: 'result', id: active, result: await runtimeModule.run(data.input, runtime) });
  } catch {
    reply({ type: 'result', id: active, result: { status: 'unavailable', stdout: '', stderr: 'Browser runtime unavailable. Try again.', executionMs: null } });
  } finally {
    active = undefined;
  }
});`;
  return `<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${policy}"><script nonce="${nonce}">${bootstrap.replaceAll('</script', '<\\/script')}</script>`;
}

export class BrowserRunnerClient {
  private frame = document.createElement('iframe');
  private nonce = crypto.randomUUID();
  private pending?: {
    id: string;
    resolve: (value: BrowserRun) => void;
    timer: ReturnType<typeof setTimeout>;
  };
  private ready: Promise<void>;
  private connected = false;
  private disposed = false;
  private hosted: boolean;
  private origin: string;
  private readyTimer?: ReturnType<typeof setTimeout>;
  private cancelReady?: () => void;
  private readyFailure?: Error;
  private initializePromise?: Promise<void>;
  private initializeController = new AbortController();
  private frameLoaded: Promise<void>;

  constructor(origin: string) {
    this.hosted = origin === sameProjectRunner;
    this.origin = this.hosted ? location.origin : validateRunnerOrigin(origin);
    this.frame.hidden = true;
    this.frame.title = 'Browser code runner';
    this.frame.referrerPolicy = 'no-referrer';
    this.frame.sandbox.add('allow-scripts');
    this.frameLoaded = new Promise((resolve) => {
      this.frame.addEventListener('load', () => resolve(), { once: true });
    });
    this.ready = new Promise((resolve) => {
      this.cancelReady = resolve;
      this.readyTimer = setTimeout(
        () => this.finishReady(),
        this.hosted ? 60000 : 5000,
      );
    });
    window.addEventListener('message', this.receive);
    if (this.hosted) {
      this.frame.srcdoc = createSandboxDocument(this.nonce, this.origin);
    } else {
      this.frame.sandbox.add('allow-same-origin');
      this.frame.src = `${this.origin}/embed.html?parentOrigin=${encodeURIComponent(location.origin)}&nonce=${this.nonce}`;
    }
    document.body.append(this.frame);
  }

  private finishReady() {
    clearTimeout(this.readyTimer);
    this.cancelReady?.();
  }

  private receive = (event: MessageEvent) => {
    if (
      !isTrustedMessage(event, this.frame, {
        nonce: this.nonce,
        origin: this.origin,
        hosted: this.hosted,
      })
    )
      return;
    const data = event.data;
    if (data.type === 'ready') {
      this.connected = true;
      this.finishReady();
      return;
    }
    if (data.type === 'unavailable') {
      this.readyFailure = new Error(
        'Browser runtime could not initialize. Reload and try again.',
      );
      this.finishReady();
      return;
    }
    const pending = this.pending;
    if (data.type !== 'result' || !pending || data.id !== pending.id) return;
    const result = parseBrowserRun(data.result);
    if (!result) return;
    clearTimeout(pending.timer);
    pending.resolve(result);
    this.pending = undefined;
  };

  private async initializeHosted(language: RunInput['language']) {
    if (!this.hosted || this.initializePromise) return this.initializePromise;
    this.initializePromise = (async () => {
      await this.frameLoaded;
      const runtime = await loadBrowserRuntime(
        language,
        fetch,
        AbortSignal.any([
          this.initializeController.signal,
          AbortSignal.timeout(45000),
        ]),
      );
      if (this.disposed) return;
      const transfer = Object.values(runtime.assets);
      this.frame.contentWindow?.postMessage(
        { type: 'initialize', nonce: this.nonce, runtime },
        '*',
        transfer,
      );
    })().catch((error: unknown) => {
      this.readyFailure =
        error instanceof Error
          ? error
          : new Error(
              'Browser runtime could not be loaded. Reload and try again.',
            );
      this.finishReady();
    });
    return this.initializePromise;
  }

  async run(input: RunInput): Promise<BrowserRun> {
    if (this.hosted) await this.initializeHosted(input.language);
    await this.ready;
    if (this.disposed)
      return { status: 'stopped', stdout: '', stderr: '', executionMs: null };
    if (this.readyFailure) throw this.readyFailure;
    if (!this.connected)
      throw new Error(
        'The browser runner did not initialize. Reload and try again.',
      );
    if (this.pending) throw new Error('A browser run is already active.');
    return new Promise((resolve) => {
      const id = crypto.randomUUID();
      const timer = setTimeout(() => {
        this.dispose({
          status: 'unavailable',
          stdout: '',
          stderr: 'Browser runner exceeded its loading deadline. Try again.',
          executionMs: null,
        });
      }, 60000);
      this.pending = { id, resolve, timer };
      this.post({ type: 'run', nonce: this.nonce, id, input });
    });
  }

  stop() {
    if (this.pending) {
      this.post({ type: 'stop', nonce: this.nonce, id: this.pending.id });
      clearTimeout(this.pending.timer);
      this.pending.timer = setTimeout(() => this.dispose(), 500);
    } else this.dispose();
  }

  dispose(
    result: BrowserRun = {
      status: 'stopped',
      stdout: '',
      stderr: '',
      executionMs: null,
    },
  ) {
    if (this.disposed) return;
    this.disposed = true;
    this.initializeController.abort();
    this.stop();
    clearTimeout(this.readyTimer);
    this.cancelReady?.();
    if (this.pending) {
      clearTimeout(this.pending.timer);
      this.pending.resolve(result);
      this.pending = undefined;
    }
    window.removeEventListener('message', this.receive);
    this.frame.remove();
  }

  private post(message: Record<string, unknown>) {
    this.frame.contentWindow?.postMessage(
      message,
      this.hosted ? '*' : this.origin,
    );
  }
}

function validateRunnerOrigin(value: string) {
  const url = new URL(value);
  const isLocal =
    url.protocol === 'http:' &&
    url.hostname === '127.0.0.1' &&
    url.port === '3130';
  const isHosted =
    url.protocol === 'https:' &&
    url.origin === value &&
    !url.username &&
    !url.password &&
    !url.search &&
    !url.hash;
  if (!isLocal && !isHosted)
    throw new Error('The configured browser runner origin is invalid.');
  return url.origin;
}
