import type { ReactNode } from 'react';

export function MobileSidebarDrawer({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose?: () => void;
  children: ReactNode;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex md:hidden">
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className="relative flex w-4/5 max-w-xs flex-col border-r bg-background shadow-xl">
        <div className="absolute right-3 top-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="rounded p-1 text-muted-foreground hover:bg-accent"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        {children}
      </aside>
    </div>
  );
}
