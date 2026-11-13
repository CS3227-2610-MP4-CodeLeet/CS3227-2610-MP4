import { expect, it, vi } from 'vitest';

vi.mock('@/features/practice-test-authoring/routes', () => ({
  readCases: vi.fn(),
}));

import * as route from './route';

it('keeps instructor reads but removes independent test publication writes', () => {
  expect(route.GET).toBeTypeOf('function');
  expect(route).not.toHaveProperty('PATCH');
});
