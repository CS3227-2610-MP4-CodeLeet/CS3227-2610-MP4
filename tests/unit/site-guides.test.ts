import { afterEach, expect, it } from 'vitest';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  prepareSiteDocs,
  rewriteGuideLinks,
} from '../../workflow/scripts/prepare-site-docs.mjs';

const directories: string[] = [];
const userGuidePath = 'docs/UserGuide.md';
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'codeleet-site-test-'));
  directories.push(root);
  await mkdir(join(root, 'docs'));
  await writeFile(
    join(root, userGuidePath),
    '# CodeLeet User Guide\n\n[Setup](DeveloperGuide.md#setup)\n',
  );
  await writeFile(
    join(root, 'docs/DeveloperGuide.md'),
    '# Developer Guide\n\n[Users](UserGuide.md)\n',
  );
  return root;
}
afterEach(async () => {
  for (const root of directories.splice(0)) {
    if (!root.startsWith(join(tmpdir(), 'codeleet-site-test-')))
      throw new Error('Unsafe test cleanup');
    await rm(root, { recursive: true, force: true });
  }
});

it('generates both site guides from canonical content and refreshes later edits', async () => {
  const root = await fixture();
  await prepareSiteDocs(root);
  const output = join(root, 'website/docs/UserGuide.md');
  expect(await readFile(output, 'utf8')).toContain('slug: /docs/UserGuide');
  expect(await readFile(output, 'utf8')).toContain(
    '[Setup](./DeveloperGuide.md#setup)',
  );
  await writeFile(
    join(root, userGuidePath),
    '# Updated student instructions\n',
  );
  await prepareSiteDocs(root);
  expect(await readFile(output, 'utf8')).toContain(
    '# Updated student instructions',
  );
  expect(await readFile(output, 'utf8')).not.toContain('[Setup]');
  expect(
    await readFile(join(root, 'website/docs/DeveloperGuide.md'), 'utf8'),
  ).toContain('[Users](./UserGuide.md)');
});

it('keeps web/anchor links and sends non-site repository files to GitHub', async () => {
  const root = await fixture();
  await writeFile(join(root, '.node-version'), '24');
  const content =
    '[Node](../.node-version) [Other](Other.md#details) [Web](https://example.test/) [Here](#setup)';
  const rewritten = rewriteGuideLinks(content, join(root, userGuidePath), root);
  expect(rewritten).toContain('/blob/develop/.node-version)');
  expect(rewritten).toContain('/blob/develop/docs/Other.md#details)');
  expect(rewritten).toContain('[Web](https://example.test/) [Here](#setup)');
});

it('rejects local links escaping the repository and keeps images as raw image URLs', async () => {
  const root = await fixture();
  const source = join(root, userGuidePath);
  expect(() =>
    rewriteGuideLinks('[Outside](../../outside.md)', source, root),
  ).toThrow(/outside the repository/);
  expect(rewriteGuideLinks('![Example](../image.png)', source, root)).toContain(
    'https://raw.githubusercontent.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/develop/image.png',
  );
});
