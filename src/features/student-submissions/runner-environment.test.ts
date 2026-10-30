import { expect, it } from 'vitest';
import { isLocalBrowserRunnerEnabled } from './runner-environment';
it.each([
  ['development', true],
  ['production', false],
  ['test', false],
  [undefined, false],
])('runner in %s is %s', (mode, expected) => {
  expect(isLocalBrowserRunnerEnabled(mode as string | undefined)).toBe(
    expected,
  );
});
