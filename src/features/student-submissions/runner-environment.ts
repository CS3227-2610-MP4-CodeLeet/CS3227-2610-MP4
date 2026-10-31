type RunnerEnvironment = Record<string, string | undefined>;

const projectSlug = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

function isProjectSlug(value: string | undefined): value is string {
  return Boolean(value && projectSlug.test(value));
}

function isCleanHttpsOrigin(value: string | undefined): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      url.origin === value &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash
    );
  } catch {
    return false;
  }
}

function previewProjectConfig(env: RunnerEnvironment) {
  const appSlug = env.BROWSER_APP_VERCEL_PROJECT_SLUG;
  const runnerSlug = env.BROWSER_RUNNER_VERCEL_PROJECT_SLUG;
  const scopeSlug = env.BROWSER_VERCEL_SCOPE_SLUG;
  if (
    !isProjectSlug(appSlug) ||
    !isProjectSlug(runnerSlug) ||
    !isProjectSlug(scopeSlug)
  )
    return null;
  return { appSlug, runnerSlug, scopeSlug };
}

function branchFromDeploymentUrl(
  branchUrl: string | undefined,
  appSlug: string,
  scopeSlug: string,
) {
  if (!branchUrl) return null;
  const prefix = `${appSlug}-git-`;
  const suffix = `-${scopeSlug}.vercel.app`;
  if (!branchUrl.startsWith(prefix) || !branchUrl.endsWith(suffix)) return null;
  const branch = branchUrl.slice(prefix.length, -suffix.length);
  return /^[a-z0-9][a-z0-9_-]{0,179}$/.test(branch) ? branch : null;
}

function previewRunnerOrigin(env: RunnerEnvironment) {
  const config = previewProjectConfig(env);
  if (!config) return null;
  const branch = branchFromDeploymentUrl(
    env.VERCEL_BRANCH_URL,
    config.appSlug,
    config.scopeSlug,
  );
  if (!branch) return null;
  return `https://${config.runnerSlug}-git-${branch}-${config.scopeSlug}.vercel.app`;
}

export function resolveBrowserRunnerOrigin(
  env: RunnerEnvironment,
): string | null {
  if (env.NODE_ENV === 'development') return 'http://127.0.0.1:3130';
  if (env.VERCEL_ENV === 'preview') return previewRunnerOrigin(env);
  if (env.VERCEL_ENV === 'production') {
    const origin = env.BROWSER_RUNNER_PRODUCTION_ORIGIN;
    return isCleanHttpsOrigin(origin) ? origin : null;
  }
  return null;
}
