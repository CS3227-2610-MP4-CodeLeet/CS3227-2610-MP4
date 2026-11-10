import { expect, test } from '@playwright/test';
import { expectNoDocumentOverflow } from './helpers/responsive-layout';

const viewports = [320, 375, 768, 1024, 1440];
const assignments = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    language: 'Python',
    heading: 'Find the largest number',
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    language: 'Java',
    heading: 'Count the vowels',
  },
];

test('preview lists and Python/Java workspaces stay contained at every target width', async ({
  page,
}) => {
  test.setTimeout(180_000);

  for (const width of viewports) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/student/assignments');
    await expect(
      page.getByRole('heading', { name: 'Your assignments' }),
    ).toBeVisible();
    await expectNoDocumentOverflow(page);

    for (const assignment of assignments) {
      await page.goto(`/student/assignments/${assignment.id}`);
      await expect(
        page.getByRole('heading', { name: assignment.heading }),
      ).toBeVisible();

      const editor = page.getByLabel(`${assignment.language} source code`, {
        exact: true,
      });
      const source = `${'x'.repeat(1000)}\n${'print(1)\n'.repeat(80)}`;
      await editor.fill(source);
      const geometry = await editor.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        return {
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
          left: bounds.left,
          right: bounds.right,
        };
      });
      expect(geometry.scrollWidth).toBeGreaterThan(geometry.clientWidth);
      expect(geometry.left).toBeGreaterThanOrEqual(0);
      expect(geometry.right).toBeLessThanOrEqual(width);
      await editor.evaluate((element) => {
        element.scrollLeft = 180;
        element.scrollTop = 240;
        element.dispatchEvent(new Event('scroll'));
      });
      await expect
        .poll(() =>
          page
            .getByTestId('source-highlight')
            .evaluate((element) => element.scrollLeft),
        )
        .toBeGreaterThan(0);
      await expect
        .poll(() =>
          page
            .getByTestId('source-line-numbers')
            .evaluate((element) => element.scrollTop),
        )
        .toBeGreaterThan(0);
      await expectNoDocumentOverflow(page);
    }
  }
});
