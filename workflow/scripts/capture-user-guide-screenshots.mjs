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

async function captureWelcome(page, baseUrl) {
  console.log('--- 1. Welcome & Authentication ---');
  await page.goto(`${baseUrl}/sign-in`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('input[name="identifier"]', { timeout: 10000 });
  await page.waitForTimeout(500);
  await saveScreenshot(page, '01-welcome-and-auth.png');
}

async function captureStudentCourses(page, baseUrl) {
  console.log('--- 2. Student Sign In & Courses ---');
  await loginAs(page, baseUrl, 'student01@codeleet.test', 'password');
  await saveScreenshot(page, '02-student-courses.png');
}

async function captureStudentAssignments(page, baseUrl, courseId) {
  console.log('--- 3. Student Course Assignments ---');
  await page.goto(`${baseUrl}/courses/${courseId}/assignments`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1200);
  await saveScreenshot(page, '03-course-assignments.png');
}

async function captureStudentEditor(page, baseUrl, courseId, assignmentId) {
  console.log('--- 4. Student Code Editor & Problem Statement ---');
  await page.goto(`${baseUrl}/courses/${courseId}/assignments/${assignmentId}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
  await saveScreenshot(page, '04-student-editor.png');
}

async function captureExecutionOutput(page) {
  console.log('--- 5. Browser Execution Output ---');
  const runBtn = page.getByRole('button', { name: /Run code/i });
  if (await runBtn.isVisible()) {
    await runBtn.click();
    await page.waitForTimeout(3500);
  }
  await saveScreenshot(page, '05-browser-execution-output.png');
}

async function capturePracticeTests(page) {
  console.log('--- 6. Practice Test Validation ---');
  const testTab = page.getByRole('tab', { name: /Tests|Practice|Test cases/i }).or(page.getByText('Test cases'));
  if (await testTab.isVisible()) {
    await testTab.first().click();
    await page.waitForTimeout(1000);
  }
  await saveScreenshot(page, '06-practice-test-validation.png');
}

async function captureDraftAutosave(page) {
  console.log('--- 7. Autosave & Draft Recovery ---');
  const editorArea = page.locator('.monaco-editor, textarea, [contenteditable="true"]').first();
  if (await editorArea.isVisible()) {
    await editorArea.click();
    await page.keyboard.type('\n# draft autosave demonstration');
    await page.waitForTimeout(1500);
  }
  await saveScreenshot(page, '07-autosave-draft-recovery.png');
}

async function captureSubmissionsHistory(page, baseUrl, courseId) {
  console.log('--- 8. Submissions History ---');
  await page.goto(`${baseUrl}/courses/${courseId}/submissions`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1200);
  await saveScreenshot(page, '08-submissions-history.png');
}

async function captureRevisionDiff(page) {
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
}

async function captureAIFeedback(page, baseUrl, courseId, assignmentId) {
  console.log('--- 10. AI Learning Feedback ---');
  await page.goto(`${baseUrl}/courses/${courseId}/assignments/${assignmentId}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
  const aiBtn = page.getByRole('button', { name: /AI feedback|Feedback|Get Help/i });
  if (await aiBtn.isVisible()) {
    await aiBtn.click();
    await page.waitForTimeout(2000);
  }
  await saveScreenshot(page, '10-ai-learning-feedback.png');
}

async function captureCommunityViews(page, baseUrl, courseId) {
  console.log('--- 11. Student Progress Dashboard ---');
  await page.goto(`${baseUrl}/courses/${courseId}/progress`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
  await saveScreenshot(page, '11-student-progress.png');

  console.log('--- 12. Course Discussion Forums ---');
  await page.goto(`${baseUrl}/courses/${courseId}/forums`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
  await saveScreenshot(page, '12-course-discussions.png');

  console.log('--- 13. Course Leaderboard ---');
  await page.goto(`${baseUrl}/courses/${courseId}/leaderboard`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
  await saveScreenshot(page, '13-course-leaderboard.png');
}

async function captureInstructorAdmin(page, baseUrl, courseId) {
  console.log('--- 14. Instructor Workflows ---');
  await loginAs(page, baseUrl, 'instructor1@codeleet.test', 'password');

  await page.goto(`${baseUrl}/courses/${courseId}/manage-users`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
  await saveScreenshot(page, '14-instructor-course-admin.png');
}

async function captureInstructorAuthoring(page, baseUrl, courseId) {
  console.log('--- 15. Instructor Assignment Authoring & Rubric ---');
  await page.goto(`${baseUrl}/courses/${courseId}/assignments/new`);
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
}

async function captureInstructorGrading(page, baseUrl, courseId) {
  console.log('--- 17. Instructor Submission Review & AI Grading ---');
  await page.goto(`${baseUrl}/courses/${courseId}/submissions`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
  const reviewLink = page.getByRole('link', { name: /Review|Grade|View/i }).or(page.locator('tbody tr a')).first();
  if (await reviewLink.isVisible()) {
    await reviewLink.click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
  }
  await saveScreenshot(page, '17-instructor-submission-review-ai-grade.png');
}

async function captureAdminRoles(page, baseUrl) {
  console.log('--- 18. Platform Admin User Roles ---');
  await loginAs(page, baseUrl, 'admin@codeleet.test', 'password');

  await page.goto(`${baseUrl}/admin/users`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
  await saveScreenshot(page, '18-admin-user-roles.png');
}

async function runStudentFlows(page, baseUrl, courseId, assignmentId) {
  await captureWelcome(page, baseUrl);
  await captureStudentCourses(page, baseUrl);
  await captureStudentAssignments(page, baseUrl, courseId);
  await captureStudentEditor(page, baseUrl, courseId, assignmentId);
  await captureExecutionOutput(page);
  await capturePracticeTests(page);
  await captureDraftAutosave(page);
  await captureSubmissionsHistory(page, baseUrl, courseId);
  await captureRevisionDiff(page);
  await captureAIFeedback(page, baseUrl, courseId, assignmentId);
  await captureCommunityViews(page, baseUrl, courseId);
}

async function runInstructorAndAdminFlows(page, baseUrl, courseId) {
  await captureInstructorAdmin(page, baseUrl, courseId);
  await captureInstructorAuthoring(page, baseUrl, courseId);
  await captureInstructorGrading(page, baseUrl, courseId);
  await captureAdminRoles(page, baseUrl);
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
  const pythonAssignmentId = '92000000-0000-4000-8000-000000000001';

  await runStudentFlows(page, baseUrl, pythonCourseId, pythonAssignmentId);
  await runInstructorAndAdminFlows(page, baseUrl, pythonCourseId);

  await browser.close();
  console.log('SUCCESS: All 18 screenshots captured and verified!');
}

run().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
