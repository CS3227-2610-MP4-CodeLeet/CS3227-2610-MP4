// Trusted opaque iframe only. Student source executes exclusively in its worker.
addEventListener('message', function initialize(event) {
  if (
    event.source !== parent ||
    event.data?.command !== 'initialize' ||
    event.ports.length !== 1
  )
    return;
  removeEventListener('message', initialize);
  const port = event.ports[0];
  const workerURL = URL.createObjectURL(
    new Blob([event.data.workerSource], { type: 'text/javascript' }),
  );
  const worker = new Worker(workerURL);
  const encoder = new TextEncoder();
  let stdout = '';
  let stderr = '';
  let bytes = 0;
  let done = false;
  let state = 'initializing';
  let messages = 0;
  let timer;
  let executionStarted;
  let executionBudget;
  let phase = 'preparing';
  function finish(status, detail = '') {
    if (done) return;
    done = true;
    clearTimeout(timer);
    worker.terminate();
    URL.revokeObjectURL(workerURL);
    const remaining = Math.max(0, 8192 - bytes);
    stderr += new TextDecoder().decode(
      encoder.encode(detail).slice(0, remaining),
      { stream: true },
    );
    port.postMessage({
      type: 'result',
      status,
      stdout,
      stderr,
      executionMs:
        executionStarted === undefined
          ? null
          : performance.now() - executionStarted,
    });
    port.close();
  }
  worker.onerror = (event) =>
    finish(
      'worker-error',
      String(event.message || 'Opaque worker failed to start'),
    );
  worker.onmessage = ({ data }) => {
    if (done) return;
    messages += 1;
    if (messages > 4096) {
      finish('message-limit');
      return;
    }
    if (data?.type === 'ready') {
      if (state !== 'initializing') {
        finish('protocol-error');
        return;
      }
      state = 'ready';
      port.postMessage({ type: 'ready' });
    } else if (data?.type === 'executing') {
      if (state !== 'running' || phase !== 'preparing') {
        finish('protocol-error');
        return;
      }
      phase = 'executing';
      executionStarted = performance.now();
      clearTimeout(timer);
      timer = setTimeout(() => finish('timeout'), executionBudget);
    } else if (
      data?.type === 'done' &&
      [
        'ok',
        'error',
        'compile-error',
        'output-limit',
        'initialization-error',
        'compile-timeout',
      ].includes(data.status)
    )
      finish(data.status, typeof data.detail === 'string' ? data.detail : '');
    else if (
      ['stdout', 'stderr'].includes(data?.type) &&
      typeof data.text === 'string'
    ) {
      const chunk = encoder.encode(data.text);
      const allowed = Math.max(0, 8192 - bytes);
      const text = new TextDecoder().decode(chunk.slice(0, allowed), {
        stream: true,
      });
      if (data.type === 'stdout') stdout += text;
      else stderr += text;
      bytes += encoder.encode(text).length;
      if (chunk.length > allowed) finish('output-limit');
    }
  };
  port.onmessage = ({ data }) => {
    if (data?.command === 'stop') finish('stopped');
    else if (
      data?.command === 'run' &&
      !done &&
      state === 'ready' &&
      typeof data.source === 'string' &&
      typeof data.stdin === 'string' &&
      encoder.encode(data.source).length <= 32768 &&
      encoder.encode(data.stdin).length <= 4096
    ) {
      state = 'running';
      executionBudget = Math.min(
        Math.max(Number(data.timeoutMs) || 5000, 100),
        10000,
      );
      timer = setTimeout(() => finish('compile-timeout'), 20000);
      worker.postMessage({
        command: 'run',
        source: data.source,
        stdin: data.stdin,
      });
    }
  };
  worker.postMessage({
    command: 'initialize',
    assets: event.data.assets,
    language: event.data.language,
  });
});
