import { expect, type Page, type APIRequestContext } from '@playwright/test';
import {
  test,
  appUrl,
  serviceUrl,
  maxXpLabel,
  configure,
  grade,
  headers,
} from './helpers/xp-fixtures';
import { revisionSession } from './helpers/revision-session';

const xpPath = '/student/xp';
const xpApi = '/api/student/xp';
test.use({ baseURL: appUrl, actionTimeout: 10_000 });
test.skip(
  !process.env.MP4_E2E_SERVICE_ROLE_KEY ||
    !/^http:\/\/(localhost|127\.0\.0\.1):54321$/.test(serviceUrl ?? ''),
  'Requires local synthetic accounts.',
);

for (const [index, language] of ['Python', 'Java'].entries()) {
  test(`${language}: instructor XP authoring, simultaneous publications and corrections stay consistent`, async ({
    page,
    draftFixture: data,
    comparisonFixture: fixture,
    xpCriteria,
  }) => {
    const assignmentId = data.assignments[index];
    const ids = fixture.ids[index];
    const criterionId = xpCriteria[index];
    await revisionSession(page, data.users[0].email, data.password);
    const configured = await configure(page, assignmentId, 100);
    const first = await Promise.all([
      grade(page, ids[0], criterionId, { score: 8, version: 0 }),
      grade(page, ids[1], criterionId, { score: 9, version: 0 }),
    ]);
    expect(first.map((response) => response.status())).toEqual([200, 200]);
    await revisionSession(page, data.users[1].email, data.password);
    await checkInitialXp(page, language);
    await revisionSession(page, data.users[0].email, data.password);
    await correctConcurrently(page, ids, criterionId, configured);
    await revisionSession(page, data.users[1].email, data.password);
    await checkMobileXp(page);
    await revisionSession(page, data.users[0].email, data.password);
    expect(
      (
        await grade(page, ids[1], criterionId, {
          score: 6,
          version: 3,
          publish: false,
        })
      ).status(),
    ).toBe(200);
    expect(
      (
        await grade(page, ids[0], criterionId, {
          score: 4,
          version: 2,
          publish: false,
        })
      ).status(),
    ).toBe(200);
    await checkLedger(fixture.admin, assignmentId);
    await revisionSession(page, data.users[1].email, data.password);
    expect((await (await page.request.get(xpApi)).json()).data.total_xp).toBe(
      '0',
    );
    expect(
      (
        await page.request.get(`/api/student/xp?studentId=${fixture.peerId}`)
      ).status(),
    ).toBe(400);
  });
}

test('XP field is required and a foreign instructor cannot configure or publish another assignment', async ({
  page,
  draftFixture: data,
  comparisonFixture: fixture,
  xpCriteria,
}) => {
  await revisionSession(page, data.users[0].email, data.password);
  await page.goto('/instructor/assignments/new');
  await expect(page.getByLabel(maxXpLabel, { exact: true })).toHaveValue('');
  await expect(page.getByLabel(maxXpLabel, { exact: true })).toHaveAttribute(
    'required',
    '',
  );
  const configured = await configure(page, data.assignments[0], 100);
  const role = await fixture.admin.patch(
    `${serviceUrl}/rest/v1/user_roles?user_id=eq.${fixture.peerId}`,
    { headers, data: { role: 'instructor' } },
  );
  expect(role.ok()).toBeTruthy();
  const peer = await fixture.admin.get(
    `${serviceUrl}/auth/v1/admin/users/${fixture.peerId}`,
    { headers },
  );
  await revisionSession(page, (await peer.json()).email, data.password);
  expect(
    (
      await grade(page, fixture.ids[0][0], xpCriteria[0], {
        score: 10,
        version: 0,
      })
    ).status(),
  ).toBe(404);
  const denied = await page.request.patch(
    `/api/assignments/${data.assignments[0]}`,
    {
      headers: { origin: appUrl },
      data: {
        ...configured.payload,
        expectedVersion: configured.assignment.version,
        maxXp: 100000,
      },
    },
  );
  expect(denied.status()).toBe(409);
  const stored = await fixture.admin.get(
    `${serviceUrl}/rest/v1/assignments?id=eq.${data.assignments[0]}&select=max_xp`,
    { headers },
  );
  expect(await stored.json()).toEqual([{ max_xp: 100 }]);
  await revisionSession(page, data.users[1].email, data.password);
  await page.goto(xpPath);
  await expect(
    page.getByText('No XP awards yet.', { exact: true }),
  ).toBeVisible();
});

async function checkMobileXp(page: Page) {
  const summary = await page.request.get(xpApi);
  expect((await summary.json()).data.total_xp).toBe('120');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto(xpPath);
  await expect(
    page.getByRole('heading', { name: 'My XP', exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}

async function checkLedger(admin: APIRequestContext, assignmentId: string) {
  const ledger = await admin.get(
    `${serviceUrl}/rest/v1/xp_ledger?assignment_id=eq.${assignmentId}&select=delta`,
    { headers },
  );
  const deltas: Array<{ delta: number }> = await ledger.json();
  expect(deltas.reduce((sum, row) => sum + row.delta, 0)).toBe(0);
}

async function checkInitialXp(page: Page, language: string) {
  await page.goto(xpPath);
  await expect(page.getByText('90', { exact: true })).toBeVisible();
  await page
    .getByRole('link', {
      name: new RegExp(`Draft safeguard ${language.toLowerCase()}`),
    })
    .click();
  await expect(
    page.getByText('Maximum XP: 100', { exact: true }),
  ).toBeVisible();
}

async function correctConcurrently(
  page: Page,
  ids: string[],
  criterionId: string,
  configured: Awaited<ReturnType<typeof configure>>,
) {
  const simultaneous = await Promise.all([
    grade(page, ids[0], criterionId, { score: 4, version: 1 }),
    grade(page, ids[1], criterionId, { score: 6, version: 1 }),
    page.request.patch(`/api/assignments/${configured.assignment.id}`, {
      headers: { origin: appUrl },
      data: {
        ...configured.payload,
        expectedVersion: configured.assignment.version,
        maxXp: 200,
      },
    }),
  ]);
  expect(simultaneous.map((response) => response.status())).toEqual([
    200, 200, 200,
  ]);
  expect(
    (await grade(page, ids[1], criterionId, { score: 6, version: 2 })).status(),
  ).toBe(200);
}
