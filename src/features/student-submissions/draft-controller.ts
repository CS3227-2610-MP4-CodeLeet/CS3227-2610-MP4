import {
  DRAFT_EPOCH,
  draftKey,
  readDraft,
  writeDraft,
  type DraftContext,
  type DraftRecord,
} from './draft-storage';

export type DraftStatus =
  | 'loading'
  | 'idle'
  | 'saving'
  | 'saved'
  | 'recover'
  | 'conflict'
  | 'error'
  | 'stopped';
type Snapshot = {
  source: string;
  dirty: boolean;
  status: DraftStatus;
  savedAt?: number;
};
type Environment = {
  storage: () => Storage;
  lock: (work: () => void) => Promise<unknown>;
};

export class DraftController {
  private snapshot: Snapshot;
  private baseline: string;
  private expected: string | null = null;
  private epoch: string | null = null;
  private candidate: DraftRecord | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private listeners = new Set<() => void>();
  private initialized = false;
  private readable = false;
  private stopped = false;

  constructor(
    initialSource: string,
    private context?: DraftContext,
    private environment?: Environment,
  ) {
    this.baseline = initialSource;
    this.snapshot = { source: initialSource, dirty: false, status: 'loading' };
  }
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private update(status: DraftStatus, source = this.snapshot.source) {
    this.snapshot = {
      source,
      dirty: source !== this.baseline,
      status,
      savedAt: this.candidate?.savedAt,
    };
    for (const listener of this.listeners) listener();
  }

  start() {
    if (this.initialized) return;
    this.initialized = true;
    if (!this.context) return this.update('idle');
    try {
      const storage = this.environment!.storage();
      this.epoch = storage.getItem(DRAFT_EPOCH);
      this.expected = storage.getItem(draftKey(this.context));
      this.candidate = readDraft(storage, this.context)?.record ?? null;
      this.readable = true;
      this.update(
        this.candidate && this.candidate.source !== this.baseline
          ? 'recover'
          : 'idle',
      );
    } catch {
      this.update('error');
    }
  }

  edit = (source: string) => {
    if (['loading', 'recover', 'stopped'].includes(this.snapshot.status))
      return;
    const status = this.snapshot.status === 'conflict' ? 'conflict' : 'saving';
    this.update(this.context ? status : 'idle', source);
    this.schedule();
  };
  private schedule() {
    clearTimeout(this.timer);
    if (!this.context || this.stopped || this.snapshot.status === 'conflict')
      return;
    this.timer = setTimeout(() => void this.flush(), 500);
  }

  flush = async () => {
    clearTimeout(this.timer);
    if (
      !this.context ||
      this.stopped ||
      ['loading', 'recover', 'conflict'].includes(this.snapshot.status)
    )
      return;
    if (!this.readable) return this.update('error');
    try {
      await this.environment!.lock(() => this.persist());
    } catch {
      if (!this.stopped) this.update('error');
    }
  };
  private persist() {
    if (this.stopped || ['recover', 'conflict'].includes(this.snapshot.status))
      return;
    const result = writeDraft(this.environment!.storage(), {
      context: this.context!,
      source: this.snapshot.dirty ? this.snapshot.source : null,
      expected: this.expected,
      epoch: this.epoch,
    });
    if (result.status === 'invalidated') return this.stop();
    if (result.status === 'conflict') return this.externalChange();
    if (result.status === 'unavailable') return this.update('error');
    if (result.status === 'saved') {
      this.expected = result.raw;
      this.update(result.raw === null ? 'idle' : 'saved');
    }
  }

  externalChange = () => {
    if (!this.context || this.stopped) return;
    try {
      const storage = this.environment!.storage();
      if (storage.getItem(DRAFT_EPOCH) !== this.epoch) return this.stop();
      if (storage.getItem(draftKey(this.context)) === this.expected) return;
      clearTimeout(this.timer);
      this.candidate = readDraft(storage, this.context)?.record ?? null;
      this.update('conflict');
    } catch {
      this.update('error');
    }
  };

  resolve = (choice: 'restore' | 'discard' | 'keep' | 'load') => {
    if (!['recover', 'conflict'].includes(this.snapshot.status) || this.stopped)
      return;
    try {
      const storage = this.environment!.storage();
      if (storage.getItem(DRAFT_EPOCH) !== this.epoch) return this.stop();
      const raw = storage.getItem(draftKey(this.context!));
      // A changed recovery candidate must be presented again before accepting it.
      if (this.snapshot.status === 'recover' && raw !== this.expected)
        return this.externalChange();
      this.expected = raw;
      this.candidate = readDraft(storage, this.context!)?.record ?? null;
      this.applyChoice(choice);
    } catch {
      this.update('error');
    }
  };
  private applyChoice(choice: 'restore' | 'discard' | 'keep' | 'load') {
    const source =
      choice === 'keep'
        ? this.snapshot.source
        : (this.candidate?.source ?? this.baseline);
    this.update('saving', choice === 'discard' ? this.baseline : source);
    this.candidate = null;
    this.schedule();
  }

  acknowledge = (source: string) => {
    this.baseline = source;
    this.update(this.snapshot.status);
    this.schedule();
  };
  stop = () => {
    clearTimeout(this.timer);
    this.stopped = true;
    this.candidate = null;
    this.update('stopped');
  };
  dispose() {
    clearTimeout(this.timer);
    // In-flight flush may finish after unmount, but still checks the epoch/token.
    void this.flush();
  }
}
