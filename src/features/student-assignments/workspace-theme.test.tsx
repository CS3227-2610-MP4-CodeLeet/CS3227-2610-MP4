/* eslint-disable sonarjs/no-duplicate-string -- repeated expected text documents the user-facing contract. */
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ThemeButton, useWorkspaceTheme } from './workspace-theme';

function matchMedia(matches = false) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  return {
    matches,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: (
      _type: string,
      listener: (event: MediaQueryListEvent) => void,
    ) => listeners.add(listener),
    removeEventListener: (
      _type: string,
      listener: (event: MediaQueryListEvent) => void,
    ) => listeners.delete(listener),
    dispatchEvent: (event: Event) => {
      for (const listener of listeners) listener(event as MediaQueryListEvent);
      return true;
    },
    addListener: vi.fn(),
    removeListener: vi.fn(),
  } as unknown as MediaQueryList;
}

function ThemeProbe() {
  const theme = useWorkspaceTheme();
  return <span>{theme}</span>;
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('workspace theme preference', () => {
  it('uses saved preferences and otherwise follows the system snapshot', () => {
    vi.stubGlobal('matchMedia', () => matchMedia(true));
    const view = render(<ThemeProbe />);
    expect(screen.getByText('dark')).toBeTruthy();
    localStorage.setItem('codeleet-workspace-theme', 'light');
    fireEvent(
      window,
      new StorageEvent('storage', { key: 'codeleet-workspace-theme' }),
    );
    expect(screen.getByText('light')).toBeTruthy();
    view.unmount();
  });

  it('persists a session choice, broadcasts it, and provides the reverse action', () => {
    render(
      <>
        <ThemeProbe />
        <ThemeButton theme="dark" />
      </>,
    );
    const dispatch = vi.spyOn(window, 'dispatchEvent');
    fireEvent.click(
      screen.getByRole('button', { name: 'Switch to light mode' }),
    );
    expect(screen.getByText('light')).toBeTruthy();
    expect(localStorage.getItem('codeleet-workspace-theme')).toBe('light');
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'codeleet-workspace-theme-change' }),
    );
    expect(
      screen.getByRole('button', { name: 'Switch to light mode' }),
    ).toBeTruthy();
  });

  it('keeps the session control usable when browser storage is blocked', () => {
    vi.stubGlobal('matchMedia', () => matchMedia(false));
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    render(
      <>
        <ThemeProbe />
        <ThemeButton theme="light" />
      </>,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Switch to dark mode' }),
    );
    expect(screen.getByText('dark')).toBeTruthy();
  });
});
