/** @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MobileSidebarDrawer } from './mobile-sidebar-drawer';

describe('MobileSidebarDrawer', () => {
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
