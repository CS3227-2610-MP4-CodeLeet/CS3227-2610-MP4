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
    const path = resolve(cache, language, name);
    let bytes;
    try { bytes = await readFile(path); }
    catch {
      const response = await fetch(definition.base + name, { signal: AbortSignal.timeout(60_000) });
      if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
      bytes = Buffer.from(await response.arrayBuffer());
      await writeFile(path, bytes);
    }
    const hash = createHash('sha256').update(bytes).digest('hex');
    const pinned = previous?.assets.find((item) => item.language === language && item.name === name);
    if (pinned && pinned.sha256 !== hash) throw new Error(`Asset changed since review: ${language}/${name}. Re-review provenance before updating its hash.`);
    const entry = { language, name, url: definition.base + name, bytes: bytes.length, sha256: hash, license: definition.license, source: definition.source };
    report.assets.push(entry);
    console.log(`${language}/${name}: ${bytes.length} bytes`);
  }
}
await mkdir('workflow/evidence/runtime-feasibility', { recursive: true });
await writeFile('workflow/evidence/runtime-feasibility/assets.json', JSON.stringify(report, null, 2) + '\n');
