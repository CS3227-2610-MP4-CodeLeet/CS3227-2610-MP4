// Node only orchestrates Chromium. Synthetic Python/Java execute in browser workers.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { type, release, arch } from 'node:os';
import { chromium } from '@playwright/test';

const started = new Date().toISOString();
const outputPath = process.argv[2] ?? 'workflow/evidence/runtime-feasibility/independent-browser-tests.json';
const sourceHashes = Object.fromEntries(await Promise.all(['lab.mjs', 'supervisor.mjs', 'worker.mjs', 'java-support.mjs', 'embed.mjs'].map(async (name) => [name, createHash('sha256').update(await readFile(`src/runtime-lab/${name}`)).digest('hex')])));
const assetManifestSha256 = createHash('sha256').update(await readFile('workflow/evidence/runtime-feasibility/assets.json')).digest('hex');
const previousReport = await readFile(outputPath, 'utf8').then(JSON.parse).catch(() => ({}));
const priorFailures = [...(previousReport.priorFailures ?? []), ...(previousReport.cases ?? []).filter((item) => !item.passed).map((item) => ({ measuredAt: previousReport.finished, ...item }))];
const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();
page.setDefaultTimeout(45000);
const cases = [];
const probeEvents = [];
const consoleErrors = [];
page.on('request', (request) => { if (request.url().includes('/probe')) probeEvents.push({ event: 'request-attempt', method: request.method(), url: request.url() }); });
page.on('requestfailed', (request) => { if (request.url().includes('/probe')) probeEvents.push({ event: 'request-failed', error: request.failure()?.errorText }); });
page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text().slice(0, 600)); });
const run = (source, timeoutMs = 3000) => page.evaluate((item) => window.runtimeLab.run(item), { language: 'python', source, timeoutMs });
const bridge = (javascript) => `import js\nprint('__RESULT__' + js.eval(${JSON.stringify(javascript)}))`;
async function test(name, operation) {
  const before = Date.now();
  try { const details = await operation(); cases.push({ name, passed: true, elapsedMs: Date.now() - before, ...details }); }
  catch (error) { cases.push({ name, passed: false, elapsedMs: Date.now() - before, error: String(error) }); }
  console.log(JSON.stringify(cases.at(-1)));
}
function parsed(result) {
  assert.equal(result.status, 'ok', JSON.stringify(result));
  const match = result.stdout.match(/__RESULT__(.*)/);
  assert.ok(match, result.stdout);
  return JSON.parse(match[1]);
}
try {
  let navigationError;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try { await page.goto('http://127.0.0.1:3130'); navigationError = undefined; break; }
    catch (error) { navigationError = error; await new Promise((resolve) => setTimeout(resolve, 500)); }
  }
  if (navigationError) throw navigationError;
  await page.waitForFunction(() => Boolean(window.runtimeLab));
  const environment = await page.evaluate(() => ({ userAgent: navigator.userAgent, platform: navigator.platform }));
  await test('concurrent-run-denied-during-preparation-and-stop', async () => {
    await page.route('**/assets.json', async (route) => { await new Promise((resolve) => setTimeout(resolve, 500)); await route.continue().catch(() => {}); });
    const result = await page.evaluate(async () => {
      const first = window.runtimeLab.run({ language: 'python', source: 'print("not expected")' });
      let secondError;
      try { await window.runtimeLab.run({ language: 'python', source: 'print("concurrent")' }); } catch (error) { secondError = error.message; }
      window.runtimeLab.stop();
      return { first: await first, secondError };
    });
    assert.equal(result.secondError, 'Only one lab run at a time');
    assert.equal(result.first.status, 'stopped');
    await page.waitForTimeout(600);
    await page.evaluate(() => window.runtimeLab.prepare('python'));
    await page.unroute('**/assets.json');
    return result;
  });
  await test('python-stdin-positive-control', async () => {
    const result = await page.evaluate(() => window.runtimeLab.run({ language: 'python', source: 'print("hello " + input())', stdin: 'browser\n' }));
    assert.equal(result.status, 'ok'); assert.equal(result.stdout, 'hello browser\n'); return { result };
  });
  await test('failed-java-asset-load-allows-retry', async () => {
    await page.route('**/assets/java/compiler.wasm', (route) => route.fulfill({ status: 503, body: 'Synthetic missing asset' }));
    const error = await page.evaluate(async () => {
      try { await window.runtimeLab.run({ language: 'java', source: 'public class Main {}' }); return 'unexpected-success'; }
      catch (error) { return error.message; }
    });
    await page.unroute('**/assets/java/compiler.wasm');
    assert.equal(error, 'Missing asset: compiler.wasm');
    return { error, retryCheck: 'Immediately following real-source Java positive control uses the same page/cache.' };
  });
  await test('java-real-source-positive-control', async () => {
    const result = await page.evaluate(() => window.runtimeLab.run({ language: 'java', source: 'public class Main { public static void main(String[] args) { System.out.println("independent Java"); } }', timeoutMs: 10000 }));
    assert.equal(result.status, 'ok'); assert.equal(result.stdout, 'independent Java\n'); return { result };
  });
  await test('opaque-worker-parent-credentials-and-dom', async () => {
    const canaryPresent = await page.evaluate(() => {
      document.cookie = 'runtime_synthetic_canary=nonsecret-test-value; SameSite=Strict; Path=/';
      localStorage.setItem('runtime_synthetic_canary', 'nonsecret-test-value');
      return document.cookie.includes('runtime_synthetic_canary=') && Boolean(localStorage.getItem('runtime_synthetic_canary'));
    });
    assert.equal(canaryPresent, true);
    const details = parsed(await run(bridge(`JSON.stringify((() => {
      const result = {};
      for (const name of ['window', 'document', 'parent', 'top', 'opener', 'localStorage', 'sessionStorage', 'Worker', 'SharedWorker']) result[name] = typeof self[name];
      try { result.cookie = document.cookie; } catch (error) { result.cookieError = error.name; }
      try { result.indexedDB = indexedDB.open('synthetic-probe').name; } catch (error) { result.indexedDBError = error.name; }
      result.origin = location.origin;
      return result;
    })())`)));
    for (const name of ['window', 'document', 'parent', 'top', 'opener', 'localStorage', 'sessionStorage', 'Worker', 'SharedWorker']) assert.equal(details[name], 'undefined', name);
    assert.equal(details.cookieError, 'ReferenceError'); assert.equal(details.origin, 'null');
    assert.equal(details.indexedDBError, 'SecurityError');
    return { canaryPresent, details, limitation: 'Worker constructor shadowing is functional hardening; DOM absence and opaque-origin storage denial are browser restrictions.' };
  });
  await test('csp-native-network-denial-server-counter', async () => {
    const before = await page.evaluate(async () => (await (await fetch('/metrics.json')).json()).probeRequests);
    // Positive recorder control: a trusted parent request must increment the counter.
    await page.evaluate(async () => { await fetch('/probe-recorder-positive-control'); });
    const baseline = await page.evaluate(async () => (await (await fetch('/metrics.json')).json()).probeRequests);
    assert.equal(baseline, before + 1);
    const javascript = `(async () => {
      const url = 'http://127.0.0.1:3130/probe-worker-';
      const result = {};
      let proto = Object.getPrototypeOf(self), nativeFetch;
      while (proto && !nativeFetch) { nativeFetch = Object.getOwnPropertyDescriptor(proto, 'fetch')?.value; proto = Object.getPrototypeOf(proto); }
      result.nativeFetchFound = typeof nativeFetch === 'function';
      for (const method of ['GET', 'POST']) {
        try { await nativeFetch.call(self, url + method, { method, credentials: 'include', mode: 'no-cors', body: method === 'POST' ? 'synthetic' : undefined }); result['fetch' + method] = 'unexpected-success'; }
        catch (error) { result['fetch' + method] = error.name; }
      }
      for (const method of ['GET', 'POST']) {
        try { const xhr = new XMLHttpRequest(); xhr.open(method, url + 'xhr-' + method, false); xhr.withCredentials = true; xhr.send(method === 'POST' ? 'synthetic' : undefined); result['xhr' + method] = 'unexpected-success'; }
        catch (error) { result['xhr' + method] = error.name; }
      }
      result.websocket = await new Promise((resolve) => {
        try { const socket = new WebSocket('ws://127.0.0.1:3130/probe-worker-websocket'); socket.onerror = () => resolve('blocked'); socket.onopen = () => { socket.close(); resolve('unexpected-success'); }; setTimeout(() => resolve('no-open-within-500ms'), 500); }
        catch (error) { resolve(error.name); }
      });
      try { importScripts(url + 'import-script'); result.importScripts = 'unexpected-success'; } catch (error) { result.importScripts = error.name; }
      try { await import(url + 'module-import'); result.moduleImport = 'unexpected-success'; } catch (error) { result.moduleImport = error.name; }
      try { new Worker(URL.createObjectURL(new Blob(['while(true){}']))); result.nestedWorker = 'unexpected-success'; } catch (error) { result.nestedWorker = error.name; }
      try { await fetch(url + 'shim'); result.shimFetch = 'unexpected-success'; } catch (error) { result.shimFetch = error.message; }
      return JSON.stringify(result);
    })()`;
    const result = await run(`import js\nprint('__RESULT__' + str(await js.eval(${JSON.stringify(javascript)})))`);
    const details = parsed(result);
    assert.equal(details.nativeFetchFound, true, 'Need native fetch, not merely asset shim');
    assert.equal(details.fetchGET, 'TypeError'); assert.equal(details.fetchPOST, 'TypeError');
    assert.equal(details.xhrGET, 'NetworkError'); assert.equal(details.xhrPOST, 'NetworkError');
    assert.ok(['blocked', 'SecurityError'].includes(details.websocket), JSON.stringify(details));
    assert.equal(details.importScripts, 'NetworkError'); assert.equal(details.moduleImport, 'TypeError'); assert.equal(details.nestedWorker, 'TypeError');
    assert.match(details.shimFetch, /Network denied/);
    const after = await page.evaluate(async () => (await (await fetch('/metrics.json')).json()).probeRequests);
    assert.equal(after, baseline, 'Worker requests reached the HTTP recorder');
    return { baseline, after, details };
  });
  await test('forged-ready-terminates-protocol', async () => {
    const result = await run('import js\njs.eval(\'self.postMessage({type:"ready"})\')\nwhile True: pass');
    assert.equal(result.status, 'protocol-error'); return { result };
  });
  await test('replayed-executing-cannot-reset-deadline', async () => {
    const result = await run('import js\njs.eval(\'self.postMessage({type:"executing"})\')\nwhile True: pass');
    assert.equal(result.status, 'protocol-error'); return { result };
  });
  await test('java-compilation-is-excluded-from-execution-time', async () => {
    const result = await page.evaluate(() => window.runtimeLab.run({ language: 'java', source: 'public class Main { public static void main(String[] args) { System.out.println("timing"); } }' }));
    assert.equal(result.status, 'ok'); assert.equal(result.stdout, 'timing\n');
    assert.ok(result.executionMs >= 0 && result.executionMs + 100 < result.totalMs, JSON.stringify(result));
    return { result, limitation: 'Local wall time only; no performance grading or cross-device comparison.' };
  });
  await test('empty-stdout-message-flood-terminates', async () => {
    const result = await run('import js\njs.eval(\'for(let i=0;i<5000;i++) self.postMessage({type:"stdout",text:""});\')\nwhile True: pass');
    assert.equal(result.status, 'message-limit'); assert.equal(result.stdout, ''); return { result };
  });
  await test('output-flood-retained-byte-limit', async () => {
    const result = await run('print("x" * 12000)');
    assert.equal(result.status, 'output-limit', JSON.stringify({ status: result.status, stdoutBytes: Buffer.byteLength(result.stdout), stderr: result.stderr })); assert.ok(Buffer.byteLength(result.stdout + result.stderr) <= 8192);
    return { status: result.status, retainedBytes: Buffer.byteLength(result.stdout + result.stderr), totalMs: result.totalMs };
  });
  await test('infinite-python-trusted-timeout', async () => {
    const result = await run('while True: pass', 300);
    assert.equal(result.status, 'timeout'); assert.ok(result.totalMs < 45000); return { result };
  });
  await test('stop-running-python-and-fresh-rerun', async () => {
    const loopStarted = page.waitForEvent('console', { predicate: (message) => message.text() === 'independent-stop-loop-started', timeout: 20000 });
    await page.evaluate(() => {
      window.__boundaryPending = window.runtimeLab.run({ language: 'python', source: 'import js\njs.eval(\'console.info("independent-stop-loop-started")\')\nwhile True: pass', timeoutMs: 10000 });
    });
    await loopStarted;
    const stopStarted = Date.now();
    const result = await page.evaluate(async () => { window.runtimeLab.stop(); return await window.__boundaryPending; });
    const stopRecoveryMs = Date.now() - stopStarted;
    assert.equal(result.status, 'stopped');
    const fresh = await run('print("fresh browser run")');
    assert.equal(fresh.status, 'ok'); assert.equal(fresh.stdout, 'fresh browser run\n'); return { result, stopRecoveryMs, fresh };
  });
  await page.evaluate(() => { document.cookie = 'runtime_synthetic_canary=; Max-Age=0; Path=/'; localStorage.removeItem('runtime_synthetic_canary'); });
  await writeFile(outputPath, JSON.stringify({
    task: outputPath.endsWith('independent-browser-tests.json') ? '/root/browser_boundary_tester' : '/root coordinator replay of previously independently authored harness', started, finished: new Date().toISOString(), node: process.version, browser: browser.version(), environment, os: { type: type(), release: release(), arch: arch() }, sourceHashes, assetManifestSha256,
    command: 'node workflow/scripts/verify-runtime-boundary.mjs', finalPolicy: "opaque sandbox allow-scripts; connect-src none; script-src nonce + blob + unsafe-eval; worker-src blob",
    cases, priorFailures, probeEvents, consoleErrors, limitations: ['Chromium only; no Firefox/WebKit claim.', 'No browser-process memory quota claim; bounded samples only.', 'Blocked request events can record attempts; server counter measures requests actually received.', 'No application integration, real credentials, or deployment tested.'],
  }, null, 2) + '\n');
  if (cases.some((item) => !item.passed)) process.exitCode = 1;
} finally { await browser.close(); }
