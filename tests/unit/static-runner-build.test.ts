import { createHash } from 'node:crypto';
import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';
import { buildStaticRunner } from '../../workflow/scripts/build-static-runtime.mjs';

const temporaryDirectories: string[] = [];
const runnerProjectPath = join('workflow', 'runtime-runner');
const runnerOutputPath = (root: string) => join(root, 'public', 'runtime');
const manifestFile = 'manifest.json';

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((path) => rm(path, { recursive: true, force: true })),
  );
});

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'same-project-browser-runtime-'));
  temporaryDirectories.push(root);
  const labDirectory = join(root, 'src', 'runtime-lab');
  const noticesDirectory = join(root, runnerProjectPath, 'notices');
  await mkdir(labDirectory, { recursive: true });
  await mkdir(noticesDirectory, { recursive: true });
  for (const name of [
    'lab.mjs',
    'supervisor.mjs',
    'worker.mjs',
    'java-support.mjs',
  ])
    await writeFile(join(labDirectory, name), `bridge:${name}`);
  for (const name of ['PYODIDE-NOTICE.txt', 'TEAVM-OPENJDK-NOTICE.txt'])
    await writeFile(join(noticesDirectory, name), `approved notice:${name}`);
  const bytes = Buffer.from('verified public runtime bytes');
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  const manifest = {
    assets: [
      {
        language: 'python',
        name: 'pyodide.asm.wasm',
        url: 'https://cdn.jsdelivr.net/runtime/pyodide.asm.wasm',
        bytes: bytes.length,
        sha256,
      },
    ],
  };
  await writeFile(
    join(root, 'workflow', 'assets.json'),
    JSON.stringify(manifest),
  );
  return { root, bytes, manifest };
}

const environment = { BROWSER_RUNTIME_DISTRIBUTION_APPROVED: 'true' };

it('emits a fixed same-project runtime tree with verified immutable asset paths', async () => {
  const { root, bytes, manifest } = await fixture();
  const fetchImpl = vi.fn(async () => new Response(bytes));
  const output = await buildStaticRunner({
    repositoryRoot: root,
    outputDirectory: runnerOutputPath(root),
    environment,
    fetchImpl,
    assetManifest: manifest,
  });

  expect(output).toBe(runnerOutputPath(root));
  const builtManifest = JSON.parse(
    await readFile(join(output!, manifestFile), 'utf8'),
  );
  expect((await readdir(output!)).sort()).toEqual(
    [builtManifest.version, 'manifest.json'].sort(),
  );
  expect(builtManifest.version).toMatch(/^[a-f0-9]{20}$/);
  expect(builtManifest.assets[0].path).toMatch(
    new RegExp(
      `^/runtime/${builtManifest.version}/assets/python/${manifest.assets[0].sha256}/pyodide\\.asm\\.wasm$`,
    ),
  );
  expect(builtManifest.bridge.lab.sha256).toMatch(/^[a-f0-9]{64}$/);
  expect(
    await readFile(
      join(output!, builtManifest.assets[0].path.replace('/runtime/', '')),
    ),
  ).toEqual(bytes);
  expect(fetchImpl).toHaveBeenCalledOnce();
  expect(
    await readFile(
      join(output!, builtManifest.version, 'notices', 'PYODIDE-NOTICE.txt'),
      'utf8',
    ),
  ).toContain('approved notice');
  expect(builtManifest.notices['PYODIDE-NOTICE.txt'].sha256).toMatch(
    /^[a-f0-9]{64}$/,
  );
});

it('rejects a runtime download that differs from the reviewed SHA-256', async () => {
  const { root, manifest } = await fixture();
  await expect(
    buildStaticRunner({
      repositoryRoot: root,
      outputDirectory: runnerOutputPath(root),
      environment,
      fetchImpl: async () => new Response('changed bytes'),
      assetManifest: manifest,
    }),
  ).rejects.toThrow(/SHA-256/);
});

it('omits stale runtime files while distribution approval is pending', async () => {
  const { root, manifest } = await fixture();
  const output = runnerOutputPath(root);
  await mkdir(output, { recursive: true });
  await writeFile(join(output, 'stale-runtime.js'), 'old output');
  const fetchImpl = vi.fn(async () => new Response('must not fetch'));

  await expect(
    buildStaticRunner({
      repositoryRoot: root,
      outputDirectory: output,
      environment: { BROWSER_RUNTIME_DISTRIBUTION_APPROVED: 'false' },
      fetchImpl,
      assetManifest: manifest,
    }),
  ).resolves.toBeNull();
  await expect(readdir(output)).rejects.toMatchObject({ code: 'ENOENT' });
  expect(fetchImpl).not.toHaveBeenCalled();
});

it('fails an approved build when any required notice is still under review', async () => {
  const { root, manifest } = await fixture();
  await writeFile(
    join(root, runnerProjectPath, 'notices', 'TEAVM-OPENJDK-NOTICE.txt'),
    'REVIEW REQUIRED',
  );

  await expect(
    buildStaticRunner({
      repositoryRoot: root,
      outputDirectory: runnerOutputPath(root),
      environment,
      fetchImpl: async () => new Response('unused until notices pass'),
      assetManifest: manifest,
    }),
  ).rejects.toThrow(/notice .* not approved/i);
});
