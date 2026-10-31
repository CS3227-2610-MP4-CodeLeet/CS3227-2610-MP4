import { createRequire } from 'node:module';
import { expect, it } from 'vitest';
import nextConfig from '../../next.config';

const require = createRequire(import.meta.url);
const pathToRegexp = require('next/dist/compiled/path-to-regexp')
  .pathToRegexp as (pattern: string) => RegExp;

it('keeps the runtime manifest outside the immutable asset cache rule', async () => {
  const headerRules = (await nextConfig.headers?.()) ?? [];
  const immutableRule = headerRules.find(({ headers }) =>
    headers.some(
      ({ key, value }) =>
        key === 'Cache-Control' && value.includes('immutable'),
    ),
  );

  expect(immutableRule).toBeDefined();
  const matcher = pathToRegexp(immutableRule!.source);
  expect(matcher.test('/runtime/manifest.json')).toBe(false);
  expect(matcher.test('/runtime/v123/bridge/lab.mjs')).toBe(true);
});
