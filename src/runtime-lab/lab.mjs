const prepared = new Map();
const encoder = new TextEncoder();
let active;

async function prepare(language, signal) {
  const warm = prepared.has(language);
  const started = performance.now();
  if (!prepared.has(language)) {
    const get = (url) =>
      fetch(url, {
        credentials: 'omit',
        signal: signal
          ? AbortSignal.any([signal, AbortSignal.timeout(15000)])
          : AbortSignal.timeout(15000),
      });
    const pending = (async () => {
      const manifest = await (await get('/assets.json')).json();
      const selected = manifest.assets.filter(
        (item) => item.language === language,
      );
      if (!selected.length) throw new Error('No reviewed assets for language');
      const assets = {};
      for (const asset of selected) {
        const response = await get(
          asset.path ?? `/assets/${language}/${asset.name}`,
        );
        if (!response.ok) throw new Error(`Missing asset: ${asset.name}`);
        const bytes = await response.arrayBuffer();
        const hash = Array.from(
          new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)),
          (byte) => byte.toString(16).padStart(2, '0'),
        ).join('');
        if (hash !== asset.sha256)
          throw new Error(`Integrity mismatch: ${asset.name}`);
        assets[asset.name] = bytes;
      }
      const [supervisor, worker] = await Promise.all(
        ['/supervisor.mjs', '/worker.mjs'].map(async (url) =>
          (await get(url)).text(),
        ),
      );
      if (language === 'java') {
        assets['java-support.mjs'] = encoder.encode(
          await (await get('/java-support.mjs')).text(),
        ).buffer;
      }
      return {
        assets,
        supervisor,
        worker,
        bytes: selected.reduce((sum, item) => sum + item.bytes, 0),
      };
    })();
    prepared.set(language, pending);
    pending.catch(() => {
      if (prepared.get(language) === pending) prepared.delete(language);
    });
  }
  return {
    ...(await prepared.get(language)),
    preparationMs: performance.now() - started,
    warmAssets: warm,
  };
}

export async function run({ language, source, stdin = '', timeoutMs = 5000 }) {
  validateRunInput(language, source, stdin);
  if (active) throw new Error('Only one lab run at a time');
  const overallStarted = performance.now();
  const controller = new AbortController();
  active = { stop: () => controller.abort('stopped') };
  const outcome = await prepareForRun(language, controller);
  if (!outcome.runtime) {
    active = undefined;
    return stoppedRunResult(outcome.status, overallStarted);
  }
  return startRuntimeFrame({
    language,
    source,
    stdin,
    timeoutMs,
    runtime: outcome.runtime,
    overallStarted,
  });
}

function validateRunInput(language, source, stdin) {
  if (
    !['python', 'java'].includes(language) ||
    encoder.encode(source).length > 32768 ||
    encoder.encode(stdin).length > 4096
  )
    throw new Error('Invalid or oversized lab input');
}

async function prepareForRun(language, controller) {
  const deadline = setTimeout(
    () => controller.abort('preparation-timeout'),
    45000,
  );
  try {
    return await Promise.race([
      prepare(language, controller.signal).then((runtime) => ({ runtime })),
      abortOutcome(controller.signal),
    ]);
  } catch (error) {
    active = undefined;
    throw error;
  } finally {
    clearTimeout(deadline);
  }
}

function abortOutcome(signal) {
  return new Promise((resolve) =>
    signal.addEventListener('abort', () => resolve({ status: signal.reason }), {
      once: true,
    }),
  );
}

function stoppedRunResult(status, started) {
  return {
    status,
    stdout: '',
    stderr: '',
    executionMs: null,
    totalMs: performance.now() - started,
  };
}

function startRuntimeFrame(options) {
  return new Promise((resolve, reject) => {
    const context = createFrameContext(options, resolve, reject);
    attachFrameHandlers(context);
    document.body.append(context.frame);
  });
}

