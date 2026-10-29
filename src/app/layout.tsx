import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { AppTheme } from '@/features/auth/app-theme';

export const metadata: Metadata = {
  title: 'CodeLeet | Programming Assignment Platform',
  description:
    'Programming assignments and learning feedback for students and instructors.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppTheme>{children}</AppTheme>
      </body>
    </html>
  );
}
