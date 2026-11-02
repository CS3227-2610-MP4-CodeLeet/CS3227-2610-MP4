/* eslint-disable sonarjs/no-duplicate-string -- repeated expected text documents the user-facing contract. */
// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProfileForm } from './profile-form';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('profile form', () => {
  it('saves a validated username and keeps email and role read-only', async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ profile: { username: 'New Name' } }), {
        status: 200,
      }),
    );
    vi.stubGlobal('fetch', fetch);
    render(
      <ProfileForm
        username="Old Name"
        email="student@example.test"
        role="student"
      />,
    );
    expect((screen.getByLabelText('Email') as HTMLInputElement).readOnly).toBe(
      true,
    );
    expect((screen.getByLabelText('Role') as HTMLInputElement).readOnly).toBe(
      true,
    );
    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'New Name' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect((await screen.findByRole('status')).textContent).toBe(
      'Profile saved.',
    );
    expect(fetch).toHaveBeenCalledWith(
      '/api/profile',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ username: 'New Name' }),
      }),
    );
    expect((screen.getByLabelText('Username') as HTMLInputElement).value).toBe(
      'New Name',
    );
  });

  it('reports invalid input and authentication expiry', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response('{}', { status: 401 }));
    vi.stubGlobal('fetch', fetch);
    const { rerender } = render(
      <ProfileForm username="Valid" email="x@example.test" role="student" />,
    );
    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: '  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect((await screen.findByRole('alert')).textContent).toContain(
      'Enter a username',
    );
    expect(fetch).not.toHaveBeenCalled();

    rerender(
      <ProfileForm username="Valid" email="x@example.test" role="student" />,
    );
    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'Updated' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    expect(screen.getByRole('alert').textContent).toContain('sign in again');
  });
});
