import { cp, readFile, mkdir, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url));
const repository = 'CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4';
const guides = { UserGuide: 'User Guide', DeveloperGuide: 'Developer Guide' };

function localImageTarget(absolute, fragment, root) {
  const imgRel = relative(resolve(root, 'docs', 'images'), absolute)
    .split(sep)
    .map(encodeURIComponent)
    .join('/');
  return `pathname:///CS3227-2610-MP4/img/${imgRel}${fragment}`;
}

function assertLocalPath(local) {
  if (local === '..' || local.startsWith(`..${sep}`) || isAbsolute(local)) {
    throw new Error('Documentation link is outside the repository.');
  }
}

function findGuideTarget(absolute, image, fragment, root) {
  if (image) return null;
  for (const name of Object.keys(guides)) {
    if (absolute === resolve(root, 'docs', `${name}.md`)) {
      return `./${name}.md${fragment}`;
    }
  }
  return null;
}

function rewriteTarget(target, image, sourcePath, root) {
  if (/^(?:[a-z][a-z\d+.-]*:|\/|#)/i.test(target)) return target;
  const [path, ...fragments] = target.split('#');
  const absolute = resolve(dirname(sourcePath), decodeURIComponent(path));
  const local = relative(root, absolute);
  assertLocalPath(local);
  const fragment = fragments.length ? `#${fragments.join('#')}` : '';

  if (image && absolute.startsWith(resolve(root, 'docs', 'images'))) {
    return localImageTarget(absolute, fragment, root);
  }

  return (
    findGuideTarget(absolute, image, fragment, root) ??
    repositoryTarget(absolute, local, image, fragment)
  );
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

export function convertGithubAlerts(markdown) {
  return markdown.replace(
    /> \[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]([^\n]*)\n((?:>[^\n]*\n?)+)/g,
    (_match, type, title, body) => {
      const alertType =
        {
          NOTE: 'note',
          TIP: 'tip',
          IMPORTANT: 'info',
          WARNING: 'warning',
          CAUTION: 'danger',
        }[type] || 'note';
      const cleanTitle = title.trim();
      const cleanBody = body
        .split('\n')
        .map((line) => line.replace(/^> ?/, ''))
        .join('\n')
        .trim();
      const titleAttr = cleanTitle ? ` ${cleanTitle}` : '';
      return `:::${alertType}${titleAttr}\n\n${cleanBody}\n\n:::\n\n`;
    },
  );
}

export async function prepareSiteDocs(root = repositoryRoot) {
  const destination = join(root, 'website', 'docs');
  await mkdir(destination, { recursive: true });

  const sourceImages = join(root, 'docs', 'images');
  if (existsSync(sourceImages)) {
    const staticImages = join(root, 'website', 'static', 'img');
    await mkdir(staticImages, { recursive: true });
    await cp(sourceImages, staticImages, { recursive: true });
  }

  for (const [name, title] of Object.entries(guides)) {
    const sourcePath = join(root, 'docs', `${name}.md`);
    const rawContent = await readFile(sourcePath, 'utf8');
    const linkedContent = rewriteGuideLinks(rawContent, sourcePath, root);
    const content = convertGithubAlerts(linkedContent);
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
