import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url));
const repository = 'CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4';
const guides = { UserGuide: 'User Guide', DeveloperGuide: 'Developer Guide' };

function rewriteTarget(target, image, sourcePath, root) {
  if (/^(?:[a-z][a-z\d+.-]*:|\/|#)/i.test(target)) return target;
  const [path, ...fragments] = target.split('#');
  const absolute = resolve(dirname(sourcePath), decodeURIComponent(path));
  const local = relative(root, absolute);
  if (local === '..' || local.startsWith(`..${sep}`) || isAbsolute(local))
    throw new Error('Documentation link is outside the repository.');
  const fragment = fragments.length ? `#${fragments.join('#')}` : '';
  for (const name of Object.keys(guides)) {
    if (!image && absolute === resolve(root, 'docs', `${name}.md`))
      return `./${name}.md${fragment}`;
  }
  return repositoryTarget(absolute, local, image, fragment);
}

function repositoryTarget(absolute, local, image, fragment) {
  const encoded = local.split(sep).map(encodeURIComponent).join('/');
  if (image)
    return `https://raw.githubusercontent.com/${repository}/develop/${encoded}${fragment}`;
  const kind =
    existsSync(absolute) && statSync(absolute).isDirectory() ? 'tree' : 'blob';
  return `https://github.com/${repository}/${kind}/develop/${encoded}${fragment}`;
}

export function rewriteGuideLinks(markdown, sourcePath, root = repositoryRoot) {
  return markdown.replace(
    /(!?)\[([^\]\n]*)\]\(([^)\s]+)\)/g,
    (_match, image, label, target) =>
      `${image}[${label}](${rewriteTarget(target, Boolean(image), sourcePath, root)})`,
  );
}

export async function prepareSiteDocs(root = repositoryRoot) {
  const destination = join(root, 'website', 'docs');
  await mkdir(destination, { recursive: true });
  for (const [name, title] of Object.entries(guides)) {
    const sourcePath = join(root, 'docs', `${name}.md`);
    const content = rewriteGuideLinks(
      await readFile(sourcePath, 'utf8'),
      sourcePath,
      root,
    );
    const metadata = `---\nid: ${name}\ntitle: ${title}\nsidebar_label: ${title}\nslug: /docs/${name}\n---\n\n`;
    await writeFile(join(destination, `${name}.md`), metadata + content);
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await prepareSiteDocs();
  process.stdout.write('Prepared CodeLeet User Guide and Developer Guide.\n');
}
