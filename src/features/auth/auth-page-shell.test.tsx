// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { AuthPageShell } from './auth-page-shell';

afterEach(cleanup);

it('offers a button-styled way back to the welcome page above the form', () => {
  render(
    <AuthPageShell>
      <form aria-label="Sign in form" />
    </AuthPageShell>,
  );
  const back = screen.getByRole('link', { name: 'Back to welcome page' });
  expect(back.getAttribute('href')).toBe('/');
  expect(back.className).toContain('rounded-md');
  expect(screen.getByRole('main').contains(back)).toBe(true);
  expect(
    back.compareDocumentPosition(screen.getByRole('form')) &
      Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
});
