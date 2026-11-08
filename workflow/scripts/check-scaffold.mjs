import { readdir, readFile, access } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const required = [
  'README.md', 'AGENTS.md', 'CONTRIBUTING.md', '.env.example',
  'docs/UserGuide.md', 'docs/DeveloperGuide.md', 'docs/Reflections.md',
  'workflow/ProjectBrief.md', 'workflow/AssignmentChecklist.md',
  'workflow/AgentProcess.md', 'logs/README.md', 'website/docusaurus.config.js',
  'openspec/config.yaml',
  'openspec/changes/build-programming-platform/proposal.md',
  'openspec/changes/build-programming-platform/design.md',
  'openspec/changes/build-programming-platform/tasks.md',
];
const failures = [];
for (const path of required) {
  try { await access(resolve(root, path)); }
  catch { failures.push(`Missing required artifact: ${path}`); }
}

async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (['.git', '.agents', '.codex', 'node_modules', '.next', '.next-preview'].includes(entry.name)) continue;
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (extname(path) === '.md') files.push(path);
  }
  return files;
}

for (const file of await walk(root)) {
  const content = await readFile(file, 'utf8');
  for (const match of content.matchAll(/\[[^\]\n]+\]\(([^)\s]+)\)/g)) {
    const target = match[1];
    if (/^(?:[a-z]+:|#|\/)/i.test(target) || target.includes('<')) continue;
    const path = resolve(dirname(file), decodeURIComponent(target.split('#')[0]));
    if (path !== root && !path.startsWith(root.endsWith(sep) ? root : root + sep)) {
      failures.push(`Link outside repository: ${file} -> ${target}`);
      continue;
    }
    try { await access(path); }
    catch { failures.push(`Broken local link: ${file} -> ${target}`); }
  }
}

if (failures.length) {
  failures.forEach((failure) => console.error(failure));
  process.exitCode = 1;
} else {
  console.log('Scaffold artifacts and local Markdown link targets verified. Application behavior is not tested.');
}
