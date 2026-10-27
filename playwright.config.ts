import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  timeout: 60_000,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: 'http://127.0.0.1:3100', trace: 'retain-on-failure' },
  projects: [
    {
      name: 'chromium',
      testIgnore: [
        '**/assignment-preview.spec.ts',
        '**/browser-runtime.spec.ts',
      ],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'student-preview',
      testMatch: [
        '**/assignment-preview.spec.ts',
        '**/browser-runtime.spec.ts',
      ],
      use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:3101' },
    },
  ],
  // Optional local workaround when sandboxed Windows process-tree teardown stalls.
  webServer:
    process.env.PLAYWRIGHT_MANUAL_SERVERS === '1' && !process.env.CI
      ? []
      : [
          {
            command:
              'node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3100',
            url: 'http://127.0.0.1:3100',
            reuseExistingServer: false,
            timeout: 60_000,
            // Even accidentally setting this flag must not enable fixtures in production.
            env: {
              STUDENT_PREVIEW_ENABLED: 'true',
              STUDENT_RUNNER_PREVIEW_ENABLED: 'true',
            },
          },
          {
            command:
              'node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3101',
            url: 'http://127.0.0.1:3101',
            reuseExistingServer: false,
            timeout: 60_000,
            env: {
              STUDENT_PREVIEW_ENABLED: 'true',
              PLAYWRIGHT_PREVIEW: 'true',
              STUDENT_RUNNER_PREVIEW_ENABLED:
                process.env.RUN_BROWSER_RUNTIME_TESTS === '1'
                  ? 'true'
                  : 'false',
            },
          },
          ...(process.env.RUN_BROWSER_RUNTIME_TESTS === '1'
            ? [
                {
                  command: 'node src/runtime-lab/server.mjs',
                  url: 'http://127.0.0.1:3130',
                  reuseExistingServer: false,
                },
              ]
            : []),
        ],
});
