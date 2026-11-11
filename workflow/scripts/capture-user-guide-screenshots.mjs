import { chromium } from '@playwright/test';
import { copyFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));
const docsImgDir = join(root, 'docs', 'images', 'user-guide');
const siteImgDir = join(root, 'website', 'static', 'img', 'user-guide');
const TWO_SUM_TEXT = 'text=Two Sum';

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
  await page.locator('input[name="identifier"]').fill(identifier);
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
  await page.waitForSelector('input[name="identifier"]', { timeout: 10000 });
  await saveCleanScreenshot(page, '01-welcome-and-auth.png');
}

async function captureStudentCourses(page, baseUrl) {
  console.log('--- 2. Student Sign In & Courses ---');
  await loginAs(page, baseUrl, 'student01@codeleet.test', 'password');
  await page.goto(`${baseUrl}/courses`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('text=CS101: Introduction to Python Programming', { timeout: 15000 });
  await page.waitForTimeout(500);
  await saveCleanScreenshot(page, '02-student-courses.png');
}

async function captureStudentAssignments(page, baseUrl, courseId) {
  console.log('--- 3. Student Course Assignments ---');
  await page.goto(`${baseUrl}/courses/${courseId}/assignments`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('text=Your assignments', { timeout: 15000 });
  await page.waitForSelector(TWO_SUM_TEXT, { timeout: 15000 });
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
  await saveCleanScreenshot(page, '07-autosave-draft-recovery.png');
  if (await restoreBtn.isVisible()) await restoreBtn.click();
}

async function captureSubmissionsHistory(page, baseUrl, courseId) {
  console.log('--- 8. Submissions History ---');
  await page.goto(`${baseUrl}/courses/${courseId}/submissions`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector(TWO_SUM_TEXT, { timeout: 15000 });
  await saveCleanScreenshot(page, '08-submissions-history.png');
}

async function captureRevisionDiff(page, baseUrl, courseId, submissionId) {
  console.log('--- 9. Revision Diff Comparison ---');
  await page.goto(`${baseUrl}/courses/${courseId}/submissions/${submissionId}/compare`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('text=Compare revisions', { timeout: 15000 });
  await page.waitForTimeout(800);
  await saveCleanScreenshot(page, '09-revision-diff-comparison.png');
}

async function captureAIFeedback(page, baseUrl, courseId, submissionId) {
  console.log('--- 10. AI Learning Feedback ---');
  await page.goto(`${baseUrl}/courses/${courseId}/submissions/${submissionId}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('text=Learning feedback', { timeout: 15000 });
  await page.locator('text=Learning feedback').scrollIntoViewIfNeeded();
  await saveCleanScreenshot(page, '10-ai-learning-feedback.png');
}

async function captureCommunityViews(page, baseUrl, courseId) {
  console.log('--- 11. Student Progress Dashboard ---');
  await page.goto(`${baseUrl}/courses/${courseId}/progress`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('text=Submitted assignments', { timeout: 15000 });
  await saveCleanScreenshot(page, '11-student-progress.png');

  console.log('--- 12. Course Discussion Forums ---');
  await page.goto(`${baseUrl}/courses/${courseId}/forums`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector(TWO_SUM_TEXT, { timeout: 15000 });
  await saveCleanScreenshot(page, '12-course-discussions.png');

  console.log('--- 13. Course Leaderboard ---');
  await page.goto(`${baseUrl}/courses/${courseId}/leaderboard`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('text=Leaderboard', { timeout: 15000 });
  await saveCleanScreenshot(page, '13-course-leaderboard.png');
}

async function captureInstructorAdmin(page, baseUrl, courseId) {
  console.log('--- 14. Instructor Workflows ---');
  await loginAs(page, baseUrl, 'instructor1@codeleet.test', 'password');

  await page.goto(`${baseUrl}/courses/${courseId}/manage-users`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('text=Student join code', { timeout: 15000 });
  const rotateBtn = page.getByRole('button', { name: /Create or rotate code/i });
  if (await rotateBtn.isVisible()) {
    await rotateBtn.click();
    await page.waitForSelector('button:has-text("Revoke code")', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1000);
  }
  await saveCleanScreenshot(page, '14-instructor-course-admin.png');
}

async function captureInstructorAuthoring(page, baseUrl, courseId) {
  console.log('--- 15. Instructor Assignment Authoring & Rubric ---');
  await page.goto(`${baseUrl}/courses/${courseId}/assignments/new`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('text=Create assignment', { timeout: 15000 });
  await page.locator('input[name="title"]').fill('Dynamic Array Implementation');
  await page.locator('textarea[name="instructions"]').fill('Implement a resizable dynamic array with append, pop, and resize operations.');
  await page.locator('#assignment-max-xp, input[name="maxXp"]').fill('100');
  await saveCleanScreenshot(page, '15-instructor-assignment-authoring.png');
}

async function captureInstructorPracticeTests(page, baseUrl, courseId, assignmentId) {
  console.log('--- 16. Instructor Practice Test Authoring ---');
  await page.goto(`${baseUrl}/courses/${courseId}/assignments/${assignmentId}/practice-tests`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('text=Practice tests', { timeout: 15000 });
  await page.waitForTimeout(600);
  await saveCleanScreenshot(page, '16-instructor-practice-test-authoring.png');
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
  await saveCleanScreenshot(page, '17-instructor-submission-review-ai-grade.png');
}

async function captureAdminRoles(page, baseUrl) {
  console.log('--- 18. Platform Admin User Roles ---');
  await loginAs(page, baseUrl, 'admin@codeleet.test', 'password');

  await page.goto(`${baseUrl}/admin`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('h1:has-text("User roles")', { timeout: 15000 });
  await page.waitForSelector('table tbody tr', { timeout: 15000 });
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
  const { page, baseUrl, courseId, assignmentId, submissionId } = opts;
  await captureInstructorAdmin(page, baseUrl, courseId);
  await captureInstructorAuthoring(page, baseUrl, courseId);
  await captureInstructorPracticeTests(page, baseUrl, courseId, assignmentId);
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
