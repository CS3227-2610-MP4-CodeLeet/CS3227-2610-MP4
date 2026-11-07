// @vitest-environment jsdom
import { Component, type ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import ProgressError from './error';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it('invokes the route boundary retry to recover from a transient render error without exposing it', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  let recovered = false;
  function Content() {
    if (!recovered) throw new Error('PRIVATE_RENDER_DIAGNOSTIC');
    return <h1>Recovered progress</h1>;
  }
  class Boundary extends Component<
    { children: ReactNode },
    { failed: boolean }
  > {
    state = { failed: false };
    static getDerivedStateFromError() {
      return { failed: true };
    }
    render() {
      return this.state.failed ? (
        <ProgressError
          retry={() => {
            recovered = true;
            this.setState({ failed: false });
          }}
        />
      ) : (
        this.props.children
      );
    }
  }
  render(
    <Boundary>
      <Content />
    </Boundary>,
  );
  expect(screen.getByRole('alert').textContent).not.toContain(
    'PRIVATE_RENDER_DIAGNOSTIC',
  );
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(
    await screen.findByRole('heading', { name: 'Recovered progress' }),
  ).toBeTruthy();
});
