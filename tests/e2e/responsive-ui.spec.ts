import { expect, type Page } from '@playwright/test';
import { test } from './helpers/responsive-ui-fixtures';
import type { CourseWorkspaceFixture } from './helpers/course-workspace-fixtures';
import { expectNoDocumentOverflow } from './helpers/responsive-layout';

const viewports = [320, 375, 768, 1024, 1440];
type RouteCheck = { path: string; heading: string | RegExp };
const publicRoutes = [
  '/',
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/reset-password',
  '/auth/course-invite',
  '/unauthorized',
];

test.use({
  baseURL: process.env.ACCOUNT_TEST_BASE_URL ?? 'http://127.0.0.1:3100',
});

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/sign-in');
  await page.getByLabel('Email or username', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(/\/courses$/);
}

async function expectHeaderUsable(page: Page, admin: boolean) {
  const primaryNavigation = page.getByRole('navigation', {
    name: 'Primary navigation',
  });
  const accountNavigation = page.getByRole('navigation', {
    name: 'Account navigation',
  });
  await expect(
    primaryNavigation.getByRole('link', { name: 'Courses' }),
  ).toBeVisible();
  await expect(
    accountNavigation.getByRole('link', { name: 'Profile' }),
  ).toBeVisible();
  await expect(
    accountNavigation.getByRole('button', { name: 'Sign out' }),
  ).toBeVisible();
  await expect(
    accountNavigation.getByRole('button', { name: /mode/ }),
  ).toBeVisible();
  if (admin) {
    await expect(
      primaryNavigation.getByRole('link', { name: 'User roles' }),
    ).toBeVisible();
  }

  const controls = page.locator('header a, header button');
  for (const control of await controls.all()) {
    const bounds = await control.boundingBox();
    expect(bounds, 'header control should have a visible box').not.toBeNull();
    expect(
      bounds!.width,
      'header control should meet the 24px target width',
    ).toBeGreaterThanOrEqual(24);
    expect(
      bounds!.height,
      'header control should meet the 24px target height',
    ).toBeGreaterThanOrEqual(24);
  }

  await expectNoDocumentOverflow(page);
}

async function expectRouteContained(page: Page, path: string, width: number) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(path);
  const resolvedUrl = new URL(page.url());
  expect(resolvedUrl.pathname + resolvedUrl.search).toBe(path);
  const mainLandmark = page.locator('main');
  await expect(
    mainLandmark,
    `expected the ${path} page to expose its main landmark at ${width}px`,
  ).toHaveCount(1, { timeout: 10_000 });
  await expect(mainLandmark).toBeVisible();
  await expectNoDocumentOverflow(page);
}

async function expectRoutesAtWidths(page: Page, routes: RouteCheck[]) {
  for (const route of routes) {
    await page.goto(route.path);
    const resolvedUrl = new URL(page.url());
    expect(resolvedUrl.pathname + resolvedUrl.search).toBe(route.path);
    const mainLandmark = page.locator('main');
    await expect(mainLandmark).toHaveCount(1, { timeout: 10_000 });
    await expect(mainLandmark).toBeVisible();
    await expect(
      mainLandmark.getByRole('heading', {
        name: route.heading,
        exact: true,
        level: 1,
      }),
    ).toBeVisible();
    for (const width of viewports) {
      await page.setViewportSize({ width, height: 900 });
      await expectNoDocumentOverflow(page);
      await expect(page).not.toHaveURL(/\/sign-in(?:\?|$)/);
      if (route.path.endsWith('/ai-usage')) {
        await expectScrollableTable(page, 'Recent AI reviews table');
      }
    }
  }
}

async function expectScrollableTable(
  page: Page,
  name: string,
  requirePhoneOverflow = false,
) {
  const table = page.getByRole('table');
  await expect(table).toBeVisible();
  const scroller = table.locator('xpath=..');
  await expect(scroller).toHaveAttribute('tabindex', '0');
  await expect(scroller).toHaveAttribute('aria-label', name);
  await scroller.focus();
  await expect(scroller).toBeFocused();
  const geometry = await scroller.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  const viewportWidth = page.viewportSize()?.width ?? Infinity;
  if (requirePhoneOverflow && viewportWidth <= 375) {
    expect(geometry.scrollWidth).toBeGreaterThan(geometry.clientWidth);
  }
  if (geometry.scrollWidth > geometry.clientWidth) {
    await scroller.evaluate((element) => {
      element.scrollLeft = 0;
    });
    await scroller.press('ArrowRight');
    await expect
      .poll(() => scroller.evaluate((element) => element.scrollLeft))
      .toBeGreaterThan(0);
  }
}

function studentCourseRoutes(fixture: CourseWorkspaceFixture): RouteCheck[] {
  return [
    { path: '/courses', heading: 'Courses' },
    { path: '/profile', heading: 'Profile settings' },
    {
      path: `/courses/${fixture.studentCourseId}`,
      heading: /^Student course /,
    },
    {
      path: `/courses/${fixture.studentCourseId}/assignments`,
      heading: 'Your assignments',
    },
    {
      path: `/courses/${fixture.studentCourseId}/forums`,
      heading: 'Discussions',
    },
    {
      path: `/courses/${fixture.studentCourseId}/leaderboard`,
      heading: 'Leaderboard',
    },
  ];
}

