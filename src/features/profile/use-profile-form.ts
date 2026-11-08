'use client';

import { useState } from 'react';
import { profileInput, profileResult } from './contracts';

export function useProfileForm(initialUsername: string) {
  const [username, setUsername] = useState(initialUsername);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  function edited(value: string) {
    setUsername(value);
    setSaved(false);
    setError('');
  }

  async function save() {
    const parsed = profileInput.safeParse({ username });
    setSaved(false);
    if (!parsed.success) {
      setError('Enter a username of 1–80 characters without @ or line breaks.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(
          response.status === 401
            ? 'Please sign in again before saving.'
            : typeof result.error?.message === 'string'
              ? result.error.message
              : 'Your profile could not be saved. Try again.',
        );
        return;
      }
      setUsername(profileResult.parse(result).profile.username);
      setSaved(true);
    } catch {
      setError(
        'Your profile could not be saved. Check your connection and try again.',
      );
    } finally {
      setBusy(false);
    }
  }
  return { username, edited, busy, error, saved, save };
}
