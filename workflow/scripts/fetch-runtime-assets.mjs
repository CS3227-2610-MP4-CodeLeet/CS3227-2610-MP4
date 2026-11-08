// Fetch trusted runtime distributions for LOCAL BROWSER experiments only.
// This script never imports or executes the downloaded runtimes/student code.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const cache = resolve('.runtime-cache');
const manifest = JSON.parse(await readFile('workflow/evidence/runtime-feasibility/assets.json', 'utf8'));
const definitions = {
  python: {
    base: 'https://cdn.jsdelivr.net/pyodide/v314.0.7/full/',
    files: ['pyodide.mjs', 'pyodide.asm.mjs', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json'],
  },
  java: {
    base: 'https://www.teavm.org/playground/',
    files: ['compiler.wasm', 'compiler.wasm-runtime.js', 'compile-classlib-teavm.bin', 'runtime-classlib-teavm.bin'],
  },
};

for (const [language, definition] of Object.entries(definitions)) {
  await mkdir(resolve(cache, language), { recursive: true });
  for (const name of definition.files) {
    const pinned = manifest.assets.find((item) => item.language === language && item.name === name);
    if (!pinned || pinned.url !== definition.base + name)
      throw new Error(`No matching pinned manifest entry for ${language}/${name}.`);
    const path = resolve(cache, language, name);
    const cached = await readCachedAsset(path);
    if (cached && isVerifiedAsset(pinned, cached, language, name)) {
      console.log(`${language}/${name}: verified cached ${cached.length} bytes`);
      continue;
    }
    if (cached)
      console.log(`${language}/${name}: cached bytes differ; fetching the pinned asset again`);
    const bytes = await downloadAsset(definition, name);
    verifyPinnedAsset(pinned, bytes, language, name);
    await writeFile(path, bytes);
    console.log(`${language}/${name}: fetched and verified ${bytes.length} bytes`);
  }
}

async function readCachedAsset(path) {
  try { return await readFile(path); }
  catch { return undefined; }
}

async function downloadAsset(definition, name) {
  const response = await fetch(definition.base + name, { signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

function verifyPinnedAsset(pinned, bytes, language, name) {
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  if (pinned.bytes !== bytes.length || pinned.sha256 !== sha256)
    throw new Error(`Asset changed since review: ${language}/${name}. Re-review provenance before updating its hash.`);
}

function isVerifiedAsset(pinned, bytes, language, name) {
  try {
    verifyPinnedAsset(pinned, bytes, language, name);
    return true;
  } catch {
    return false;
  }
}
