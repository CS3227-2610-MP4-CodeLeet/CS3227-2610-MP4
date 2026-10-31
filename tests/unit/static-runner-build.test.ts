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

function hashAssetInventory(manifest: {
  assets: Array<Record<string, unknown>>;
}) {
  const assets = [...manifest.assets].sort((left, right) =>
    `${left.language}/${left.name}`.localeCompare(
      `${right.language}/${right.name}`,
    ),
  );
  return createHash('sha256').update(JSON.stringify(assets)).digest('hex');
}

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
  const approvalPath = join(
    root,
    runnerProjectPath,
    'distribution-approval.json',
  );
  await writeFile(
    approvalPath,
    JSON.stringify({
      status: 'approved',
      reviewed_at: '2026-10-31',
      reviewer: 'user-confirmed reviewer',
      assets_sha256: hashAssetInventory(manifest),
    }),
  );
  return { root, bytes, manifest };
}

it('emits a fixed same-project runtime tree with verified immutable asset paths', async () => {
  const { root, bytes, manifest } = await fixture();
  const fetchImpl = vi.fn(async () => new Response(bytes));
  const output = await buildStaticRunner({
    repositoryRoot: root,
    outputDirectory: runnerOutputPath(root),
    fetchImpl,
    assetManifest: manifest,
  });

  expect(output).toBe(runnerOutputPath(root));
  const builtManifest = JSON.parse(
    await readFile(join(output, manifestFile), 'utf8'),
  );
  expect((await readdir(output)).sort()).toEqual(
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
      join(output, builtManifest.assets[0].path.replace('/runtime/', '')),
    ),
  ).toEqual(bytes);
  expect(fetchImpl).toHaveBeenCalledOnce();
  expect(
    await readFile(
      join(output, builtManifest.version, 'notices', 'PYODIDE-NOTICE.txt'),
      'utf8',
    ),
  ).toContain('approved notice');
  expect(
    await readFile(
      join(
        output,
        builtManifest.version,
        'notices',
        'DISTRIBUTION-APPROVAL.json',
      ),
      'utf8',
    ),
  ).toContain('"status": "approved"');
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
      fetchImpl: async () => new Response('changed bytes'),
      assetManifest: manifest,
    }),
  ).rejects.toThrow(/SHA-256/);
});

it('rejects an asset inventory changed after human distribution review', async () => {
  const { root, manifest } = await fixture();
  const changedManifest = {
    assets: manifest.assets.map((asset) => ({
      ...asset,
      url: `${asset.url}?changed`,
    })),
  };

  await expect(
    buildStaticRunner({
      repositoryRoot: root,
      outputDirectory: runnerOutputPath(root),
      fetchImpl: async () => new Response('must not fetch'),
      assetManifest: changedManifest,
    }),
  ).rejects.toThrow(/approval does not match/i);
});

it('includes runtime assets without a distribution environment switch', async () => {
  const { root, manifest, bytes } = await fixture();
  const output = runnerOutputPath(root);
  const fetchImpl = vi.fn(async () => new Response(bytes));

  await expect(
    buildStaticRunner({
      repositoryRoot: root,
      outputDirectory: output,
      fetchImpl,
      assetManifest: manifest,
    }),
  ).resolves.toBe(output);
  expect(
    JSON.parse(await readFile(join(output, manifestFile), 'utf8')).assets,
  ).toHaveLength(1);
  expect(fetchImpl).toHaveBeenCalledOnce();
});

it('fails the build when any required notice is still under review', async () => {
  const { root, manifest } = await fixture();
  await writeFile(
    join(root, runnerProjectPath, 'notices', 'TEAVM-OPENJDK-NOTICE.txt'),
    'REVIEW REQUIRED',
  );

  await expect(
    buildStaticRunner({
      repositoryRoot: root,
      outputDirectory: runnerOutputPath(root),
      fetchImpl: async () => new Response('unused until notices pass'),
      assetManifest: manifest,
    }),
  ).rejects.toThrow(/notice .* not approved/i);
});
