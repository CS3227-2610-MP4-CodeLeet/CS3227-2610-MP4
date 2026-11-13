import type { Leaderboard } from '@/features/leaderboard/contracts';
import { expect, type Page } from '@playwright/test';
import { test } from './helpers/leaderboard-fixtures';
import { appUrl, serviceUrl, configure, grade } from './helpers/xp-fixtures';
import { revisionSession } from './helpers/revision-session';
import { coursePath } from './helpers/draft-fixtures';
const api = '/api/leaderboard';
const leaderboardPath = '/leaderboard';
test.use({ baseURL: appUrl, actionTimeout: 10000 });
test.skip(
  !process.env.MP4_E2E_SERVICE_ROLE_KEY ||
    !/^http:\/\/(localhost|127\.0\.0\.1):54321$/.test(serviceUrl ?? ''),
  'Requires local synthetic accounts.',
);

test('shared ranks, own position and instructor corrections reflect trusted awards', async ({
  page,
  draftFixture: data,
  comparisonFixture: fixture,
  xpCriteria,
  leaderboardFixture: board,
}) => {
  await revisionSession(page, data.users[0].email, data.password);
  await configure(page, data.courseId, data.assignments[0], 10000);
  await publishGroup(page, {
    ids: [fixture.ids[0][0], fixture.peerRevision, board.thirdRevision],
    criterion: xpCriteria[0],
  });
  await revisionSession(page, data.users[1].email, data.password);
  await checkRankedRows(page, data.courseId, board.names);
  await revisionSession(page, data.users[0].email, data.password);
  expect(
    (
      await grade(page, fixture.ids[0][0], xpCriteria[0], {
        score: 5,
        version: 1,
      })
    ).status(),
  ).toBe(200);
  await configure(page, data.courseId, data.assignments[0], 20000);
  await revisionSession(page, data.users[1].email, data.password);
  expect((await summary(page, data.courseId)).own?.total_xp).toBe('10000');
  await withdrawAndCheck(page, {
    data,
    id: fixture.ids[0][0],
    criterion: xpCriteria[0],
  });
});

test('private fields and forged selectors stay unavailable to members and signed-out users', async ({
  page,
  draftFixture: data,
  comparisonFixture: fixture,
  xpCriteria,
  leaderboardFixture: board,
}) => {
  expect(
    (await page.request.get(`${api}?courseId=${data.courseId}`)).status(),
  ).toBe(401);
  await page.goto(coursePath(data.courseId, leaderboardPath));
  await expect(page).toHaveURL(/\/sign-in$/);
  await revisionSession(page, data.users[0].email, data.password);
  await configure(page, data.courseId, data.assignments[0], 10000);
  await publishGroup(page, {
    ids: [fixture.ids[0][0], fixture.peerRevision, board.thirdRevision],
    criterion: xpCriteria[0],
  });
  await page.goto(coursePath(data.courseId, leaderboardPath));
  await expect(page.getByText('Your rank', { exact: true })).toHaveCount(0);
  expect((await summary(page, data.courseId)).own).toBeNull();
  for (const query of ['studentId=peer', 'xp=999', 'rank=1', 'page=1&page=2'])
    expect(
      (
        await page.request.get(`${api}?courseId=${data.courseId}&${query}`)
      ).status(),
    ).toBe(400);
  expect(
    (
      await page.request.post(`${api}?courseId=${data.courseId}`, {
        data: { xp: 999999 },
      })
    ).status(),
  ).toBe(405);
  await revisionSession(page, data.users[1].email, data.password);
  const response = await page.request.get(`${api}?courseId=${data.courseId}`);
  expect(response.headers()['cache-control']).toBe('private, no-store');
  const payload = await response.json();
  for (const id of [data.users[1].id, fixture.peerId, ...data.assignments])
    expect(JSON.stringify(payload)).not.toContain(id);
  expect(Object.keys(payload.data.rows[0]).sort()).toEqual([
    'is_current_user',
    'position',
    'rank',
    'total_xp',
    'username',
  ]);
});

