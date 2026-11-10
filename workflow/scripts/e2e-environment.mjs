export function serverEnvironment(env) {
  // Playwright merges this over its own process environment, so blanking is
  // intentional: deleting a property would allow the parent value back in.
  return {
    ...env,
    MP4_E2E_SERVICE_ROLE_KEY: '',
    MP4_LOCAL_SERVICE_ROLE_KEY: '',
    SUPABASE_SERVICE_ROLE_KEY: '',
    SERVICE_ROLE_KEY: '',
  };
}

export function buildLocalE2eEnvironment(status, env, mode, rateLimitSecret) {
  const publishableKey = status.PUBLISHABLE_KEY || status.ANON_KEY;
  if (
    !/^http:\/\/(localhost|127\.0\.0\.1):54321$/.test(status.API_URL ?? '') ||
    !publishableKey ||
    !status.SERVICE_ROLE_KEY ||
    !status.SECRET_KEY
  ) {
    throw new Error('Authenticated CI requires complete local Supabase settings.');
  }
  return {
    ...serverEnvironment(env),
    NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
    // The reviewed username lookup/rate-limit metadata client needs this key.
    SUPABASE_SECRET_KEY: status.SECRET_KEY,
    AUTH_RATE_LIMIT_SECRET: rateLimitSecret,
    SOCLAAS_AI_ENABLED: 'false',
    // Production build parity: enable the bundled, same-project browser runner.
    VERCEL_ENV: 'preview',
    MP4_AUTHENTICATED_E2E: '1',
    MP4_E2E_SERVICE_ROLE_KEY:
      mode === 'test' ? status.SERVICE_ROLE_KEY : '',
  };
}
