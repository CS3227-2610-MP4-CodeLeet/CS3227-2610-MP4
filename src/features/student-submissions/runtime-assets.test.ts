import { createHash } from 'node:crypto';
import { expect, it, vi } from 'vitest';
import { loadBrowserRuntime } from './runtime-assets';

const sourceFiles = {
  lab: 'export async function run() { return "ok"; }',
  supervisor: 'supervisor source',
  worker: 'worker source',
  'java-support': 'java helpers',
};
const runtimeBytes = new TextEncoder().encode('pyodide wasm bytes')
  .buffer as ArrayBuffer;
const manifestPath = '/runtime/manifest.json';

function fileRecord(path: string, value: string | ArrayBuffer) {
  const bytes =
    typeof value === 'string'
      ? new TextEncoder().encode(value)
      : new Uint8Array(value);
  return {
    path,
    bytes: bytes.byteLength,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  };
}

function fixture(language: 'python' | 'java' = 'python') {
  const version = 'a'.repeat(20);
  const bridge = Object.fromEntries(
    Object.entries(sourceFiles).map(([name, source]) => [
      name,
      fileRecord(`/runtime/${version}/bridge/${name}.mjs`, source),
    ]),
  );
  const assetNames =
    language === 'python'
      ? [
          'pyodide.mjs',
          'pyodide.asm.mjs',
          'pyodide.asm.wasm',
          'python_stdlib.zip',
          'pyodide-lock.json',
        ]
      : [
          'compiler.wasm',
          'compiler.wasm-runtime.js',
          'compile-classlib-teavm.bin',
          'runtime-classlib-teavm.bin',
        ];
  const assets = assetNames.map((name) => {
    const file = fileRecord('', runtimeBytes);
    return {
      language,
      name,
      ...file,
      path: `/runtime/${version}/assets/${language}/${file.sha256}/${name}`,
    };
  });
  const manifest = { version, bridge, assets };
  const files = new Map<string, string | ArrayBuffer>([
    [manifestPath, JSON.stringify(manifest)],
    ...Object.entries(sourceFiles).map(
      ([name, source]) => [bridge[name].path, source] as const,
    ),
    ...assets.map((asset) => [asset.path, runtimeBytes] as const),
  ]);
  const requestOptions: RequestInit[] = [];
  const fetchImpl = vi.fn(
    async (input: RequestInfo | URL, options?: RequestInit) => {
      if (options) requestOptions.push(options);
      const path = String(input);
      const content = files.get(path);
      return content === undefined
        ? new Response('missing', { status: 404 })
        : new Response(content);
    },
  );
  return { fetchImpl, manifest, requestOptions };
}

it('loads only same-origin runtime bytes and verifies every SHA-256 before transfer', async () => {
  const { fetchImpl, requestOptions } = fixture();

  const runtime = await loadBrowserRuntime('python', fetchImpl);

  expect(runtime.scripts.lab).toContain('export async function run');
  expect(runtime.assets['pyodide.asm.wasm']).toEqual(runtimeBytes);
  expect(runtime.bytes).toBe(runtimeBytes.byteLength * 5);
  expect(fetchImpl.mock.calls.map(([path]) => String(path))).toContain(
    manifestPath,
  );
  expect(requestOptions.length).toBeGreaterThan(0);
  expect(
    requestOptions.every((options) => options.credentials === 'same-origin'),
  ).toBe(true);
  expect(
    fetchImpl.mock.calls.every(([path]) =>
      String(path).startsWith('/runtime/'),
    ),
  ).toBe(true);
});

it('loads the TeaVM compiler and class libraries for Java from the same deployment', async () => {
  const { fetchImpl } = fixture('java');

  const runtime = await loadBrowserRuntime('java', fetchImpl);

  expect(runtime.scripts['java-support']).toBe('java helpers');
  expect(Object.keys(runtime.assets)).toEqual(
    expect.arrayContaining([
      'compiler.wasm',
      'compiler.wasm-runtime.js',
      'compile-classlib-teavm.bin',
      'runtime-classlib-teavm.bin',
    ]),
  );
  expect(runtime.bytes).toBe(runtimeBytes.byteLength * 4);
});

it('rejects runtime content that does not match its committed hash', async () => {
  const { fetchImpl, manifest } = fixture();
  const assetPath = manifest.assets[0].path;
  fetchImpl.mockImplementation(async (input: RequestInfo | URL) => {
    if (String(input) === assetPath)
      return new Response('x'.repeat(runtimeBytes.byteLength));
    const { fetchImpl: original } = fixture();
    return original(input);
  });

  await expect(loadBrowserRuntime('python', fetchImpl)).rejects.toThrow(
    /integrity/i,
  );
});

it('rejects a manifest path outside the fixed same-deployment runtime tree', async () => {
  const { fetchImpl, manifest } = fixture();
  manifest.assets[0].path = 'https://attacker.example/runtime.wasm';
  fetchImpl.mockImplementation(async (input: RequestInfo | URL) =>
    String(input) === manifestPath
      ? new Response(JSON.stringify(manifest))
      : new Response('unexpected fetch'),
  );

  await expect(loadBrowserRuntime('python', fetchImpl)).rejects.toThrow(
    /manifest/i,
  );
});