test('safe names, mobile theme and later-page navigation work for both roles', async ({
  page,
  draftFixture: data,
  comparisonFixture: fixture,
  xpCriteria,
  leaderboardFixture: board,
}) => {
  await revisionSession(page, data.users[0].email, data.password);
  await configure(page, data.courseId, data.assignments[0], 10000);
  await publishGroup(page, {
    ids: [fixture.ids[0][0], fixture.peerRevision, board.thirdRevision],
    criterion: xpCriteria[0],
  });
  await revisionSession(page, data.users[1].email, data.password);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark' });
  const fixtureRows = await findFixtureRows(page, data.courseId, board.names);
  const revision = (await summary(page, data.courseId)).revision;
  await page.goto(
    coursePath(
      data.courseId,
      `${leaderboardPath}?page=${Math.floor((fixtureRows[2].position - 1) / 25) + 1}&revision=${revision}`,
    ),
  );
  await expect(page.getByText(board.names[2], { exact: true })).toBeVisible();
  await expect(page.locator('main img')).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goto(
    coursePath(
      data.courseId,
      `${leaderboardPath}?page=9999&revision=${revision}`,
    ),
  );
  await expect(
    page.getByText('No students on this page.', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Previous', exact: true }),
  ).toHaveAttribute(
    'href',
    `/courses/${data.courseId}${leaderboardPath}?page=9998&revision=${revision}`,
  );
  await revisionSession(page, data.users[0].email, data.password);
  await page.goto(coursePath(data.courseId, leaderboardPath));
  await expect(
    page.getByRole('heading', { name: 'Leaderboard', exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test('grade changes restart stale XP and leaderboard navigation with current data', async ({
  page,
  draftFixture: data,
  comparisonFixture: fixture,
  xpCriteria,
  leaderboardFixture: board,
}) => {
  await revisionSession(page, data.users[0].email, data.password);
  await configure(page, data.courseId, data.assignments[0], 100);
  await publishGroup(page, {
    ids: [fixture.ids[0][0], fixture.peerRevision, board.thirdRevision],
    criterion: xpCriteria[0],
  });
  await revisionSession(page, data.users[1].email, data.password);
  const oldXp = await ownXpSummary(page, data.courseId);
  const oldBoard = await summary(page, data.courseId);
  await revisionSession(page, data.users[0].email, data.password);
  expect(
    (
      await grade(page, fixture.ids[0][0], xpCriteria[0], {
        score: 5,
        version: 1,
      })
    ).ok(),
  ).toBeTruthy();
  await revisionSession(page, data.users[1].email, data.password);
  const currentBoard = await summary(page, data.courseId, 2, oldBoard.revision);
  expect(currentBoard).toMatchObject({
    page: 1,
    restarted: true,
    own: { total_xp: '50' },
  });
  expect(currentBoard.revision).not.toBe(oldBoard.revision);
  expect(await ownXpSummary(page, data.courseId, oldXp.revision)).toMatchObject(
    {
      page: 1,
      restarted: true,
      total_xp: '50',
    },
  );
  for (const [path, revision] of [
    ['xp', oldXp.revision],
    ['leaderboard', oldBoard.revision],
  ]) {
    await page.goto(
      coursePath(data.courseId, `/${path}?page=2&revision=${revision}`),
    );
    await expect(page.getByRole('status')).toHaveText(
      'XP changed—showing the latest results.',
    );
    await expect(
      page.getByRole('link', { name: 'Previous', exact: true }),
    ).toHaveCount(0);
  }
});

async function ownXpSummary(page: Page, courseId: string, revision?: string) {
  const suffix = revision ? `&page=2&revision=${revision}` : '';
  const response = await page.request.get(
    `/api/student/xp?courseId=${courseId}${suffix}`,
  );
  expect(response.ok()).toBeTruthy();
  return (await response.json()).data;
}

async function publishGroup(
  page: Page,
  { ids, criterion }: { ids: string[]; criterion: string },
) {
  for (const [index, id] of ids.entries())
    expect(
      (
        await grade(page, id, criterion, {
          score: index === 2 ? 9 : 10,
          version: 0,
        })
      ).status(),
    ).toBe(200);
}
async function summary(
  page: Page,
  courseId: string,
  pageNumber = 1,
  revision?: string,
): Promise<Leaderboard> {
  const response = await page.request.get(
    `${api}?courseId=${courseId}&page=${pageNumber}${revision ? `&revision=${revision}` : ''}`,
  );
  expect(response.status()).toBe(200);
  return (await response.json()).data;
}
async function withdrawAndCheck(
  page: Page,
  {
    data,
    id,
    criterion,
  }: {
    data: {
      courseId: string;
      users: Array<{ email: string }>;
      password: string;
    };
    id: string;
    criterion: string;
  },
) {
  await revisionSession(page, data.users[0].email, data.password);
  expect(
    (
      await grade(page, id, criterion, { score: 5, version: 2, publish: false })
    ).status(),
  ).toBe(200);
  await revisionSession(page, data.users[1].email, data.password);
  expect((await summary(page, data.courseId)).own).toEqual({
    rank: null,
    total_xp: '0',
  });
  await page.goto(coursePath(data.courseId, leaderboardPath));
  await expect(page.getByText('Unranked', { exact: true })).toBeVisible();
}

async function findFixtureRows(page: Page, courseId: string, names: string[]) {
  const found = new Map<string, Leaderboard['rows'][number]>();
  let revision: string | undefined;
  for (let number = 1; number <= 10000; number++) {
    const data = await summary(page, courseId, number, revision);
    revision ??= data.revision;
    for (const row of data.rows)
      if (names.includes(row.username)) found.set(row.username, row);
    if (found.size === names.length || !data.has_more) break;
  }
  expect(found.size).toBe(names.length);
  return names.map((name) => found.get(name)!);
}
async function checkRankedRows(page: Page, courseId: string, names: string[]) {
  const rows = await findFixtureRows(page, courseId, names);
  const revision = (await summary(page, courseId)).revision;
  await page.goto(
    coursePath(
      courseId,
      `${leaderboardPath}?page=${Math.floor((rows[0].position - 1) / 25) + 1}&revision=${revision}`,
    ),
  );
  await expect(
    page.getByRole('heading', { name: 'Leaderboard', exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole('row')
      .filter({ hasText: names[0] })
      .getByText('You', { exact: true }),
  ).toBeVisible();
  expect(rows[0].rank).toBe(rows[1].rank);
  expect(BigInt(rows[2].rank)).toBeGreaterThan(BigInt(rows[0].rank));
}
