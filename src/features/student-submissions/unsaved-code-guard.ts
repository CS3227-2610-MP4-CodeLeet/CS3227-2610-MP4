const leaveEvent = 'codeleet:before-leave';
const leaveMessage = 'You have unsaved code. Leave without saving?';

// Programmatic navigation must ask before performing irreversible work (sign-out).
export function confirmUnsavedNavigation() {
  return window.dispatchEvent(new Event(leaveEvent, { cancelable: true }));
}

type HistoryNavigation = Event & {
  navigationType?: string;
  destination?: { url: string; sameDocument: boolean };
};
type NavigationWindow = Window & { navigation?: EventTarget };

function changesPage(destination: string) {
  const target = new URL(destination, window.location.href);
  return (
    target.pathname !== window.location.pathname ||
    target.search !== window.location.search
  );
}

function ordinaryClick(event: MouseEvent) {
  return !(
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
}

function guardLink(event: MouseEvent) {
  if (!ordinaryClick(event)) return;
  const link =
    event.target instanceof Element
      ? event.target.closest<HTMLAnchorElement>('a[href]')
      : null;
  if (
    !link ||
    link.hasAttribute('download') ||
    (link.target && link.target !== '_self')
  )
    return;
  const destination = new URL(link.href);
  // External/full-document departures use the browser's unload warning.
  if (destination.origin !== window.location.origin || !changesPage(link.href))
    return;
  if (!window.confirm(leaveMessage)) {
    event.preventDefault();
    event.stopPropagation();
  }
}

function guardHistory(event: Event) {
  const navigation = event as HistoryNavigation;
  if (
    !event.cancelable ||
    navigation.navigationType !== 'traverse' ||
    !navigation.destination?.sameDocument ||
    !changesPage(navigation.destination.url)
  )
    return;
  if (!window.confirm(leaveMessage)) event.preventDefault();
}

export function installUnsavedCodeGuard() {
  function guardUnload(event: BeforeUnloadEvent) {
    event.preventDefault();
    event.returnValue = true;
  }
  function guardExplicitLeave(event: Event) {
    if (!window.confirm(leaveMessage)) event.preventDefault();
  }
  const navigation = (window as NavigationWindow).navigation;
  window.addEventListener('beforeunload', guardUnload);
  window.addEventListener(leaveEvent, guardExplicitLeave);
  document.addEventListener('click', guardLink, true);
  navigation?.addEventListener('navigate', guardHistory);
  return () => {
    window.removeEventListener('beforeunload', guardUnload);
    window.removeEventListener(leaveEvent, guardExplicitLeave);
    document.removeEventListener('click', guardLink, true);
    navigation?.removeEventListener('navigate', guardHistory);
  };
}
