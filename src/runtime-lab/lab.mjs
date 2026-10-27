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
        const response = await get(`/assets/${language}/${asset.name}`);
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
  if (
    !['python', 'java'].includes(language) ||
    encoder.encode(source).length > 32768 ||
    encoder.encode(stdin).length > 4096
  )
    throw new Error('Invalid or oversized lab input');
  if (active) throw new Error('Only one lab run at a time');
  const overallStarted = performance.now();
  const controller = new AbortController();
  active = { stop: () => controller.abort('stopped') };
  const preparationDeadline = setTimeout(
    () => controller.abort('preparation-timeout'),
    45000,
  );
  let outcome;
  try {
    outcome = await Promise.race([
      prepare(language, controller.signal).then((runtime) => ({ runtime })),
      new Promise((resolve) =>
        controller.signal.addEventListener(
          'abort',
          () => resolve({ status: controller.signal.reason }),
          { once: true },
        ),
      ),
    ]);
  } catch (error) {
    active = undefined;
    clearTimeout(preparationDeadline);
    throw error;
  }
  clearTimeout(preparationDeadline);
  if (!outcome.runtime) {
    active = undefined;
    return {
      status: outcome.status,
      stdout: '',
      stderr: '',
      executionMs: null,
      totalMs: performance.now() - overallStarted,
    };
  }
  const runtime = outcome.runtime;
  return new Promise((resolve, reject) => {
    const started = performance.now();
    const frame = document.createElement('iframe');
    frame.sandbox = 'allow-scripts';
    frame.referrerPolicy = 'no-referrer';
    frame.hidden = true;
    const nonce = crypto.randomUUID().replaceAll('-', '');
    const policy = `default-src 'none'; base-uri 'none'; form-action 'none'; connect-src 'none'; img-src 'none'; object-src 'none'; frame-src 'none'; script-src 'nonce-${nonce}' blob: 'unsafe-eval'; worker-src blob:`;
    frame.srcdoc = `<meta http-equiv="Content-Security-Policy" content="${policy}"><script nonce="${nonce}">${runtime.supervisor.replaceAll('</script', '<\\/script')}</script>`;
    const channel = new MessageChannel();
    let finished = false;
    let stopRequested = false;
    let stopFallback;
    const finish = (result) => {
      if (finished) return;
      finished = true;
      clearTimeout(deadline);
      clearTimeout(stopFallback);
      channel.port1.postMessage({ command: 'stop' });
      channel.port1.close();
      frame.remove();
      active = undefined;
      resolve({
        ...result,
        language,
        totalMs: performance.now() - started,
        preparationMs: runtime.preparationMs,
        warmAssets: runtime.warmAssets,
        assetBytes: runtime.bytes,
        executionMs: result.executionMs ?? null,
      });
    };
    const deadline = setTimeout(
      () => finish({ status: 'parent-timeout', stdout: '', stderr: '' }),
      Math.max(1, 45000 - (performance.now() - overallStarted)),
    );
    active = {
      stop: () => {
        if (stopRequested) return;
        stopRequested = true;
        channel.port1.postMessage({ command: 'stop' });
        // The trusted supervisor retains bounded output and terminates its worker.
        // Still tear down the frame if it has not initialized or fails to reply.
        stopFallback = setTimeout(
          () => finish({ status: 'stopped', stdout: '', stderr: '' }),
          100,
        );
      },
    };
    channel.port1.onmessage = ({ data }) => {
      if (data?.type === 'ready') {
        if (stopRequested) return;
        channel.port1.postMessage({
          command: 'run',
          source,
          stdin,
          timeoutMs: Math.min(Math.max(timeoutMs, 100), 10000),
        });
      } else if (
        data?.type === 'result' &&
        typeof data.status === 'string' &&
        typeof data.stdout === 'string' &&
        typeof data.stderr === 'string' &&
        encoder.encode(data.stdout + data.stderr).length <= 8192
      )
        finish({ ...data, status: stopRequested ? 'stopped' : data.status });
    };
    frame.onload = () => {
      if (!finished)
        frame.contentWindow.postMessage(
          {
            command: 'initialize',
            language,
            assets: runtime.assets,
            workerSource: runtime.worker,
          },
          '*',
          [channel.port2],
        );
    };
    frame.onerror = () => {
      finish({ status: 'frame-error', stdout: '', stderr: '' });
      reject(new Error('Frame load failed'));
    };
    document.body.append(frame);
  });
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
