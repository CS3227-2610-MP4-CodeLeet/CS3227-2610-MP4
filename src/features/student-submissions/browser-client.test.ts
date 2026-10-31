import { expect, it } from 'vitest';
import { createSandboxDocument, isTrustedMessage } from './browser-client';

const parentOrigin = 'https://codeleet.example.edu';
const nonce = 'ab'.repeat(16);
const hostedContext = { nonce, origin: parentOrigin, hosted: true };

it('trusts hosted messages only from the expected opaque iframe and nonce', () => {
  const childWindow = {} as Window;
  const frame = { contentWindow: childWindow } as HTMLIFrameElement;
  const message = (
    source: MessageEventSource | null,
    origin: string,
    token: string,
  ) => ({ source, origin, data: { nonce: token } }) as MessageEvent;

  expect(
    isTrustedMessage(message(childWindow, 'null', nonce), frame, hostedContext),
  ).toBe(true);
  expect(
    isTrustedMessage(
      message({} as Window, 'null', nonce),
      frame,
      hostedContext,
    ),
  ).toBe(false);
  expect(
    isTrustedMessage(
      message(childWindow, parentOrigin, nonce),
      frame,
      hostedContext,
    ),
  ).toBe(false);
  expect(
    isTrustedMessage(
      message(childWindow, 'null', 'wrong'),
      frame,
      hostedContext,
    ),
  ).toBe(false);
});

it('creates an opaque sandbox document with network denied and CSP-bound scripts', () => {
  const html = createSandboxDocument(nonce, parentOrigin);

  expect(html).toContain("default-src 'none'");
  expect(html).toContain(`script-src 'nonce-${nonce}' blob: 'unsafe-eval'`);
  expect(html).toContain('runtime.cspNonce = nonce');
  expect(html).toContain("connect-src 'none'");
  expect(html).toContain('event.origin !== parentOrigin');
  expect(html).toContain('data?.nonce !== nonce');
  expect(html).not.toContain('allow-same-origin');
});
