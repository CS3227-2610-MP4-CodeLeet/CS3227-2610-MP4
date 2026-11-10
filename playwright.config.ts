import { defineConfig, devices } from '@playwright/test';
import { serverEnvironment } from './workflow/scripts/e2e-environment.mjs';

const productionTestUrl = 'http://127.0.0.1:3100';
const authenticatedCi = process.env.MP4_AUTHENTICATED_E2E === '1';

export default defineConfig({
  testDir: './tests/e2e',
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  timeout: 60_000,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: productionTestUrl,
    // Fixture admin calls use Playwright's request context. Never record their
    // authorization headers in authenticated CI traces or screenshots.
    trace: authenticatedCi ? 'off' : 'retain-on-failure',
    screenshot: 'off',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: [
        '**/assignment-preview.spec.ts',
        '**/browser-runtime.spec.ts',
        '**/local-runtime-startup.spec.ts',
        '**/workspace-layout.spec.ts',
      ],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'student-preview',
      testMatch: [
        '**/assignment-preview.spec.ts',
        '**/browser-runtime.spec.ts',
        '**/local-runtime-startup.spec.ts',
        '**/workspace-layout.spec.ts',
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
            url: productionTestUrl,
            reuseExistingServer: false,
            timeout: 60_000,
            // Even accidentally setting this flag must not enable fixtures in production.
            env: {
              ...serverEnvironment(process.env),
              APP_SITE_URL: productionTestUrl,
              PLAYWRIGHT_ASSIGNMENT_FIXTURES: 'true',
            },
          },
          {
            command:
              'node workflow/scripts/dev.mjs --hostname 127.0.0.1 --port 3101',
            url: 'http://127.0.0.1:3101',
            reuseExistingServer: false,
            timeout: 60_000,
            env: {
              ...serverEnvironment(process.env),
              PLAYWRIGHT_ASSIGNMENT_FIXTURES: 'true',
              PLAYWRIGHT_PREVIEW: 'true',
              MP4_DEV_SKIP_RUNTIME_FETCH:
                process.env.RUN_BROWSER_RUNTIME_TESTS === '1'
                  ? 'false'
                  : 'true',
            },
          },
        ],
});
