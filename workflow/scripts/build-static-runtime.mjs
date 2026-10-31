import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const bridgeFiles = ['lab.mjs', 'supervisor.mjs', 'worker.mjs', 'java-support.mjs'];
const notices = ['PYODIDE-NOTICE.txt', 'TEAVM-OPENJDK-NOTICE.txt'];
const assetHosts = new Set(['cdn.jsdelivr.net', 'www.teavm.org']);

function hasValidMetadata(asset) {
  return (
    (asset.language === 'python' || asset.language === 'java') &&
    typeof asset.name === 'string' &&
    /^[a-zA-Z0-9._-]+$/.test(asset.name) &&
    typeof asset.sha256 === 'string' &&
    /^[a-f0-9]{64}$/.test(asset.sha256) &&
    Number.isSafeInteger(asset.bytes) &&
    asset.bytes > 0 &&
    typeof asset.url === 'string'
  );
}

function validateAsset(asset) {
  if (!asset || typeof asset !== 'object' || !hasValidMetadata(asset))
    throw new Error('Runtime manifest contains a malformed asset entry.');
  const url = new URL(asset.url);
  if (url.protocol !== 'https:' || !assetHosts.has(url.hostname))
    throw new Error(`Runtime asset source is not approved: ${asset.name}`);
  return asset;
}

function resolveBuildPaths(root, outputDirectory) {
  const absoluteRoot = resolve(root);
  const output = resolve(outputDirectory);
  const relativeOutput = relative(absoluteRoot, output);
  const normalized = relativeOutput.split(sep).join('/');
  if (!relativeOutput || relativeOutput.startsWith(`..${sep}`) || normalized !== 'public/runtime')
    throw new Error('Runtime output must be public/runtime within the app project.');
  return { absoluteRoot, output };
}

async function loadManifest(root, override) {
  const manifest = override ?? JSON.parse(await readFile(
    resolve(root, 'workflow/evidence/runtime-feasibility/assets.json'), 'utf8',
  ));
  if (!Array.isArray(manifest.assets) || manifest.assets.length === 0)
    throw new Error('Runtime asset manifest is empty.');
  manifest.assets.forEach(validateAsset);
  const identities = manifest.assets.map((asset) => `${asset.language}/${asset.name}`);
  if (new Set(identities).size !== identities.length)
    throw new Error('Runtime asset manifest contains duplicate files.');
  return manifest;
}

async function readBridgeSources(root) {
  const sources = {};
  for (const name of bridgeFiles) {
    const bytes = await readFile(resolve(root, 'src/runtime-lab', name));
    sources[name] = { bytes, sha256: hash(bytes) };
  }
  return sources;
}

function hash(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function createVersion(assets, bridge, approvedNotices) {
  const identity = JSON.stringify({
    assets: assets.map(({ language, name, sha256 }) => ({ language, name, sha256 }))
      .sort((left, right) => `${left.language}/${left.name}`.localeCompare(`${right.language}/${right.name}`)),
    bridge: Object.fromEntries(Object.entries(bridge).map(([name, file]) => [name, file.sha256])),
    notices: Object.fromEntries(Object.entries(approvedNotices).map(([name, notice]) => [name, notice.sha256])),
  });
  return hash(identity).slice(0, 20);
}

async function loadApprovedNotices(root) {
  const approvedNotices = {};
  for (const name of notices) {
    const source = resolve(root, 'workflow/runtime-runner/notices', name);
    const contents = await readFile(source, 'utf8');
    if (!contents.trim() || contents.includes('REVIEW REQUIRED'))
      throw new Error(`Runtime notice ${name} is not approved for distribution.`);
    approvedNotices[name] = {
      contents,
      bytes: Buffer.byteLength(contents),
      sha256: hash(Buffer.from(contents)),
    };
  }
  return approvedNotices;
}

async function stageNotices(staging, version, approvedNotices) {
  const target = resolve(staging, version, 'notices');
  await mkdir(target, { recursive: true });
  for (const [name, notice] of Object.entries(approvedNotices))
    await writeFile(resolve(target, name), notice.contents);
  return Object.fromEntries(Object.entries(approvedNotices).map(([name, notice]) => [name, {
    path: `/runtime/${version}/notices/${name}`,
    bytes: notice.bytes,
    sha256: notice.sha256,
  }]));
}

async function stageBridge(staging, version, sources) {
  const bridge = {};
  for (const [name, file] of Object.entries(sources)) {
    const path = `/runtime/${version}/bridge/${name}`;
    const target = resolve(staging, path.slice('/runtime/'.length));
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, file.bytes);
    bridge[name.replace('.mjs', '')] = {
      path,
      bytes: file.bytes.byteLength,
      sha256: file.sha256,
    };
  }
  return bridge;
}

async function stageAssets(staging, version, manifest, fetchImpl) {
  const assets = [];
  for (const asset of manifest.assets) {
    const response = await fetchImpl(asset.url, { redirect: 'error' });
    if (!response.ok) throw new Error(`Could not fetch reviewed asset: ${asset.name}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    const sha256 = hash(bytes);
    if (bytes.byteLength !== asset.bytes || sha256 !== asset.sha256)
      throw new Error(`Runtime asset ${asset.name} failed size or SHA-256 verification.`);
    const path = `/runtime/${version}/assets/${asset.language}/${asset.sha256}/${asset.name}`;
    const target = resolve(staging, path.slice('/runtime/'.length));
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, bytes);
    const { language, name, bytes: byteLength } = asset;
    assets.push({ language, name, bytes: byteLength, sha256, path });
  }
  return assets;
}

async function replaceOutput(staging, output) {
  await rm(output, { recursive: true, force: true });
  await rename(staging, output);
}

export async function buildStaticRunner({
  repositoryRoot: root = repositoryRoot,
  outputDirectory = resolve(root, 'public/runtime'),
  environment = process.env,
  fetchImpl = fetch,
  assetManifest,
} = {}) {
  const { absoluteRoot, output } = resolveBuildPaths(root, outputDirectory);
  if (environment.BROWSER_RUNTIME_DISTRIBUTION_APPROVED !== 'true') {
    await rm(output, { recursive: true, force: true });
    return null;
  }
  const manifest = await loadManifest(absoluteRoot, assetManifest);
  const bridgeSources = await readBridgeSources(absoluteRoot);
  const approvedNotices = await loadApprovedNotices(absoluteRoot);
  const version = createVersion(manifest.assets, bridgeSources, approvedNotices);
  const staging = `${output}.staging-${process.pid}`;
  await rm(staging, { recursive: true, force: true });
  await mkdir(staging, { recursive: true });
  try {
    const bridge = await stageBridge(staging, version, bridgeSources);
    const assets = await stageAssets(staging, version, manifest, fetchImpl);
    const stagedNotices = await stageNotices(staging, version, approvedNotices);
    await writeFile(
      resolve(staging, 'manifest.json'),
      `${JSON.stringify({ version, bridge, assets, notices: stagedNotices }, null, 2)}\n`,
    );
    await replaceOutput(staging, output);
    return output;
  } catch (error) {
    await rm(staging, { recursive: true, force: true });
    throw error;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildStaticRunner().then(
    (output) => console.log(output ? `Built same-project browser runtime at ${output}` : 'Browser runtime distribution is not approved; runtime files omitted.'),
    (error) => {
      console.error(error instanceof Error ? error.message : 'Browser runtime build failed.');
      process.exitCode = 1;
    },
  );
}
