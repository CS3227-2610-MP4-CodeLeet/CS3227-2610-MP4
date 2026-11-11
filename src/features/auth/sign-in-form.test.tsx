// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
  signUp: vi.fn(),
  refreshSession: vi.fn(async () => ({ error: null })),
}));
vi.mock('next/navigation', () => ({ useRouter: () => mocks }));
vi.mock('@/lib/supabase/browser', () => ({
  createSupabaseBrowserClient: () => ({ auth: mocks }),
}));
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54321');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'synthetic-publishable');
const { AuthForm } = await import('./auth-form');
const identifierLabel = 'Email or username';
const signupButtonLabel = 'Create student account';
const password = 'Password!123';
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

it('accepts Email or username as text and sends credentials only to the app sign-in endpoint', async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
  vi.stubGlobal('fetch', fetch);
  render(<AuthForm mode="sign-in" />);
  const identifier = screen.getByLabelText(identifierLabel) as HTMLInputElement;
  expect(identifier.type).toBe('text');
  expect(identifier.autocomplete).toBe('username');
  fireEvent.change(identifier, { target: { value: '  PAUL  ' } });
  fireEvent.change(screen.getByLabelText('Password'), {
    target: { value: 'Unchanged-Pass!' },
  });
  fireEvent.submit(
    screen.getByRole('button', { name: 'Sign in' }).closest('form')!,
  );
  await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/'));
  expect(fetch).toHaveBeenCalledWith(
    '/api/auth/sign-in',
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ identifier: 'PAUL', password: 'Unchanged-Pass!' }),
    }),
  );
});
it('shows a safe retry message when sign-in is unavailable', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ error: { message: 'private backend' } }),
          { status: 503 },
        ),
      ),
  );
  render(<AuthForm mode="sign-in" />);
  fireEvent.change(screen.getByLabelText(identifierLabel), {
    target: { value: 'paul' },
  });
  fireEvent.change(screen.getByLabelText('Password'), {
    target: { value: password },
  });
  fireEvent.submit(
    screen.getByRole('button', { name: 'Sign in' }).closest('form')!,
  );
  expect((await screen.findByRole('status')).textContent).toContain(
    'unavailable',
  );
  expect(screen.queryByText('private backend')).toBeNull();
});

it('waits for and validates the successful response body before navigating', async () => {
  let finish!: (value: { ok: boolean }) => void;
  const json = new Promise<{ ok: boolean }>((resolve) => {
    finish = resolve;
  });
  const fetch = vi.fn().mockResolvedValue({ ok: true, json: () => json });
  vi.stubGlobal('fetch', fetch);
  render(<AuthForm mode="sign-in" />);
  fireEvent.change(screen.getByLabelText(identifierLabel), {
    target: { value: 'paul' },
  });
  fireEvent.change(screen.getByLabelText('Password'), {
    target: { value: password },
  });
  fireEvent.submit(
    screen.getByRole('button', { name: 'Sign in' }).closest('form')!,
  );
  await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
  expect(mocks.replace).not.toHaveBeenCalled();
  finish({ ok: true });
  await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/'));
});

it('shows signing-in progress during a slow request and restores retry after failure', async () => {
  let finish!: (response: Response) => void;
  vi.stubGlobal(
    'fetch',
    vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        }),
    ),
  );
  render(<AuthForm mode="sign-in" />);
  fireEvent.submit(
    screen.getByRole('button', { name: 'Sign in' }).closest('form')!,
  );
  const button = screen.getByRole('button', { name: 'Signing in…' });
  expect(button.getAttribute('aria-busy')).toBe('true');
  expect((button as HTMLButtonElement).disabled).toBe(true);
  await act(async () => {
    finish(new Response(null, { status: 503 }));
  });
  expect(
    (screen.getByRole('button', { name: 'Sign in' }) as HTMLButtonElement)
      .disabled,
  ).toBe(false);
});

it('recovers registration controls when the account service throws', async () => {
  let fail!: (error: Error) => void;
  mocks.signUp.mockImplementation(
    () =>
      new Promise((_resolve, reject) => {
        fail = reject;
      }),
  );
  render(<AuthForm mode="sign-up" />);
  fireEvent.change(screen.getByLabelText('Username'), {
    target: { value: 'New Student' },
  });
  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'new@example.test' },
  });
  for (const label of ['Password', 'Confirm password']) {
    fireEvent.change(screen.getByLabelText(label), {
      target: { value: password },
    });
  }
  fireEvent.submit(
    screen.getByRole('button', { name: signupButtonLabel }).closest('form')!,
  );
  expect(
    screen
      .getByRole('button', { name: 'Creating account…' })
      .getAttribute('aria-busy'),
  ).toBe('true');
  await act(async () => {
    fail(new Error('private diagnostic'));
  });
  expect(screen.getByRole('status').textContent).toContain(
    'Account creation failed',
  );
  expect(
    (
      screen.getByRole('button', {
        name: signupButtonLabel,
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(false);
  expect(screen.queryByText('private diagnostic')).toBeNull();
});

it('explains that a confirmation link returns the new student to CodeLeet', async () => {
  mocks.signUp.mockResolvedValue({
    data: { session: null },
    error: null,
  });
  render(<AuthForm mode="sign-up" />);
  fireEvent.change(screen.getByLabelText('Username'), {
    target: { value: 'New Student' },
  });
  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'new@example.test' },
  });
  for (const label of ['Password', 'Confirm password']) {
    fireEvent.change(screen.getByLabelText(label), {
      target: { value: password },
    });
  }
  fireEvent.submit(
    screen.getByRole('button', { name: signupButtonLabel }).closest('form')!,
  );
  const message = (await screen.findByRole('status')).textContent ?? '';
  expect(message).toContain('confirmation link in this browser');
  expect(message).not.toContain('then sign in');
  expect(mocks.replace).not.toHaveBeenCalled();
});
