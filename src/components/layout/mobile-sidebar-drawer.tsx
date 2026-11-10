import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';

const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function keepTabInside(
  event: KeyboardEvent<HTMLElement>,
  drawer: HTMLElement | null,
) {
  if (event.key !== 'Tab' || !drawer) return;
  const focusable = Array.from(
    drawer.querySelectorAll<HTMLElement>(focusableSelector),
  );
  const first = focusable[0];
  const last = focusable.at(-1);
  if (!first || !last) return;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

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
    <OpenMobileSidebarDrawer onClose={onClose}>
      {children}
    </OpenMobileSidebarDrawer>
  );
}

function OpenMobileSidebarDrawer({
  onClose,
  children,
}: {
  onClose?: () => void;
  children: ReactNode;
}) {
  const drawerRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => {
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose?.();
      return;
    }
    keepTabInside(event, drawerRef.current);
  }

  return (
    <div
      id="course-mobile-navigation"
      className="fixed inset-0 z-50 flex md:hidden"
    >
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose?.();
        }}
        aria-hidden="true"
      />
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Course navigation"
        onKeyDown={handleKeyDown}
        className="relative flex w-4/5 max-w-xs flex-col border-r bg-background shadow-xl"
      >
        <div className="absolute right-3 top-3">
          <button
            ref={closeRef}
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
