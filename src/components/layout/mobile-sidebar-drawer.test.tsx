/** @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { MobileSidebarDrawer } from './mobile-sidebar-drawer';

const closeMenuLabel = 'Close navigation menu';

describe('MobileSidebarDrawer', () => {
  it('focuses the close control, keeps Tab inside, closes with Escape, and returns focus', () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open menu
          </button>
          <MobileSidebarDrawer isOpen={open} onClose={() => setOpen(false)}>
            <a href="#course">Course link</a>
          </MobileSidebarDrawer>
        </>
      );
    }
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Open menu' });
    trigger.focus();
    fireEvent.click(trigger);
    const close = screen.getByRole('button', { name: closeMenuLabel });
    expect(document.activeElement).toBe(close);
    const link = screen.getByRole('link', { name: 'Course link' });
    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(link);
    link.focus();
    fireEvent.keyDown(link, { key: 'Tab' });
    expect(document.activeElement).toBe(close);
    fireEvent.keyDown(close, { key: 'Escape' });
    expect(screen.queryByRole('button', { name: closeMenuLabel })).toBeNull();
    expect(document.activeElement).toBe(trigger);
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('button', { name: closeMenuLabel }));
    expect(document.activeElement).toBe(trigger);
  });

  it('closes only when the backdrop itself is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(
      <MobileSidebarDrawer isOpen onClose={onClose}>
        <button type="button">Navigation link</button>
      </MobileSidebarDrawer>,
    );

    const backdrop = container.querySelector('[aria-hidden="true"]');
    expect(backdrop).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Navigation link' }));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(backdrop!);

    expect(onClose).toHaveBeenCalledOnce();
    expect(
      screen.getByRole('button', { name: 'Navigation link' }),
    ).toBeDefined();
  });
});
