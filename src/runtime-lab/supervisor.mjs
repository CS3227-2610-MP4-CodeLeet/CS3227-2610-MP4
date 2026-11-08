// Trusted opaque iframe only. Student source executes exclusively in its worker.
const initializingState = 'initializing';
const protocolError = 'protocol-error';
addEventListener('message', function initialize(event) {
  if (!isInitializeMessage(event)) return;
  removeEventListener('message', initialize);
  const port = event.ports[0];
  const workerURL = URL.createObjectURL(
    new Blob([event.data.workerSource], { type: 'text/javascript' }),
  );
  const worker = new Worker(workerURL);
  const context = createContext(port, worker, workerURL);
  worker.onerror = (error) =>
    context.finish(
      'worker-error',
      String(error.message || 'Opaque worker failed to start'),
    );
  worker.onmessage = ({ data }) => handleWorkerMessage(context, data);
  port.onmessage = ({ data }) => handlePortMessage(context, data);
  worker.postMessage({
    command: 'initialize',
    assets: event.data.assets,
    language: event.data.language,
  });
});

function isInitializeMessage(event) {
  return (
    event.source === parent &&
    event.data?.command === 'initialize' &&
    event.ports.length === 1
  );
}

function createContext(port, worker, workerURL) {
  const context = {
    port,
    worker,
    workerURL,
    encoder: new TextEncoder(),
    stdout: '',
    stderr: '',
    bytes: 0,
    done: false,
    state: initializingState,
    messages: 0,
    timer: undefined,
    executionStarted: undefined,
    executionBudget: undefined,
    phase: 'preparing',
  };
  context.finish = (status, detail = '') => finish(context, status, detail);
  return context;
}

function finish(context, status, detail = '') {
  if (context.done) return;
  context.done = true;
  clearTimeout(context.timer);
  context.worker.terminate();
  URL.revokeObjectURL(context.workerURL);
  appendDetail(context, detail);
  context.port.postMessage({
    type: 'result',
    status,
    stdout: context.stdout,
    stderr: context.stderr,
    executionMs:
      context.executionStarted === undefined
        ? null
        : performance.now() - context.executionStarted,
  });
  context.port.close();
}

function appendDetail(context, detail) {
  const remaining = Math.max(0, 8192 - context.bytes);
  context.stderr += new TextDecoder().decode(
    context.encoder.encode(detail).slice(0, remaining),
    { stream: true },
  );
}

function handleWorkerMessage(context, data) {
  if (context.done) return;
  if (++context.messages > 4096) return context.finish('message-limit');
  const handler = workerMessageHandlers[data?.type];
  if (handler) return handler(context, data);
  if (isOutputMessage(data)) handleOutput(context, data);
}

const workerMessageHandlers = {
  ready: handleReady,
  executing: handleExecuting,
  done: handleDone,
};

function isOutputMessage(data) {
  return (
    ['stdout', 'stderr'].includes(data?.type) && typeof data.text === 'string'
  );
}

function handleReady(context) {
  if (context.state !== initializingState) return context.finish(protocolError);
  context.state = 'ready';
  context.port.postMessage({ type: 'ready' });
}

function handleExecuting(context) {
  if (context.state !== 'running' || context.phase !== 'preparing')
    return context.finish(protocolError);
  context.phase = 'executing';
  context.executionStarted = performance.now();
  clearTimeout(context.timer);
  context.timer = setTimeout(
    () => context.finish('timeout'),
    context.executionBudget,
  );
}

function handleDone(context, data) {
  const statuses = [
    'ok',
    'error',
    'compile-error',
    'output-limit',
    'initialization-error',
    'compile-timeout',
  ];
  if (!statuses.includes(data.status)) return context.finish(protocolError);
  context.finish(
    data.status,
    typeof data.detail === 'string' ? data.detail : '',
  );
}

function handleOutput(context, data) {
  const chunk = context.encoder.encode(data.text);
  const allowed = Math.max(0, 8192 - context.bytes);
  const text = new TextDecoder().decode(chunk.slice(0, allowed), {
    stream: true,
  });
  if (data.type === 'stdout') context.stdout += text;
  else context.stderr += text;
  context.bytes += context.encoder.encode(text).length;
  if (chunk.length > allowed) context.finish('output-limit');
}

function handlePortMessage(context, data) {
  if (data?.command === 'stop') return context.finish('stopped');
  if (!isRunMessage(context, data)) return;
  context.state = 'running';
  context.executionBudget = Math.min(
    Math.max(Number(data.timeoutMs) || 5000, 100),
    10000,
  );
  context.timer = setTimeout(() => context.finish('compile-timeout'), 20000);
  context.worker.postMessage({
    command: 'run',
    source: data.source,
    stdin: data.stdin,
  });
}

function isRunMessage(context, data) {
  return (
    data?.command === 'run' &&
    !context.done &&
    context.state === 'ready' &&
    typeof data.source === 'string' &&
    typeof data.stdin === 'string' &&
    context.encoder.encode(data.source).length <= 32768 &&
    context.encoder.encode(data.stdin).length <= 4096
  );
}
