export function isNavItemActive(
  itemHref: string,
  pathname: string,
  courseId: string,
): boolean {
  if (itemHref === `/courses/${courseId}`) {
    return pathname === itemHref;
  }
  if (itemHref === `/courses/${courseId}/assignments`) {
    if (pathname === itemHref) return true;
    if (pathname.startsWith(`/courses/${courseId}/assignments/`)) {
      return pathname !== `/courses/${courseId}/assignments/new`;
    }
    return false;
  }
  if (itemHref === `/courses/${courseId}/submissions`) {
    return (
      pathname === itemHref ||
      pathname.startsWith(`/courses/${courseId}/submissions/`)
    );
  }
  return pathname === itemHref || pathname.startsWith(`${itemHref}/`);
}
