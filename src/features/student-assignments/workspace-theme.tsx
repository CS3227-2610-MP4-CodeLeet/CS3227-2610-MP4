'use client';

import { useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';

type Theme = 'light' | 'dark';
const key = 'codeleet-workspace-theme';
const changed = 'codeleet-workspace-theme-change';
let sessionChoice: Theme | undefined;

function snapshot(): Theme {
  if (sessionChoice) return sessionChoice;
  try {
    const saved = localStorage.getItem(key);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* Blocked storage must not disable the preference control. */
  }
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
function subscribe(notify: () => void) {
  const system = matchMedia('(prefers-color-scheme: dark)');
  const storage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== key) return;
    sessionChoice = undefined;
    notify();
  };
  window.addEventListener(changed, notify);
  window.addEventListener('storage', storage);
  system.addEventListener('change', notify);
  return () => {
    window.removeEventListener(changed, notify);
    window.removeEventListener('storage', storage);
    system.removeEventListener('change', notify);
  };
}
export function useWorkspaceTheme() {
  return useSyncExternalStore(subscribe, snapshot, (): Theme => 'light');
}
export function ThemeButton({ theme }: { theme: Theme }) {
  const next = theme === 'dark' ? 'light' : 'dark';
  const Icon = theme === 'dark' ? Sun : Moon;
  return (
    <button
      type="button"
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      onClick={() => {
        sessionChoice = next;
        try {
          localStorage.setItem(key, next);
        } catch {
          /* Keep the current-session choice. */
        }
        window.dispatchEvent(new Event(changed));
      }}
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border bg-background text-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <Icon aria-hidden="true" className="size-4" />
    </button>
  );
}
