// One-command local development: pin-check runtime assets, then start Next and
// the loopback static file server. Node never compiles or executes submissions.
import { spawn, spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const skipRuntimeFetch = process.env.MP4_DEV_SKIP_RUNTIME_FETCH === 'true';
if (!skipRuntimeFetch) {
  const fetchResult = spawnSync(
    process.execPath,
    ['workflow/scripts/fetch-runtime-assets.mjs'],
    { stdio: 'inherit', env: process.env },
  );
  if (fetchResult.error) throw fetchResult.error;
  if (fetchResult.status !== 0)
    process.exit(fetchResult.status ?? 1);
} else {
  console.log('Skipping local runtime asset fetch (test configuration).');
}

const runner = spawn(process.execPath, ['src/runtime-lab/server.mjs'], {
  stdio: 'inherit',
  env: process.env,
});
const next = spawn(
  process.execPath,
  ['node_modules/next/dist/bin/next', 'dev', ...process.argv.slice(2)],
  { stdio: 'inherit', env: process.env },
);

let stopping = false;
async function stop(exitCode) {
  if (stopping) return;
  stopping = true;
  if (runner.exitCode === null) runner.kill();
  if (next.exitCode === null) next.kill();
  await Promise.all([waitForExit(runner), waitForExit(next)]);
  process.exit(exitCode);
}

runner.on('error', (error) => {
  console.error(`Could not start the local browser runner: ${error.message}`);
  void stop(1);
});
next.on('error', (error) => {
  console.error(`Could not start Next.js: ${error.message}`);
  void stop(1);
});
runner.on('exit', (code) => {
  if (!stopping)
    void stop(code === 0 ? 1 : (code ?? 1));
});
next.on('exit', (code) => {
  if (!stopping)
    void stop(code ?? 1);
});
process.on('SIGINT', () => void stop(130));
process.on('SIGTERM', () => void stop(143));

try {
  await waitForRunner(runner);
} catch (error) {
  console.error(error.message);
  await stop(1);
}

function waitForExit(child) {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve();
  return new Promise((resolve) => child.once('exit', resolve));
}

async function waitForRunner(child) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null || child.signalCode !== null)
      throw new Error('The local browser runner exited before it became ready.');
    try {
      const response = await fetch('http://127.0.0.1:3130/');
      if (
        response.ok &&
        (await response.text()).includes('Browser runtime feasibility lab')
      ) {
        console.log('Local browser runner ready at http://127.0.0.1:3130');
        return;
      }
    } catch {
      // The loopback server may still be binding its port.
    }
    await delay(100);
  }
  throw new Error('The local browser runner did not become ready on port 3130.');
}
