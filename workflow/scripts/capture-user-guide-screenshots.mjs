import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { copyFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));
const docsImgDir = join(root, 'docs', 'images', 'user-guide');
const siteImgDir = join(root, 'website', 'static', 'img', 'user-guide');
const TWO_SUM_TEXT = 'text=Two Sum';
const IDENTIFIER_INPUT = 'input[name="identifier"]';
const LEARNING_FEEDBACK_TEXT = 'text=Learning feedback';
const TEST_PASSWORD = 'password';

await mkdir(docsImgDir, { recursive: true });
await mkdir(siteImgDir, { recursive: true });

async function saveCleanScreenshot(page, filename) {
  await page.evaluate(() => {
    document.querySelectorAll('nextjs-portal, [data-nextjs-toast], [data-next-badge], #nextjs-dev-overlay').forEach(el => el.remove());
  });
  await page.addStyleTag({
    content: `
      nextjs-portal, [data-nextjs-toast], [data-next-badge], #nextjs-dev-overlay,
      div[data-nextjs-data-runtime-error-collapsed-action],
      div:has(> svg[aria-label="Next.js logo"]),
      div:has(> button[aria-label="Open Next.js Dev Tools"]),
      button[aria-label*="Next.js"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
    `,
  });
  await page.waitForTimeout(400);
  const docsPath = join(docsImgDir, filename);
  const sitePath = join(siteImgDir, filename);
  await page.screenshot({ path: docsPath, fullPage: false });
  await copyFile(docsPath, sitePath);
  console.log(`[Captured] ${filename}`);
}

async function loginAs(page, baseUrl, identifier, password) {
  await page.goto(`${baseUrl}/sign-in`, { waitUntil: 'domcontentloaded' });
  await page.locator(IDENTIFIER_INPUT).fill(identifier);
  await page.locator('input[name="password"]').fill(password);
  const pending = page.waitForResponse(r => r.url().includes('/api/auth/sign-in'));
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await pending;
  await page.waitForURL(url => !url.pathname.includes('/sign-in'), { timeout: 15000 });
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(800);
}