function instructorCourseRoutes(fixture: CourseWorkspaceFixture): RouteCheck[] {
  return [
    { path: '/courses', heading: 'Courses' },
    { path: '/profile', heading: 'Profile settings' },
    {
      path: `/courses/${fixture.instructorCourseId}`,
      heading: /^Instructor course /,
    },
    {
      path: `/courses/${fixture.instructorCourseId}/ai-usage`,
      heading: 'AI Usage',
    },
    {
      path: `/courses/${fixture.instructorCourseId}/assignments`,
      heading: 'Assignments',
    },
    {
      path: `/courses/${fixture.instructorCourseId}/assignments/new`,
      heading: 'Create assignment',
    },
    {
      path: `/courses/${fixture.instructorCourseId}/context-comparison`,
      heading: 'AI Context Strategy Comparison',
    },
    {
      path: `/courses/${fixture.instructorCourseId}/forums`,
      heading: 'Discussions',
    },
    {
      path: `/courses/${fixture.instructorCourseId}/leaderboard`,
      heading: 'Leaderboard',
    },
    {
      path: `/courses/${fixture.instructorCourseId}/manage-users`,
      heading: 'Manage Users',
    },
  ];
}

async function addSyntheticAIUsage(
  page: Page,
  fixture: CourseWorkspaceFixture,
) {
  const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.MP4_E2E_SERVICE_ROLE_KEY;
  if (!serviceUrl || !serviceKey) {
    throw new Error('Responsive AI usage requires local fixture credentials.');
  }
  const usageId = crypto.randomUUID();
  const headers = {
    apikey: serviceKey,
    authorization: `Bearer ${serviceKey}`,
  };
  const response = await page.request.post(`${serviceUrl}/rest/v1/ai_usage`, {
    headers: { ...headers, Prefer: 'return=minimal' },
    data: {
      id: usageId,
      requester_id: fixture.instructor.id,
      course_id: fixture.instructorCourseId,
      review_type: 'instructor_evaluation',
      status: 'succeeded',
      input_tokens: 100,
      output_tokens: 25,
      token_source: 'estimate',
    },
  });
  expect(response.ok()).toBeTruthy();
  return async () => {
    const deleted = await page.request.delete(
      `${serviceUrl}/rest/v1/ai_usage?id=eq.${usageId}`,
      { headers },
    );
    expect(deleted.ok()).toBeTruthy();
  };
}

async function expectHeaderForUser(
  page: Page,
  email: string,
  password: string,
  admin = false,
) {
  await signIn(page, email, password);
  for (const width of viewports) {
    await page.setViewportSize({ width, height: 900 });
    await expectHeaderUsable(page, admin);
  }
}

test('public and account pages fit across the supported viewport widths', async ({
  page,
}) => {
  test.setTimeout(300_000);
  for (const width of viewports) {
    for (const path of publicRoutes) {
      await expectRouteContained(page, path, width);
    }
  }
});

test('student course pages fit across the supported widths', async ({
  page,
  courseWorkspaceFixture: fixture,
}) => {
  test.setTimeout(300_000);
  await signIn(page, fixture.student.email, fixture.password);
  await expectRoutesAtWidths(page, studentCourseRoutes(fixture));
});

test('instructor pages and AI usage table fit across the supported widths', async ({
  page,
  courseWorkspaceFixture: fixture,
}) => {
  test.setTimeout(300_000);
  const cleanup = await addSyntheticAIUsage(page, fixture);
  try {
    await signIn(page, fixture.instructor.email, fixture.password);
    await expectRoutesAtWidths(page, instructorCourseRoutes(fixture));
  } finally {
    await cleanup();
  }
});

test('admin user directory scroll region stays within the page and can receive focus', async ({
  page,
  responsiveAdminFixture,
}) => {
  await signIn(
    page,
    responsiveAdminFixture.email,
    responsiveAdminFixture.password,
  );
  await page.goto('/admin');
  const resolvedUrl = new URL(page.url());
  expect(resolvedUrl.pathname + resolvedUrl.search).toBe('/admin');
  for (const width of viewports) {
    await page.setViewportSize({ width, height: 900 });
    await expect(
      page.getByRole('heading', { name: 'User roles' }),
    ).toBeVisible();
    await expectScrollableTable(page, 'User directory table', true);
    await expectNoDocumentOverflow(page);
  }
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
});

test('student, instructor, and admin headers remain usable across viewport widths', async ({
  page,
  courseWorkspaceFixture: fixture,
  responsiveAdminFixture,
}) => {
  await expectHeaderForUser(page, fixture.student.email, fixture.password);
  await expectHeaderForUser(page, fixture.instructor.email, fixture.password);
  await expectHeaderForUser(
    page,
    responsiveAdminFixture.email,
    responsiveAdminFixture.password,
    true,
  );
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'CodeLeet' })).toBeFocused();
});
