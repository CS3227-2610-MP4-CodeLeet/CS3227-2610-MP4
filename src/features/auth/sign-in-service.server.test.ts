/* eslint-disable sonarjs/no-duplicate-string -- explicit authentication boundary fixtures. */
import { beforeEach, expect, it, vi } from 'vitest';
import { createHmac } from 'node:crypto';
import { performSignIn } from './sign-in-service.server';

const rpc = vi.fn();
const password = vi.fn();
const dummy = vi.fn();
const getPasswordClient = vi.fn(async () => ({
  auth: { signInWithPassword: password },
}));
const deps = {
  metadata: { rpc },
  secret: 'synthetic-rate-secret-32-characters-minimum',
  getPasswordClient,
  getDummyClient: () => ({ auth: { signInWithPassword: dummy } }),
};
beforeEach(() => {
  vi.clearAllMocks();
  rpc.mockImplementation(async (name: string) => ({
    data:
      name === 'normalize_login_identifier'
        ? 'username:paul'
        : name === 'reserve_login_attempt'
          ? { allowed: true, retry_after: 45 }
          : 'synthetic@example.test',
    error: null,
  }));
  password.mockResolvedValue({
    data: { user: { id: 'synthetic' }, session: {} },
    error: null,
  });
  dummy.mockResolvedValue({
    data: { user: null, session: null },
    error: { status: 400 },
  });
});
it('reserves a database-normalized HMAC before privately resolving and signing in', async () => {
  expect(
    await performSignIn({ identifier: 'PAUL', password: 'secret' }, deps),
  ).toEqual({ kind: 'success' });
  expect(rpc.mock.calls.map((call) => call[0])).toEqual([
    'normalize_login_identifier',
    'reserve_login_attempt',
    'resolve_login_email',
  ]);
  expect(rpc.mock.calls[1][1]).toEqual({
    p_fingerprint: createHmac('sha256', deps.secret)
      .update('username:paul')
      .digest('hex'),
  });
  expect(password).toHaveBeenCalledWith({
    email: 'synthetic@example.test',
    password: 'secret',
  });
});
it('never creates cookies for unknown usernames, even if a dummy provider returns success', async () => {
  rpc.mockImplementation(async (name: string) => ({
    data:
      name === 'normalize_login_identifier'
        ? 'username:absent'
        : name === 'reserve_login_attempt'
          ? { allowed: true, retry_after: 45 }
          : null,
    error: null,
  }));
  dummy.mockResolvedValue({
    data: { user: { id: 'dummy' }, session: {} },
    error: null,
  });
  expect(
    await performSignIn({ identifier: 'absent', password: 'secret' }, deps),
  ).toEqual({ kind: 'credentials' });
  expect(getPasswordClient).not.toHaveBeenCalled();
  expect(dummy).toHaveBeenCalledOnce();
});
it('rejects exhausted budgets before resolution or password authentication', async () => {
  rpc.mockImplementation(async (name: string) => ({
    data:
      name === 'normalize_login_identifier'
        ? 'username:paul'
        : { allowed: false, retry_after: 19 },
    error: null,
  }));
  expect(
    await performSignIn({ identifier: 'Paul', password: 'secret' }, deps),
  ).toEqual({ kind: 'limited', retryAfter: 19 });
  expect(rpc).toHaveBeenCalledTimes(2);
  expect(getPasswordClient).not.toHaveBeenCalled();
});
it('uses email directly after reservation and distinguishes safe service failures', async () => {
  expect(
    await performSignIn(
      { identifier: 'person@example.test', password: 'secret' },
      deps,
    ),
  ).toEqual({ kind: 'success' });
  expect(rpc).toHaveBeenCalledTimes(2);
  expect(password).toHaveBeenCalledWith({
    email: 'person@example.test',
    password: 'secret',
  });
  password.mockResolvedValue({
    data: {},
    error: { status: 503, message: 'private diagnostic' },
  });
  expect(
    await performSignIn({ identifier: 'Paul', password: 'secret' }, deps),
  ).toEqual({ kind: 'unavailable' });
});
it('fails closed on malformed or unavailable metadata and keeps credential errors generic', async () => {
  rpc.mockResolvedValue({ data: null, error: { message: 'private' } });
  expect(
    await performSignIn({ identifier: 'Paul', password: 'secret' }, deps),
  ).toEqual({ kind: 'unavailable' });
  expect(password).not.toHaveBeenCalled();
});
it.each([429, 503])(
  'classifies dummy provider status %s identically to a known account',
  async (status) => {
    rpc.mockImplementation(async (name: string) => ({
      data:
        name === 'normalize_login_identifier'
          ? 'username:absent'
          : name === 'reserve_login_attempt'
            ? { allowed: true, retry_after: 45 }
            : null,
      error: null,
    }));
    dummy.mockResolvedValue({
      data: { user: null, session: null },
      error: { status },
    });
    expect(
      await performSignIn({ identifier: 'absent', password: 'secret' }, deps),
    ).toEqual(
      status === 429
        ? { kind: 'limited', retryAfter: 60 }
        : { kind: 'unavailable' },
    );
    expect(getPasswordClient).not.toHaveBeenCalled();
  },
);
