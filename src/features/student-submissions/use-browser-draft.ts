'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { DraftController } from './draft-controller';
import {
  clearBrowserDrafts,
  DRAFT_INVALIDATED,
  DRAFT_LOCK,
  type DraftContext,
} from './draft-storage';

function subscribeAuth(controller: DraftController, studentId: string) {
  try {
    const { data } = createSupabaseBrowserClient().auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') void clearBrowserDrafts();
        if (session?.user.id !== studentId) controller.stop();
      },
    );
    return () => data.subscription.unsubscribe();
  } catch {
    controller.stop();
    return () => undefined;
  }
}

function attachBrowser(controller: DraftController, context: DraftContext) {
  const closeChannel = listenForAccountChange(controller);
  const onHide = () => {
    if (document.visibilityState === 'hidden') void controller.flush();
  };
  window.addEventListener('storage', controller.externalChange);
  window.addEventListener(DRAFT_INVALIDATED, controller.stop);
  window.addEventListener('pagehide', controller.flush);
  document.addEventListener('visibilitychange', onHide);
  const unsubscribe = subscribeAuth(controller, context.studentId);
  return () => {
    unsubscribe();
    closeChannel();
    window.removeEventListener('storage', controller.externalChange);
    window.removeEventListener(DRAFT_INVALIDATED, controller.stop);
    window.removeEventListener('pagehide', controller.flush);
    document.removeEventListener('visibilitychange', onHide);
  };
}

function listenForAccountChange(controller: DraftController) {
  try {
    const channel = new window.BroadcastChannel(DRAFT_INVALIDATED);
    channel.onmessage = (event) => {
      if (event.data === 'signed-in') controller.stop();
    };
    return () => channel.close();
  } catch {
    return () => undefined;
  }
}

export function useBrowserDraft(initialSource: string, context?: DraftContext) {
  const [controller] = useState(
    () =>
      new DraftController(initialSource, context, {
        storage: () => window.localStorage,
        lock: (work) => navigator.locks.request(DRAFT_LOCK, work),
      }),
  );
  const [serverSnapshot] = useState(controller.getSnapshot);
  const snapshot = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    () => serverSnapshot,
  );
  useEffect(() => {
    controller.start();
    const detach = context
      ? attachBrowser(controller, context)
      : () => undefined;
    return () => {
      detach();
      controller.dispose();
    };
  }, [controller, context]);
  return {
    ...snapshot,
    resolve: controller.resolve,
    setSource: controller.edit,
    acknowledge: controller.acknowledge,
  };
}
