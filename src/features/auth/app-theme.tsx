'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import {
  ThemeButton,
  useWorkspaceTheme,
} from '@/features/student-assignments/workspace-theme';

export function AppTheme({ children }: { children: ReactNode }) {
  const theme = useWorkspaceTheme();
  const pathname = usePathname();
  const publicPage = [
    '/',
    '/sign-in',
    '/sign-up',
    '/forgot-password',
    '/reset-password',
    '/unauthorized',
  ].includes(pathname);
  return (
    <div
      data-theme={theme}
      className={`app-theme min-h-dvh bg-background text-foreground ${theme === 'dark' ? 'dark' : ''}`}
    >
      {publicPage && (
        <div className="absolute top-4 right-4 z-30">
          <ThemeButton theme={theme} />
        </div>
      )}
      {children}
    </div>
  );
}

export function AccountThemeButton() {
  const theme = useWorkspaceTheme();
  return <ThemeButton theme={theme} />;
}
