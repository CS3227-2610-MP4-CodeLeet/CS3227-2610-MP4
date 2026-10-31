import { expect, it } from 'vitest';
import {
  resolveBrowserRunnerOrigin,
  sameProjectRunner,
} from './runner-environment';

it('uses the loopback runner only during local development', () => {
  expect(resolveBrowserRunnerOrigin({ NODE_ENV: 'development' })).toBe(
    'http://127.0.0.1:3130',
  );
  expect(resolveBrowserRunnerOrigin({ NODE_ENV: 'test' })).toBe(null);
  expect(resolveBrowserRunnerOrigin({ NODE_ENV: 'production' })).toBe(null);
});

it.each(['preview', 'production'])(
  'selects same-project static assets for approved %s deployments',
  (vercelEnvironment) => {
    expect(
      resolveBrowserRunnerOrigin({
        NODE_ENV: 'production',
        VERCEL_ENV: vercelEnvironment,
        BROWSER_RUNTIME_DISTRIBUTION_APPROVED: 'true',
      }),
    ).toBe(sameProjectRunner);
  },
);

it.each(['preview', 'production'])(
  'keeps hosted execution unavailable for unapproved %s deployments',
  (vercelEnvironment) => {
    expect(
      resolveBrowserRunnerOrigin({
        NODE_ENV: 'production',
        VERCEL_ENV: vercelEnvironment,
        BROWSER_RUNTIME_DISTRIBUTION_APPROVED: 'false',
      }),
    ).toBe(null);
  },
);
