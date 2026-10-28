// Fetch trusted runtime distributions for LOCAL BROWSER experiments only.
// This script never imports or executes the downloaded runtimes/student code.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const cache = resolve('.runtime-cache');
let previous;
try { previous = JSON.parse(await readFile('workflow/evidence/runtime-feasibility/assets.json', 'utf8')); } catch { /* First reviewed fetch. */ }
const definitions = {
  python: {
    base: 'https://cdn.jsdelivr.net/pyodide/v314.0.7/full/',
    files: ['pyodide.mjs', 'pyodide.asm.mjs', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json'],
    license: 'MPL-2.0; bundled CPython/stdlib notices require retention before distribution',
    source: 'https://github.com/pyodide/pyodide',
  },
  java: {
    base: 'https://www.teavm.org/playground/',
    files: ['compiler.wasm', 'compiler.wasm-runtime.js', 'compile-classlib-teavm.bin', 'runtime-classlib-teavm.bin'],
    license: 'TeaVM-javac Apache-2.0 and OpenJDK GPLv2 with Classpath exception; distribution review pending',
    source: 'https://github.com/konsoletyper/teavm-javac',
  },
};

const report = { fetched_at: new Date().toISOString(), assets: [] };
for (const [language, definition] of Object.entries(definitions)) {
  await mkdir(resolve(cache, language), { recursive: true });
  for (const name of definition.files) {
    const entry = await fetchAsset(language, definition, name);
    verifyPinnedAsset(previous, language, name, entry.sha256);
    report.assets.push(entry);
    console.log(`${language}/${name}: ${entry.bytes} bytes`);
  }
}
await mkdir('workflow/evidence/runtime-feasibility', { recursive: true });
await writeFile('workflow/evidence/runtime-feasibility/assets.json', JSON.stringify(report, null, 2) + '\n');

async function fetchAsset(language, definition, name) {
  const path = resolve(cache, language, name);
  const bytes = await readCachedAsset(path) ?? await downloadAsset(path, definition, name);
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  return { language, name, url: definition.base + name, bytes: bytes.length, sha256, license: definition.license, source: definition.source };
}

async function readCachedAsset(path) {
  try { return await readFile(path); }
  catch { return undefined; }
}

async function downloadAsset(path, definition, name) {
  const response = await fetch(definition.base + name, { signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(path, bytes);
  return bytes;
}

function verifyPinnedAsset(previous, language, name, sha256) {
  const pinned = previous?.assets.find((item) => item.language === language && item.name === name);
  if (pinned && pinned.sha256 !== sha256)
    throw new Error(`Asset changed since review: ${language}/${name}. Re-review provenance before updating its hash.`);
}