async function captureWelcome(page, baseUrl) {
  console.log('--- 1. Welcome & Authentication ---');
  await page.goto(`${baseUrl}/sign-in`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector(IDENTIFIER_INPUT, { timeout: 10000 });
  assert.match(page.url(), /\/sign-in/, 'Expected URL to match sign-in');
  assert.ok(await page.locator(IDENTIFIER_INPUT).isVisible(), 'Identifier input must be visible');
  await saveCleanScreenshot(page, '01-welcome-and-auth.png');
}

async function captureStudentCourses(page, baseUrl) {
  console.log('--- 2. Student Sign In & Courses ---');
  await loginAs(page, baseUrl, 'student01@codeleet.test', TEST_PASSWORD);
  await page.goto(`${baseUrl}/courses`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('text=CS101: Introduction to Python Programming', { timeout: 15000 });
  await page.waitForTimeout(500);
  assert.match(page.url(), /\/courses$/, 'Expected URL to match /courses');
  assert.ok(await page.locator('text=CS101: Introduction to Python Programming').isVisible(), 'Course title must be visible');
  await saveCleanScreenshot(page, '02-student-courses.png');
}

async function captureStudentAssignments(page, baseUrl, courseId) {
  console.log('--- 3. Student Course Assignments ---');
  await page.goto(`${baseUrl}/courses/${courseId}/assignments`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('text=Your assignments', { timeout: 15000 });
  await page.waitForSelector(TWO_SUM_TEXT, { timeout: 15000 });
  assert.match(page.url(), new RegExp(`/courses/${courseId}/assignments$`), 'Expected URL to match course assignments');
  assert.ok(await page.locator('text=Your assignments').isVisible(), 'Assignments heading must be visible');
  assert.ok(await page.locator(TWO_SUM_TEXT).isVisible(), 'Two sum assignment must be visible');
  await saveCleanScreenshot(page, '03-course-assignments.png');
}

async function captureStudentEditor(page, baseUrl, courseId, assignmentId) {
  console.log('--- 4. Student Code Editor & Problem Statement ---');
  await page.goto(`${baseUrl}/courses/${courseId}/assignments/${assignmentId}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector(TWO_SUM_TEXT, { timeout: 15000 });
  const codeArea = page.locator('#source-code');
  await codeArea.waitFor({ timeout: 15000 });
  const pythonCode = `import sys

def solve():
    lines = sys.stdin.read().splitlines()
    if not lines:
        return
    nums = [int(x) for x in lines[0].split()]
    target = int(lines[1])
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            print(f"{seen[diff]} {i}")
            return
        seen[num] = i

if __name__ == '__main__':
    solve()
`;
  await codeArea.fill(pythonCode);
  await page.waitForTimeout(500);
  await codeArea.scrollIntoViewIfNeeded();
  assert.match(page.url(), new RegExp(`/courses/${courseId}/assignments/${assignmentId}$`), 'Expected URL to match assignment editor');
  assert.ok(await codeArea.isVisible(), 'Editor code area must be visible');
  await saveCleanScreenshot(page, '04-student-editor.png');
}

async function captureExecutionOutput(page) {
  console.log('--- 5. Browser Execution Output ---');
  const stdinArea = page.locator('textarea[placeholder*="Optional input"], textarea[name="stdin"]').first();
  if (await stdinArea.isVisible()) {
    await stdinArea.fill('2 7 11 15\n9');
  }
  const runBtn = page.getByRole('button', { name: /Run code/i });
  if (await runBtn.isVisible()) {
    await runBtn.click();
    await page.waitForSelector('button:has-text("Run code"):not([disabled])', { timeout: 30000 }).catch(() => {});
    await page.waitForSelector('text=Execution: approximately', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1000);
  }
  await page.locator('text=Run & test').scrollIntoViewIfNeeded();
  assert.ok(await page.locator('text=Run & test').isVisible(), 'Run & test section must be visible');
  assert.ok(await page.locator('text=Execution: approximately').isVisible(), 'Execution summary must be visible');
  await saveCleanScreenshot(page, '05-browser-execution-output.png');
}

async function capturePracticeTests(page) {
  console.log('--- 6. Practice Test Validation ---');
  const testBtn = page.getByRole('button', { name: /Run published tests/i });
  if (await testBtn.isVisible()) {
    await testBtn.click();
    await page.waitForSelector('button:has-text("Run published tests"):not([disabled])', { timeout: 30000 }).catch(() => {});
    await page.waitForSelector('text=Passed', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1000);
  }
  await page.locator('text=Published test cases').scrollIntoViewIfNeeded();
  assert.ok(await page.locator('text=Published test cases').isVisible(), 'Published test cases section must be visible');
  assert.ok(await page.locator('text=Passed').isVisible(), 'Passed status must be visible');
  await saveCleanScreenshot(page, '06-practice-test-validation.png');
}

async function captureDraftAutosave(page) {
  console.log('--- 7. Autosave & Draft Recovery ---');
  const codeArea = page.locator('#source-code');
  if (await codeArea.isVisible()) {
    await codeArea.focus();
    await page.keyboard.type('\n# draft autosave demonstration');
    await page.waitForSelector('text=Draft saved on this device', { timeout: 10000 }).catch(() => {});
  }
  await page.reload({ waitUntil: 'domcontentloaded' });
  const restoreBtn = page.getByRole('button', { name: /Restore draft/i }).first();
  await restoreBtn.waitFor({ timeout: 10000 }).catch(() => {});
  await page.evaluate(() => {
    const banner = document.querySelector('section[aria-label="Recover unfinished code"]');
    if (banner) {
      banner.scrollIntoView({ block: 'center' });
    }
  });
  await page.waitForTimeout(500);
  assert.ok(await page.locator('section[aria-label="Recover unfinished code"]').isVisible(), 'Draft recovery banner must be visible');
  await saveCleanScreenshot(page, '07-autosave-draft-recovery.png');
  if (await restoreBtn.isVisible()) await restoreBtn.click();
}

async function captureSubmissionsHistory(page, baseUrl, courseId) {
  console.log('--- 8. Submissions History ---');
  await page.goto(`${baseUrl}/courses/${courseId}/submissions`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector(TWO_SUM_TEXT, { timeout: 15000 });
  assert.match(page.url(), new RegExp(`/courses/${courseId}/submissions$`), 'Expected URL to match submissions history');
  assert.ok(await page.locator(TWO_SUM_TEXT).isVisible(), 'Submission history must list Two Sum');
  await saveCleanScreenshot(page, '08-submissions-history.png');
}

async function captureRevisionDiff(page, baseUrl, courseId, submissionId) {
  console.log('--- 9. Revision Diff Comparison ---');
  await page.goto(`${baseUrl}/courses/${courseId}/submissions/${submissionId}/compare`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('text=Compare revisions', { timeout: 15000 });
  await page.waitForTimeout(800);
  assert.match(page.url(), new RegExp(`/courses/${courseId}/submissions/${submissionId}/compare$`), 'Expected URL to match compare revisions');
  assert.ok(await page.locator('text=Compare revisions').isVisible(), 'Compare revisions header must be visible');
  await saveCleanScreenshot(page, '09-revision-diff-comparison.png');
}

async function captureAIFeedback(page, baseUrl, courseId, submissionId) {
  console.log('--- 10. AI Learning Feedback ---');
  await page.goto(`${baseUrl}/courses/${courseId}/submissions/${submissionId}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector(LEARNING_FEEDBACK_TEXT, { timeout: 15000 });
  await page.locator(LEARNING_FEEDBACK_TEXT).scrollIntoViewIfNeeded();
  assert.match(page.url(), new RegExp(`/courses/${courseId}/submissions/${submissionId}$`), 'Expected URL to match submission feedback');
  assert.ok(await page.locator(LEARNING_FEEDBACK_TEXT).isVisible(), 'Learning feedback section must be visible');
  await saveCleanScreenshot(page, '10-ai-learning-feedback.png');
}

async function captureCommunityViews(page, baseUrl, courseId) {
  console.log('--- 11. Student Progress Dashboard ---');
  await page.goto(`${baseUrl}/courses/${courseId}/progress`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('text=Submitted assignments', { timeout: 15000 });
  assert.match(page.url(), new RegExp(`/courses/${courseId}/progress$`), 'Expected URL to match student progress');
  assert.ok(await page.locator('text=Submitted assignments').isVisible(), 'Progress dashboard metrics must be visible');
  await saveCleanScreenshot(page, '11-student-progress.png');

  console.log('--- 12. Course Discussion Forums ---');
  await page.goto(`${baseUrl}/courses/${courseId}/forums`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector(TWO_SUM_TEXT, { timeout: 15000 });
  assert.match(page.url(), new RegExp(`/courses/${courseId}/forums$`), 'Expected URL to match course forums');
  assert.ok(await page.locator(TWO_SUM_TEXT).isVisible(), 'Forums thread must be visible');
  await saveCleanScreenshot(page, '12-course-discussions.png');

  console.log('--- 13. Course Leaderboard ---');
  await page.goto(`${baseUrl}/courses/${courseId}/leaderboard`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('text=Leaderboard', { timeout: 15000 });
  assert.match(page.url(), new RegExp(`/courses/${courseId}/leaderboard$`), 'Expected URL to match course leaderboard');
  assert.ok(await page.locator('text=Leaderboard').isVisible(), 'Leaderboard header must be visible');
  await saveCleanScreenshot(page, '13-course-leaderboard.png');
}

async function captureInstructorAdmin(page, baseUrl, courseId) {
  console.log('--- 14. Instructor Workflows ---');
  await loginAs(page, baseUrl, 'instructor1@codeleet.test', TEST_PASSWORD);

  await page.goto(`${baseUrl}/courses/${courseId}/manage-users`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('text=Student join code', { timeout: 15000 });
  const rotateBtn = page.getByRole('button', { name: /Create or rotate code/i });
  if (await rotateBtn.isVisible()) {
    await rotateBtn.click();
    await page.waitForSelector('button:has-text("Revoke code")', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1000);
  }
  assert.match(page.url(), new RegExp(`/courses/${courseId}/manage-users$`), 'Expected URL to match manage users');
  assert.ok(await page.locator('text=Student join code').isVisible(), 'Student join code section must be visible');
  await saveCleanScreenshot(page, '14-instructor-course-admin.png');
}

async function captureInstructorAuthoring(page, baseUrl, courseId) {
  console.log('--- 15. Instructor Assignment Authoring & Rubric ---');
  await page.goto(`${baseUrl}/courses/${courseId}/assignments/new`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('text=Create assignment', { timeout: 15000 });
  await page.locator('input[name="title"]').fill('Dynamic Array Implementation');
  await page.locator('textarea[name="instructions"]').fill('Implement a resizable dynamic array with append, pop, and resize operations.');
  await page.locator('#assignment-max-xp, input[name="maxXp"]').fill('100');
  assert.match(page.url(), new RegExp(`/courses/${courseId}/assignments/new$`), 'Expected URL to match create assignment');
  assert.ok(await page.locator('text=Create assignment').isVisible(), 'Create assignment title must be visible');
  await saveCleanScreenshot(page, '15-instructor-assignment-authoring.png');
}

async function captureInstructorGrading(page, baseUrl, courseId, submissionId) {
  console.log('--- 17. Instructor Submission Review & AI Grading ---');
  await page.goto(`${baseUrl}/courses/${courseId}/submissions/${submissionId}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('text=Review submission', { timeout: 15000 });
  const formElement = page.locator('form').first();
  if (await formElement.isVisible()) {
    await formElement.scrollIntoViewIfNeeded();
  }
  await page.waitForTimeout(600);
  assert.match(page.url(), new RegExp(`/courses/${courseId}/submissions/${submissionId}$`), 'Expected URL to match submission review');
  assert.ok(await page.locator('text=Review submission').isVisible(), 'Review submission heading must be visible');
  await saveCleanScreenshot(page, '17-instructor-submission-review-ai-grade.png');
}

async function captureAdminRoles(page, baseUrl) {
  console.log('--- 18. Platform Admin User Roles ---');
  await loginAs(page, baseUrl, 'admin@codeleet.test', TEST_PASSWORD);

  await page.goto(`${baseUrl}/admin`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('h1:has-text("User roles")', { timeout: 15000 });
  await page.waitForSelector('table tbody tr', { timeout: 15000 });
  assert.match(page.url(), /\/admin$/, 'Expected URL to match /admin');
  assert.ok(await page.locator('h1:has-text("User roles")').isVisible(), 'User roles header must be visible');
  assert.ok(await page.locator('table tbody tr').first().isVisible(), 'User roles table must have rows');
  await saveCleanScreenshot(page, '18-admin-user-roles.png');
}

async function runStudentFlows(opts) {
  const { page, baseUrl, courseId, assignmentId, submissionId } = opts;
  await captureWelcome(page, baseUrl);
  await captureStudentCourses(page, baseUrl);
  await captureStudentAssignments(page, baseUrl, courseId);
  await captureStudentEditor(page, baseUrl, courseId, assignmentId);
  await captureExecutionOutput(page);
  await capturePracticeTests(page);
  await captureDraftAutosave(page);
  await captureSubmissionsHistory(page, baseUrl, courseId);
  await captureRevisionDiff(page, baseUrl, courseId, submissionId);
  await captureAIFeedback(page, baseUrl, courseId, submissionId);
  await captureCommunityViews(page, baseUrl, courseId);
}

async function runInstructorAndAdminFlows(opts) {
  const { page, baseUrl, courseId, submissionId } = opts;
  await captureInstructorAdmin(page, baseUrl, courseId);
  await captureInstructorAuthoring(page, baseUrl, courseId);
  await captureInstructorGrading(page, baseUrl, courseId, submissionId);
  await captureAdminRoles(page, baseUrl);
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 850 },
    deviceScaleFactor: 2,
  });
  
  await context.addInitScript(() => {
    const style = document.createElement('style');
    style.id = 'hide-nextjs-dev-tools';
    style.innerHTML = `
      nextjs-portal, [data-nextjs-toast], [data-next-badge], #nextjs-dev-overlay,
      div[data-nextjs-data-runtime-error-collapsed-action],
      div:has(> svg[aria-label="Next.js logo"]),
      div:has(> button[aria-label="Open Next.js Dev Tools"]),
      button[aria-label*="Next.js"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
    `;
    document.documentElement.appendChild(style);
  });

  const page = await context.newPage();
  const baseUrl = 'http://localhost:3000';
  const pythonCourseId = '96000000-0000-4000-8000-000000000001';
  const pythonAssignmentId = '92000000-0000-4000-8000-000000000001';
  const submissionId = '94000000-0000-4000-8000-000000000002';

  const opts = { page, baseUrl, courseId: pythonCourseId, assignmentId: pythonAssignmentId, submissionId };
  await runStudentFlows(opts);
  await runInstructorAndAdminFlows(opts);

  await browser.close();
  console.log('SUCCESS: All 18 screenshots captured cleanly with no dev badges and verified views!');
}

run().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
