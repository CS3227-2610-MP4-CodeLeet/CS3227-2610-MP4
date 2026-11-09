const SIDEBAR_STORAGE_KEY = 'codeleet:course-sidebar-collapsed';
const listeners = new Set<() => void>();

export function subscribeSidebar(callback: () => void) {
  listeners.add(callback);
  const onStorage = (event: StorageEvent) => {
    if (event.key === SIDEBAR_STORAGE_KEY) {
      callback();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', onStorage);
  };
}

export function getSidebarSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function getServerSidebarSnapshot(): boolean {
  return false;
}

export function setSidebarCollapsed(collapsed: boolean) {
  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(collapsed));
  } catch {
    // storage disabled or quota exceeded
  }
  listeners.forEach((listener) => listener());
}
