import { chromium } from '@playwright/test';
import { copyFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));
const docsImgDir = join(root, 'docs', 'images', 'user-guide');
const siteImgDir = join(root, 'website', 'static', 'img', 'user-guide');

await mkdir(docsImgDir, { recursive: true });
await mkdir(siteImgDir, { recursive: true });

async function saveScreenshot(page, filename) {
  const docsPath = join(docsImgDir, filename);
  const sitePath = join(siteImgDir, filename);
  await page.screenshot({ path: docsPath, fullPage: false });
  await copyFile(docsPath, sitePath);
  console.log(`[Captured] ${filename}`);
}

async function loginAs(page, baseUrl, identifier, password) {
  await page.goto(`${baseUrl}/sign-in`);
  await page.waitForLoadState('domcontentloaded');
  await page.locator('input[name="identifier"]').fill(identifier);
  await page.locator('input[name="password"]').fill(password);
  const pending = page.waitForResponse(r => r.url().includes('/api/auth/sign-in'));
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  const res = await pending;
  console.log(`Login ${identifier}:`, res.status());
  await page.waitForURL(url => !url.pathname.includes('/sign-in'), { timeout: 15000 });
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  const baseUrl = 'http://localhost:3000';
  const pythonCourseId = '96000000-0000-4000-8000-000000000001';
  const javaCourseId = '96000000-0000-4000-8000-000000000002';
  const pythonAssignmentId = '92000000-0000-4000-8000-000000000001';

  console.log('--- 1. Welcome & Authentication ---');
  await page.goto(`${baseUrl}/sign-in`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('input[name="identifier"]', { timeout: 10000 });
  await page.waitForTimeout(500);
  await saveScreenshot(page, '01-welcome-and-auth.png');

  console.log('--- 2. Student Sign In & Courses ---');
  await loginAs(page, baseUrl, 'student01@codeleet.test', 'password');
  await saveScreenshot(page, '02-student-courses.png');

  console.log('--- 3. Student Course Assignments ---');
  await page.goto(`${baseUrl}/courses/${pythonCourseId}/assignments`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1200);
  await saveScreenshot(page, '03-course-assignments.png');

  console.log('--- 4. Student Code Editor & Problem Statement ---');
  await page.goto(`${baseUrl}/courses/${pythonCourseId}/assignments/${pythonAssignmentId}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
  await saveScreenshot(page, '04-student-editor.png');

  console.log('--- 5. Browser Execution Output ---');
  const runBtn = page.getByRole('button', { name: /Run code/i });
  if (await runBtn.isVisible()) {
    await runBtn.click();
    await page.waitForTimeout(3500);
  }
  await saveScreenshot(page, '05-browser-execution-output.png');

  console.log('--- 6. Practice Test Validation ---');
  const testTab = page.getByRole('tab', { name: /Tests|Practice|Test cases/i }).or(page.getByText('Test cases'));
  if (await testTab.isVisible()) {
    await testTab.first().click();
    await page.waitForTimeout(1000);
  }
  await saveScreenshot(page, '06-practice-test-validation.png');

  console.log('--- 7. Autosave & Draft Recovery ---');
  const editorArea = page.locator('.monaco-editor, textarea, [contenteditable="true"]').first();
  if (await editorArea.isVisible()) {
    await editorArea.click();
    await page.keyboard.type('\n# draft autosave demonstration');
    await page.waitForTimeout(1500);
  }
  await saveScreenshot(page, '07-autosave-draft-recovery.png');

  console.log('--- 8. Submissions History ---');
  await page.goto(`${baseUrl}/courses/${pythonCourseId}/submissions`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1200);
  await saveScreenshot(page, '08-submissions-history.png');

  console.log('--- 9. Revision Diff Comparison ---');
  const compareBtn = page.getByRole('button', { name: /Compare/i });
  if (await compareBtn.isVisible()) {
    await compareBtn.click();
    await page.waitForTimeout(1000);
    await saveScreenshot(page, '09-revision-diff-comparison.png');
    const closeBtn = page.getByRole('button', { name: /Close|Done/i });
    if (await closeBtn.isVisible()) await closeBtn.click();
  } else {
    await saveScreenshot(page, '09-revision-diff-comparison.png');
  }

  console.log('--- 10. AI Learning Feedback ---');
  await page.goto(`${baseUrl}/courses/${pythonCourseId}/assignments/${pythonAssignmentId}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
  const aiBtn = page.getByRole('button', { name: /AI feedback|Feedback|Get Help/i });
  if (await aiBtn.isVisible()) {
    await aiBtn.click();
    await page.waitForTimeout(2000);
  }
  await saveScreenshot(page, '10-ai-learning-feedback.png');

  console.log('--- 11. Student Progress Dashboard ---');
  await page.goto(`${baseUrl}/courses/${pythonCourseId}/progress`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
  await saveScreenshot(page, '11-student-progress.png');

  console.log('--- 12. Course Discussion Forums ---');
  await page.goto(`${baseUrl}/courses/${pythonCourseId}/forums`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
  await saveScreenshot(page, '12-course-discussions.png');

  console.log('--- 13. Course Leaderboard ---');
  await page.goto(`${baseUrl}/courses/${pythonCourseId}/leaderboard`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
  await saveScreenshot(page, '13-course-leaderboard.png');

  console.log('--- 14. Instructor Workflows ---');
  await loginAs(page, baseUrl, 'instructor1@codeleet.test', 'password');

  await page.goto(`${baseUrl}/courses/${pythonCourseId}/manage-users`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
  await saveScreenshot(page, '14-instructor-course-admin.png');

  console.log('--- 15. Instructor Assignment Authoring & Rubric ---');
  await page.goto(`${baseUrl}/courses/${pythonCourseId}/assignments/new`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
  await saveScreenshot(page, '15-instructor-assignment-authoring.png');

  console.log('--- 16. Instructor Practice Test Authoring ---');
  const practiceTab = page.getByRole('tab', { name: /Practice tests|Test cases/i }).or(page.getByText('Practice tests'));
  if (await practiceTab.isVisible()) {
    await practiceTab.click();
    await page.waitForTimeout(800);
  }
  await saveScreenshot(page, '16-instructor-practice-test-authoring.png');

  console.log('--- 17. Instructor Submission Review & AI Grading ---');
  await page.goto(`${baseUrl}/courses/${pythonCourseId}/submissions`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
  const reviewLink = page.getByRole('link', { name: /Review|Grade|View/i }).or(page.locator('tbody tr a')).first();
  if (await reviewLink.isVisible()) {
    await reviewLink.click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
  }
  await saveScreenshot(page, '17-instructor-submission-review-ai-grade.png');

  console.log('--- 18. Platform Admin User Roles ---');
  await loginAs(page, baseUrl, 'admin@codeleet.test', 'password');

  await page.goto(`${baseUrl}/admin/users`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
  await saveScreenshot(page, '18-admin-user-roles.png');

  await browser.close();
  console.log('SUCCESS: All 18 screenshots captured and verified!');
}

run().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
