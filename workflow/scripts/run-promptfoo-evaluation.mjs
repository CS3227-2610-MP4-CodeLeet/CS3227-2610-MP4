import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import {
  isProviderConfigurationReady,
  loadLocalEnvironment,
} from './evaluate-soclaas-models.mjs';

const repositoryRoot = resolve(
  fileURLToPath(new URL('../..', import.meta.url)),
);
const configPath = resolve(
  repositoryRoot,
  'workflow/experiments/promptfoo/promptfooconfig.yaml',
);
const controlledEnvFilePath = resolve(
  repositoryRoot,
  'workflow/experiments/promptfoo/offline-empty.env',
);
const promptfooCli = resolve(
  repositoryRoot,
  'node_modules/promptfoo/dist/src/entrypoint.js',
);

export function buildRunPlan(mode, inputEnv = {}) {
  if (mode !== 'offline' && mode !== 'live')
    return { args: [], env: { ...inputEnv }, error: 'unsupported_mode' };
  if (mode === 'live') {
    if (
      !isProviderConfigurationReady({
        enabled: inputEnv.SOCLAAS_AI_ENABLED,
        baseUrl: inputEnv.SOCLAAS_BASE_URL,
        apiKey: inputEnv.SOCLAAS_API_KEY,
      }) ||
      typeof inputEnv.SOCLAAS_MODEL !== 'string' ||
      inputEnv.SOCLAAS_MODEL.trim().length === 0
    )
      return {
        args: [],
        env: { ...inputEnv },
        error: 'provider_configuration_unavailable',
      };
  }

  const env = {
    ...inputEnv,
    PROMPTFOO_DISABLE_TELEMETRY: '1',
    PROMPTFOO_DISABLE_UPDATE: '1',
    PROMPTFOO_DISABLE_REMOTE_GENERATION: '1',
    PROMPTFOO_DISABLE_REDTEAM_REMOTE_GENERATION: '1',
  };
  if (mode === 'live') env.SOCLAAS_PROMPTFOO_LIVE = 'true';
  const childEnv =
    mode === 'offline'
      ? Object.fromEntries(
          Object.entries(env).filter(([key]) => !/^SOCLAAS_/i.test(key)),
        )
      : env;

  return {
    args: [
      promptfooCli,
      'eval',
      '-c',
      configPath,
      '--env-file',
      controlledEnvFilePath,
      '--safe-mode',
      '--no-share',
      '--no-cache',
      '--no-write',
    ],
    env: childEnv,
  };
}

async function main(mode = process.argv[2] ?? 'offline') {
  if (mode === 'live') await loadLocalEnvironment();
  const plan = buildRunPlan(mode, process.env);
  if (plan.error) {
    process.stderr.write(`Promptfoo evaluation stopped: ${plan.error}\n`);
    process.exitCode = 1;
    return;
  }
  const child = spawn(process.execPath, plan.args, {
    cwd: repositoryRoot,
    env: plan.env,
    stdio: 'inherit',
  });
  child.on('error', () => {
    process.stderr.write('Promptfoo evaluation could not start.\n');
    process.exitCode = 1;
  });
  child.on('exit', (code, signal) => {
    if (signal) process.exitCode = 1;
    else process.exitCode = code ?? 1;
  });
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main();
}
