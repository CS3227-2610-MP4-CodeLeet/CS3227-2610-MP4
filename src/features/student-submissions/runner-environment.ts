type RunnerEnvironment = Record<string, string | undefined>;

export const sameProjectRunner = 'same-project';

export function resolveBrowserRunnerOrigin(
  env: RunnerEnvironment,
): string | null {
  if (env.NODE_ENV === 'development') return 'http://127.0.0.1:3130';
  if (env.VERCEL_ENV === 'preview' || env.VERCEL_ENV === 'production')
    return sameProjectRunner;
  return null;
}