function createFrameContext(options, resolve, reject) {
  const frame = document.createElement('iframe');
  frame.sandbox = 'allow-scripts';
  frame.referrerPolicy = 'no-referrer';
  frame.hidden = true;
  const nonce = crypto.randomUUID().replaceAll('-', '');
  const policy = `default-src 'none'; base-uri 'none'; form-action 'none'; connect-src 'none'; img-src 'none'; object-src 'none'; frame-src 'none'; script-src 'nonce-${nonce}' blob: 'unsafe-eval'; worker-src blob:`;
  frame.srcdoc = `<meta http-equiv="Content-Security-Policy" content="${policy}"><script nonce="${nonce}">${options.runtime.supervisor.replaceAll('</script', '<\\/script')}</script>`;
  const context = {
    ...options,
    frame,
    nonce,
    resolve,
    reject,
    channel: new MessageChannel(),
    started: performance.now(),
    finished: false,
    stopRequested: false,
  };
  context.deadline = setTimeout(
    () =>
      finishFrameRun(context, {
        status: 'parent-timeout',
        stdout: '',
        stderr: '',
      }),
    Math.max(1, 45000 - (performance.now() - options.overallStarted)),
  );
  active = { stop: () => requestFrameStop(context) };
  return context;
}

function attachFrameHandlers(context) {
  context.channel.port1.onmessage = ({ data }) =>
    handleFrameMessage(context, data);
  context.frame.onload = () => initializeFrame(context);
  context.frame.onerror = () => handleFrameError(context);
}

function finishFrameRun(context, result) {
  if (context.finished) return;
  context.finished = true;
  clearTimeout(context.deadline);
  clearTimeout(context.stopFallback);
  context.channel.port1.postMessage({ command: 'stop' });
  context.channel.port1.close();
  context.frame.remove();
  active = undefined;
  context.resolve({
    ...result,
    language: context.language,
    totalMs: performance.now() - context.started,
    preparationMs: context.runtime.preparationMs,
    warmAssets: context.runtime.warmAssets,
    assetBytes: context.runtime.bytes,
    executionMs: result.executionMs ?? null,
  });
}

function requestFrameStop(context) {
  if (context.stopRequested) return;
  context.stopRequested = true;
  context.channel.port1.postMessage({ command: 'stop' });
  context.stopFallback = setTimeout(
    () =>
      finishFrameRun(context, { status: 'stopped', stdout: '', stderr: '' }),
    100,
  );
}

function handleFrameMessage(context, data) {
  if (data?.type === 'ready') return sendRunCommand(context);
  if (isRuntimeResult(data))
    finishFrameRun(context, runtimeResult(context, data));
}

function sendRunCommand(context) {
  if (context.stopRequested) return;
  context.channel.port1.postMessage({
    command: 'run',
    source: context.source,
    stdin: context.stdin,
    timeoutMs: Math.min(Math.max(context.timeoutMs, 100), 10000),
  });
}

function isRuntimeResult(data) {
  return (
    data?.type === 'result' &&
    typeof data.status === 'string' &&
    typeof data.stdout === 'string' &&
    typeof data.stderr === 'string' &&
    encoder.encode(data.stdout + data.stderr).length <= 8192
  );
}

function runtimeResult(context, data) {
  return { ...data, status: context.stopRequested ? 'stopped' : data.status };
}

function initializeFrame(context) {
  if (context.finished) return;
  context.frame.contentWindow.postMessage(
    {
      command: 'initialize',
      language: context.language,
      assets: context.runtime.assets,
      workerSource: context.runtime.worker,
    },
    '*',
    [context.channel.port2],
  );
}

function handleFrameError(context) {
  finishFrameRun(context, { status: 'frame-error', stdout: '', stderr: '' });
  context.reject(new Error('Frame load failed'));
}
window.runtimeLab = { run, prepare, stop: () => active?.stop() };
const runButton = document.querySelector('#run');
if (runButton)
  runButton.onclick = async () => {
    const output = document.querySelector('#result');
    output.textContent = 'Running browser experiment…';
    try {
      output.textContent = JSON.stringify(
        await run({
          language: document.querySelector('#language').value,
          source: document.querySelector('#source').value,
          stdin: document.querySelector('#stdin').value,
        }),
        null,
        2,
      );
    } catch (error) {
      output.textContent = error.message;
    }
  };
const stopButton = document.querySelector('#stop');
if (stopButton) stopButton.onclick = () => active?.stop();
