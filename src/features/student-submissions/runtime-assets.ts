export type BrowserRuntimeLanguage = 'python' | 'java';

export type BrowserRuntimePayload = {
  scripts: Record<string, string>;
  assets: Record<string, ArrayBuffer>;
  bytes: number;
};

type RuntimeFile = { path: string; bytes: number; sha256: string };
type RuntimeManifest = {
  version: string;
  bridge: Record<string, RuntimeFile>;
  assets: (RuntimeFile & { language: BrowserRuntimeLanguage; name: string })[];
};

const bridgeFiles = {
  lab: 'lab.mjs',
  supervisor: 'supervisor.mjs',
  worker: 'worker.mjs',
  'java-support': 'java-support.mjs',
};
const requiredRuntimeFiles: Record<BrowserRuntimeLanguage, string[]> = {
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
};
const maximumRuntimeBytes = 128 * 1024 * 1024;

function isRuntimeFile(value: unknown): value is RuntimeFile {
  if (!value || typeof value !== 'object') return false;
  const file = value as Partial<RuntimeFile>;
  return (
    typeof file.path === 'string' &&
    Number.isSafeInteger(file.bytes) &&
    Number(file.bytes) > 0 &&
    typeof file.sha256 === 'string' &&
    /^[a-f0-9]{64}$/.test(file.sha256)
  );
}

function isManifest(value: unknown): value is RuntimeManifest {
  if (!value || typeof value !== 'object') return false;
  const manifest = value as Partial<RuntimeManifest>;
  return (
    typeof manifest.version === 'string' &&
    /^[a-f0-9]{20}$/.test(manifest.version) &&
    Boolean(manifest.bridge) &&
    Boolean(manifest.assets) &&
    typeof manifest.bridge === 'object' &&
    Array.isArray(manifest.assets)
  );
}

function validateManifest(
  manifest: RuntimeManifest,
  language: BrowserRuntimeLanguage,
) {
  const prefix = `/runtime/${manifest.version}/`;
  for (const [key, fileName] of Object.entries(bridgeFiles)) {
    const file = manifest.bridge[key];
    if (!isRuntimeFile(file) || file.path !== `${prefix}bridge/${fileName}`)
      throw new Error('Browser runtime manifest is invalid.');
  }
  const selected = manifest.assets.filter(
    (asset) => asset?.language === language,
  );
  const names = selected.map((asset) => asset.name).sort();
  const expectedNames = [...requiredRuntimeFiles[language]].sort();
  if (
    names.length !== expectedNames.length ||
    names.some((name, index) => name !== expectedNames[index])
  )
    throw new Error('Browser runtime manifest is invalid.');
  for (const asset of selected) {
    if (
      !isRuntimeFile(asset) ||
      !/^[a-zA-Z0-9._-]+$/.test(asset.name) ||
      asset.path !== `${prefix}assets/${language}/${asset.sha256}/${asset.name}`
    )
      throw new Error('Browser runtime manifest is invalid.');
  }
  const scriptKeys =
    language === 'java'
      ? Object.keys(bridgeFiles)
      : ['lab', 'supervisor', 'worker'];
  const totalBytes = [
    ...selected.map((asset) => asset.bytes),
    ...scriptKeys.map((key) => manifest.bridge[key].bytes),
  ].reduce((sum, bytes) => sum + bytes, 0);
  if (!Number.isSafeInteger(totalBytes) || totalBytes > maximumRuntimeBytes)
    throw new Error('Browser runtime manifest exceeds the supported size.');
  return { selected, scriptKeys };
}

async function loadVerifiedFile(
  file: RuntimeFile,
  fetchImpl: typeof fetch,
  signal?: AbortSignal,
) {
  const response = await fetchImpl(file.path, {
    credentials: 'same-origin',
    cache: 'force-cache',
    ...(signal ? { signal } : {}),
  });
  if (!response.ok)
    throw new Error('Browser runtime files could not be loaded.');
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength !== file.bytes)
    throw new Error('Browser runtime file size did not match its manifest.');
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const actualHash = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
  if (actualHash !== file.sha256)
    throw new Error('Browser runtime integrity check failed.');
  return bytes;
}

export async function loadBrowserRuntime(
  language: BrowserRuntimeLanguage,
  fetchImpl: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<BrowserRuntimePayload> {
  const manifestResponse = await fetchImpl('/runtime/manifest.json', {
    credentials: 'same-origin',
    cache: 'no-store',
    ...(signal ? { signal } : {}),
  });
  if (!manifestResponse.ok)
    throw new Error('Browser runtime is not available in this deployment.');
  let candidate: unknown;
  try {
    candidate = await manifestResponse.json();
  } catch {
    throw new Error('Browser runtime manifest could not be read.');
  }
  if (!isManifest(candidate))
    throw new Error('Browser runtime manifest is invalid.');
  const { selected, scriptKeys } = validateManifest(candidate, language);
  const [scripts, loadedAssets] = await Promise.all([
    Promise.all(
      scriptKeys.map(async (key) => {
        const bytes = await loadVerifiedFile(
          candidate.bridge[key],
          fetchImpl,
          signal,
        );
        return [
          key,
          new TextDecoder('utf-8', { fatal: true }).decode(bytes),
        ] as const;
      }),
    ),
    Promise.all(
      selected.map(
        async (asset) =>
          [
            asset.name,
            await loadVerifiedFile(asset, fetchImpl, signal),
          ] as const,
      ),
    ),
  ]);
  return {
    scripts: Object.fromEntries(scripts),
    assets: Object.fromEntries(loadedAssets),
    bytes: selected.reduce((sum, asset) => sum + asset.bytes, 0),
  };
}
