// Local static lab server ONLY: no source compilation/execution on Node.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const javascriptMime = 'text/javascript';
const files = new Map([
  ['/', ['src/runtime-lab/index.html', 'text/html']],
  ['/lab.mjs', ['src/runtime-lab/lab.mjs', javascriptMime]],
  ['/supervisor.mjs', ['src/runtime-lab/supervisor.mjs', javascriptMime]],
  ['/worker.mjs', ['src/runtime-lab/worker.mjs', javascriptMime]],
  ['/embed', ['src/runtime-lab/embed.html', 'text/html']],
  ['/embed.mjs', ['src/runtime-lab/embed.mjs', javascriptMime]],
  ['/java-support.mjs', ['src/runtime-lab/java-support.mjs', javascriptMime]],
  [
    '/assets.json',
    ['workflow/evidence/runtime-feasibility/assets.json', 'application/json'],
  ],
]);
for (const [language, names] of Object.entries({
  python: [
    'pyodide.mjs',
    'pyodide.asm.mjs',
    'pyodide.asm.wasm',
    'python_stdlib.zip',
    'pyodide-lock.json',
  ],
  java: [
    'compiler.wasm',
    'compiler.wasm-runtime.js',
    'compile-classlib-teavm.bin',
    'runtime-classlib-teavm.bin',
  ],
}))
  for (const name of names)
    files.set(`/assets/${language}/${name}`, [
      `.runtime-cache/${language}/${name}`,
      name.endsWith('.mjs') || name.endsWith('.js')
        ? javascriptMime
        : name.endsWith('.wasm')
          ? 'application/wasm'
          : 'application/octet-stream',
    ]);

let probeRequests = 0;
createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  if (pathname === '/metrics.json') {
    response
      .writeHead(200, { 'Content-Type': 'application/json' })
      .end(JSON.stringify({ probeRequests }));
    return;
  }
  if (pathname.startsWith('/probe')) probeRequests += 1;
  if (request.method !== 'GET') {
    response.writeHead(405).end();
    return;
  }
  const item = files.get(pathname);
  if (!item) {
    response.writeHead(404).end();
    return;
  }
  try {
    const bytes = await readFile(resolve(item[0]));
    response.writeHead(200, {
      'Content-Type': item[1],
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    response.end(bytes);
  } catch {
    response
      .writeHead(404)
      .end('Asset missing; run the reviewed asset fetch script.');
  }
}).listen(3130, '127.0.0.1', () =>
  console.log('Browser-only runtime lab: http://127.0.0.1:3130'),
);
