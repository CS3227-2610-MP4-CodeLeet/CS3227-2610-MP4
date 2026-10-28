import type { BrowserRun, RunInput } from './practice-tests';

// LOCAL development only. Production runner hosting remains a separate gate.
const origin = 'http://127.0.0.1:3130';

function isTrustedMessage(
  event: MessageEvent,
  frame: HTMLIFrameElement,
  nonce: string,
) {
  return (
    event.origin === origin &&
    event.source === frame.contentWindow &&
    event.data?.nonce === nonce
  );
}

function isValidExecutionTime(value: unknown) {
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
    new TextEncoder().encode(result.stdout + result.stderr).length > 8192 ||
    !isValidExecutionTime(result.executionMs)
  )
    return null;
  return result as BrowserRun;
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
  private readyTimer?: ReturnType<typeof setTimeout>;
  private cancelReady?: () => void;
  constructor() {
    this.frame.hidden = true;
    this.frame.title = 'Local browser code runner';
    this.frame.referrerPolicy = 'no-referrer';
    this.frame.sandbox.add('allow-scripts', 'allow-same-origin');
    this.ready = new Promise((resolve) => {
      this.cancelReady = resolve;
      this.readyTimer = setTimeout(resolve, 5000);
      this.resolveReady = () => {
        this.connected = true;
        clearTimeout(this.readyTimer);
        resolve();
      };
    });
    window.addEventListener('message', this.receive);
    this.frame.src = `${origin}/embed?parentOrigin=${encodeURIComponent(location.origin)}&nonce=${this.nonce}`;
    document.body.append(this.frame);
  }
  private resolveReady = () => {};
  private receive = (event: MessageEvent) => {
    if (!isTrustedMessage(event, this.frame, this.nonce)) return;
    const data = event.data;
    if (data.type === 'ready') {
      if (!this.disposed) this.resolveReady();
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
  async run(input: RunInput): Promise<BrowserRun> {
    await this.ready;
    if (this.disposed)
      return { status: 'stopped', stdout: '', stderr: '', executionMs: null };
    if (!this.connected)
      throw new Error(
        'Start the local browser runner on port 3130, then try again.',
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
      this.frame.contentWindow?.postMessage(
        { type: 'run', nonce: this.nonce, id, input },
        origin,
      );
    });
  }
  stop() {
    if (this.pending) {
      this.frame.contentWindow?.postMessage(
        { type: 'stop', nonce: this.nonce, id: this.pending.id },
        origin,
      );
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
}
