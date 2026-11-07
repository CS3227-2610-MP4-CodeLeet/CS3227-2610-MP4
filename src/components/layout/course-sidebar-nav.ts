export function isNavItemActive(
  itemHref: string,
  pathname: string,
  courseId: string,
): boolean {
  if (itemHref === `/courses/${courseId}`) {
    return pathname === itemHref;
  }
  if (itemHref === `/courses/${courseId}/instructor`) {
    if (pathname === itemHref) return true;
    if (pathname.startsWith(`/courses/${courseId}/instructor/assignments/`)) {
      return pathname !== `/courses/${courseId}/instructor/assignments/new`;
    }
    return pathname.startsWith(`/courses/${courseId}/instructor/submissions/`);
  }
  return pathname === itemHref || pathname.startsWith(`${itemHref}/`);
}
