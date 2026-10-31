import { expect, it } from 'vitest';
import { resolveBrowserRunnerOrigin } from './runner-environment';

const appSlug = 'codeleet';
const runnerSlug = 'codeleet-runner';
const scopeSlug = 'team';
const branchAlias = `${appSlug}-git-feature-runner-${scopeSlug}.vercel.app`;

it('uses the local static runner only in development', () => {
  expect(resolveBrowserRunnerOrigin({ NODE_ENV: 'development' })).toBe(
    'http://127.0.0.1:3130',
  );
  expect(resolveBrowserRunnerOrigin({ NODE_ENV: 'test' })).toBe(null);
  expect(resolveBrowserRunnerOrigin({ NODE_ENV: 'production' })).toBe(null);
});

it('pairs a Preview runner with the app deployment branch alias', () => {
  expect(
    resolveBrowserRunnerOrigin({
      NODE_ENV: 'production',
      VERCEL_ENV: 'preview',
      VERCEL_BRANCH_URL: branchAlias,
      BROWSER_APP_VERCEL_PROJECT_SLUG: appSlug,
      BROWSER_RUNNER_VERCEL_PROJECT_SLUG: runnerSlug,
      BROWSER_VERCEL_SCOPE_SLUG: scopeSlug,
    }),
  ).toBe(`https://${runnerSlug}-git-feature-runner-${scopeSlug}.vercel.app`);
});

it('uses an explicit HTTPS runner origin in Production', () => {
  expect(
    resolveBrowserRunnerOrigin({
      NODE_ENV: 'production',
      VERCEL_ENV: 'production',
      BROWSER_RUNNER_PRODUCTION_ORIGIN: 'https://runner.example.edu',
    }),
  ).toBe('https://runner.example.edu');
});

const rejectedConfigurations = [
  {
    VERCEL_ENV: 'preview',
    VERCEL_BRANCH_URL: `other-project-git-feature-${scopeSlug}.vercel.app`,
    BROWSER_APP_VERCEL_PROJECT_SLUG: appSlug,
    BROWSER_RUNNER_VERCEL_PROJECT_SLUG: runnerSlug,
    BROWSER_VERCEL_SCOPE_SLUG: scopeSlug,
  },
  {
    VERCEL_ENV: 'preview',
    VERCEL_BRANCH_URL: `${branchAlias}.attacker.example`,
    BROWSER_APP_VERCEL_PROJECT_SLUG: appSlug,
    BROWSER_RUNNER_VERCEL_PROJECT_SLUG: runnerSlug,
    BROWSER_VERCEL_SCOPE_SLUG: scopeSlug,
  },
  {
    VERCEL_ENV: 'preview',
    VERCEL_BRANCH_URL: `${appSlug}-git-branch%2Fattacker-${scopeSlug}.vercel.app`,
    BROWSER_APP_VERCEL_PROJECT_SLUG: appSlug,
    BROWSER_RUNNER_VERCEL_PROJECT_SLUG: runnerSlug,
    BROWSER_VERCEL_SCOPE_SLUG: scopeSlug,
  },
  {
    VERCEL_ENV: 'preview',
    VERCEL_BRANCH_URL: branchAlias,
    BROWSER_APP_VERCEL_PROJECT_SLUG: appSlug,
    BROWSER_RUNNER_VERCEL_PROJECT_SLUG: 'bad/path',
    BROWSER_VERCEL_SCOPE_SLUG: scopeSlug,
  },
  {
    VERCEL_ENV: 'production',
    BROWSER_RUNNER_PRODUCTION_ORIGIN: 'http://runner.example.edu',
  },
  {
    VERCEL_ENV: 'production',
    BROWSER_RUNNER_PRODUCTION_ORIGIN: 'https://runner.example.edu/path',
  },
];

it.each(rejectedConfigurations)(
  'fails closed for invalid hosted configuration %#',
  (env) => {
    expect(resolveBrowserRunnerOrigin({ NODE_ENV: 'production', ...env })).toBe(
      null,
    );
  },
);
