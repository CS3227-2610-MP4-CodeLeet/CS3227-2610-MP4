import { expect, test } from '@playwright/test';

test('the local runtime server starts with the student preview app', async ({
  request,
}) => {
  const response = await request.get('http://127.0.0.1:3130/');

  expect(response.ok()).toBe(true);
  expect(await response.text()).toContain('Browser runtime feasibility lab');
});
