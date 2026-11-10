type Environment = Record<string, string | undefined>;
export function serverEnvironment(env: Environment): Environment;
export function buildLocalE2eEnvironment(
  status: Record<string, string>,
  env: Environment,
  mode: 'build' | 'test',
  rateLimitSecret: string,
): Environment;
