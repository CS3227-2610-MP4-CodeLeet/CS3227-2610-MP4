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
import { pathToFileURL } from 'node:url';
import { afterEach, expect, it, vi } from 'vitest';
import { buildStaticRunner } from '../../workflow/scripts/build-static-runtime.mjs';

const temporaryDirectories: string[] = [];
const runnerProjectPath = join('workflow', 'runtime-runner');
const runnerOutputPath = (root: string) =>
  join(root, runnerProjectPath, '.runner-dist');
const appSlug = 'codeleet';
const scopeSlug = 'team';
const productionAppOrigin = `https://${appSlug}.example.edu`;
const previewAppOrigin = `https://${appSlug}-git-feature-runner-${scopeSlug}.vercel.app`;
const policyFile = 'deployment-policy.mjs';
const manifestFile = 'assets.json';

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((path) => rm(path, { recursive: true, force: true })),
  );
});

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'static-browser-runner-'));
  temporaryDirectories.push(root);
  const labDirectory = join(root, 'src', 'runtime-lab');
  const noticesDirectory = join(root, runnerProjectPath, 'notices');
  await mkdir(labDirectory, { recursive: true });
  await mkdir(noticesDirectory, { recursive: true });
  for (const name of [
    'index.html',
    'embed.html',
    'embed.mjs',
    policyFile,
    'lab.mjs',
    'supervisor.mjs',
    'worker.mjs',
    'java-support.mjs',
  ])
    await writeFile(join(labDirectory, name), `fixture:${name}`);
  for (const name of ['PYODIDE-NOTICE.txt', 'TEAVM-OPENJDK-NOTICE.txt'])
    await writeFile(join(noticesDirectory, name), `notice:${name}`);
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
  await writeFile(join(root, manifestFile), JSON.stringify(manifest));
  return { root, bytes, manifest };
}

const environment = {
  BROWSER_RUNTIME_DISTRIBUTION_APPROVED: 'true',
  BROWSER_APP_VERCEL_PROJECT_SLUG: appSlug,
  BROWSER_VERCEL_SCOPE_SLUG: scopeSlug,
  BROWSER_APP_PRODUCTION_ORIGIN: productionAppOrigin,
};

it('emits only the fixed static runner tree with verified content-hash asset paths', async () => {
  const { root, bytes, manifest } = await fixture();
  const fetchImpl = vi.fn(async () => new Response(bytes));
  const output = await buildStaticRunner({
    repositoryRoot: root,
    outputDirectory: runnerOutputPath(root),
    environment,
    fetchImpl,
    assetManifest: manifest,
  });

  expect((await readdir(output)).sort()).toEqual([
    'assets',
    manifestFile,
    policyFile,
    'embed.html',
    'embed.mjs',
    'index.html',
    'java-support.mjs',
    'lab.mjs',
    'notices',
    'supervisor.mjs',
    'worker.mjs',
  ]);
  const builtManifest = JSON.parse(
    await readFile(join(output, manifestFile), 'utf8'),
  );
  expect(builtManifest.assets[0].path).toBe(
    `/assets/python/${manifest.assets[0].sha256}/pyodide.asm.wasm`,
  );
  expect(
    await readFile(
      join(
        output,
        'assets',
        'python',
        manifest.assets[0].sha256,
        'pyodide.asm.wasm',
      ),
    ),
  ).toEqual(bytes);
  expect(fetchImpl).toHaveBeenCalledOnce();
  const policy = await import(
    `${pathToFileURL(join(output, policyFile)).href}?check=policy`
  );
  expect(policy.isAllowedParentOrigin(productionAppOrigin)).toBe(true);
  expect(policy.isAllowedParentOrigin(previewAppOrigin)).toBe(true);
  expect(
    policy.isAllowedParentOrigin(
      `https://${appSlug}-a1b2c3d4-${scopeSlug}.vercel.app`,
    ),
  ).toBe(true);
  expect(
    policy.isAllowedParentOrigin(
      `https://${appSlug}-${'a'.repeat(40)}-${scopeSlug}.vercel.app`,
    ),
  ).toBe(true);
  expect(
    policy.isAllowedParentOrigin(
      'https://someone-else-git-feature-team.vercel.app',
    ),
  ).toBe(false);
  expect(
    policy.isAllowedParentOrigin(`${previewAppOrigin}.attacker.example`),
  ).toBe(false);
  expect(
    policy.isAllowedParentOrigin(
      productionAppOrigin.replace('https:', 'http:'),
    ),
  ).toBe(false);
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

it('blocks distribution until the explicit license review gate is approved', async () => {
  const { root, manifest } = await fixture();
  await expect(
    buildStaticRunner({
      repositoryRoot: root,
      outputDirectory: runnerOutputPath(root),
      environment: {
        ...environment,
        BROWSER_RUNTIME_DISTRIBUTION_APPROVED: 'false',
      },
      fetchImpl: async () => new Response('not fetched'),
      assetManifest: manifest,
    }),
  ).rejects.toThrow(/distribution review/);
});
