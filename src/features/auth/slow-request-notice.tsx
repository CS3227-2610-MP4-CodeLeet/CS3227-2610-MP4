'use client';

import { useEffect, useState } from 'react';

export function SlowRequestNotice() {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 10000);
    return () => clearTimeout(timer);
  }, []);
  return slow ? (
    <p role="status" className="text-sm text-muted-foreground">
      This is taking longer than usual. Please keep this page open while we
      finish.
    </p>
  ) : null;
}
