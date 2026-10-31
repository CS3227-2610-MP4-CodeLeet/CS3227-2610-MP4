import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const staticFiles = ['index.html', 'embed.html', 'embed.mjs', 'lab.mjs', 'supervisor.mjs', 'worker.mjs', 'java-support.mjs'];
const notices = ['PYODIDE-NOTICE.txt', 'TEAVM-OPENJDK-NOTICE.txt'];
const assetHosts = new Set(['cdn.jsdelivr.net', 'www.teavm.org']);
const projectSlug = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

function isHttpsOrigin(value) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.origin === value &&
      !url.username && !url.password && !url.search && !url.hash;
  } catch {
    return false;
  }
}

function requireDeploymentConfig(environment) {
  if (environment.BROWSER_RUNTIME_DISTRIBUTION_APPROVED !== 'true')
    throw new Error(
      'Runtime distribution review is pending. Do not publish Pyodide or TeaVM assets until the exact asset notices, provenance, and license review are approved.',
    );
  const appProject = environment.BROWSER_APP_VERCEL_PROJECT_SLUG;
  const scope = environment.BROWSER_VERCEL_SCOPE_SLUG;
  const productionOrigin = environment.BROWSER_APP_PRODUCTION_ORIGIN;
  const validProject = appProject && projectSlug.test(appProject);
  const validScope = scope && projectSlug.test(scope);
  if (!validProject || !validScope || !isHttpsOrigin(productionOrigin))
    throw new Error(
      'Set the browser app Vercel project slug, scope slug, and exact HTTPS production origin.',
    );
  return { appProject, scope, productionOrigin };
}

function deploymentPolicy({ appProject, scope, productionOrigin }) {
  return `const appProject = ${JSON.stringify(appProject)};
const scope = ${JSON.stringify(scope)};
const productionOrigin = ${JSON.stringify(productionOrigin)};
const deploymentSuffix = '-' + scope + '.vercel.app';

export function isAllowedParentOrigin(value) {
  try {
    const url = new URL(value);
    if (url.origin !== value || url.protocol !== 'https:') return false;
    if (value === productionOrigin) return true;
    if (!url.hostname.endsWith(deploymentSuffix)) return false;
    const deployment = url.hostname.slice(0, -deploymentSuffix.length);
    const branchPrefix = appProject + '-git-';
    if (deployment.startsWith(branchPrefix))
      return /^[a-z0-9][a-z0-9_-]{0,179}$/.test(deployment.slice(branchPrefix.length));
    const uniquePrefix = appProject + '-';
    return deployment.startsWith(uniquePrefix) && /^[a-z0-9]{1,64}$/.test(deployment.slice(uniquePrefix.length));
  } catch {
    return false;
  }
}
`;
}

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

async function loadManifest(root, override) {
  const manifest = override ?? JSON.parse(await readFile(
    resolve(root, 'workflow/evidence/runtime-feasibility/assets.json'), 'utf8',
  ));
  if (!Array.isArray(manifest.assets) || manifest.assets.length === 0)
    throw new Error('Runtime asset manifest is empty.');
  manifest.assets.forEach(validateAsset);
  return manifest;
}

function resolveBuildPaths(root, outputDirectory) {
  const absoluteRoot = resolve(root);
  const output = resolve(outputDirectory);
  const relativeOutput = relative(absoluteRoot, output);
  const normalized = relativeOutput.split(sep).join('/');
  if (!relativeOutput || relativeOutput.startsWith(`..${sep}`) ||
      normalized !== 'workflow/runtime-runner/.runner-dist')
    throw new Error('Static runner output must be workflow/runtime-runner/.runner-dist.');
  return { absoluteRoot, output };
}

async function stageBridgeFiles(root, staging, policy) {
  for (const name of staticFiles)
    await copyFile(resolve(root, 'src/runtime-lab', name), resolve(staging, name));
  await writeFile(resolve(staging, 'deployment-policy.mjs'), deploymentPolicy(policy));
  await mkdir(resolve(staging, 'notices'), { recursive: true });
  for (const name of notices) {
    const source = resolve(root, 'workflow/runtime-runner/notices', name);
    const contents = await readFile(source, 'utf8');
    if (!contents.trim() || contents.includes('REVIEW REQUIRED'))
      throw new Error(`Runtime notice ${name} is not approved for distribution.`);
    await copyFile(source, resolve(staging, 'notices', name));
  }
}

async function stageAssets(staging, manifest, fetchImpl) {
  const assets = [];
  for (const asset of manifest.assets) {
    const response = await fetchImpl(asset.url, { redirect: 'error' });
    if (!response.ok) throw new Error(`Could not fetch reviewed asset: ${asset.name}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    const hash = createHash('sha256').update(bytes).digest('hex');
    if (bytes.byteLength !== asset.bytes || hash !== asset.sha256)
      throw new Error(`Runtime asset ${asset.name} failed size or SHA-256 verification.`);
    const path = `/assets/${asset.language}/${asset.sha256}/${asset.name}`;
    const target = resolve(staging, path.slice(1));
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, bytes);
    assets.push({ ...asset, path });
  }
  await writeFile(resolve(staging, 'assets.json'), `${JSON.stringify({ assets }, null, 2)}\n`);
}

async function replaceOutput(staging, output) {
  await rm(output, { recursive: true, force: true });
  await rename(staging, output);
}

export async function buildStaticRunner({
  repositoryRoot: root = repositoryRoot,
  outputDirectory = resolve(root, 'workflow/runtime-runner/.runner-dist'),
  environment = process.env,
  fetchImpl = fetch,
  assetManifest,
} = {}) {
  const policy = requireDeploymentConfig(environment);
  const { absoluteRoot, output } = resolveBuildPaths(root, outputDirectory);
  const manifest = await loadManifest(absoluteRoot, assetManifest);
  const staging = `${output}.staging-${process.pid}`;
  await rm(staging, { recursive: true, force: true });
  await mkdir(staging, { recursive: true });
  try {
    await stageBridgeFiles(absoluteRoot, staging, policy);
    await stageAssets(staging, manifest, fetchImpl);
    await replaceOutput(staging, output);
    return output;
  } catch (error) {
    await rm(staging, { recursive: true, force: true });
    throw error;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildStaticRunner().then(
    (output) => console.log(`Built static browser runner at ${output}`),
    (error) => {
      console.error(error instanceof Error ? error.message : 'Static runner build failed.');
      process.exitCode = 1;
    },
  );
}
