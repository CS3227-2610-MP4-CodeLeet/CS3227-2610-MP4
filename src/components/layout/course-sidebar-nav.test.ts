import { describe, it, expect } from 'vitest';
import { isNavItemActive } from './course-sidebar-nav';

const CID = 'c101';

describe('isNavItemActive', () => {
  it('handles course overview exact matching', () => {
    const overviewHref = `/courses/${CID}`;
    expect(isNavItemActive(overviewHref, `/courses/${CID}`, CID)).toBe(true);
    expect(isNavItemActive(overviewHref, `/courses/${CID}/forums`, CID)).toBe(
      false,
    );
  });

  it('limits assignments highlight to assignment routes excluding new action', () => {
    const asgHref = `/courses/${CID}/assignments`;
    expect(isNavItemActive(asgHref, `/courses/${CID}/assignments`, CID)).toBe(
      true,
    );
    expect(
      isNavItemActive(asgHref, `/courses/${CID}/assignments/a1/edit`, CID),
    ).toBe(true);
    // Excludes new assignment action (has own nav button) and context-comparison
    expect(
      isNavItemActive(asgHref, `/courses/${CID}/assignments/new`, CID),
    ).toBe(false);
    expect(
      isNavItemActive(asgHref, `/courses/${CID}/context-comparison`, CID),
    ).toBe(false);
  });

  it('handles standard feature and action matching', () => {
    const newHref = `/courses/${CID}/assignments/new`;
    expect(isNavItemActive(newHref, newHref, CID)).toBe(true);

    const contextHref = `/courses/${CID}/context-comparison`;
    expect(isNavItemActive(contextHref, contextHref, CID)).toBe(true);

    const manageUsersHref = `/courses/${CID}/manage-users`;
    expect(isNavItemActive(manageUsersHref, manageUsersHref, CID)).toBe(true);

    const submissionsHref = `/courses/${CID}/submissions`;
    expect(isNavItemActive(submissionsHref, `${submissionsHref}/s1`, CID)).toBe(
      true,
    );

    const forumsHref = `/courses/${CID}/forums`;
    expect(isNavItemActive(forumsHref, `${forumsHref}/thread-1`, CID)).toBe(
      true,
    );
  });
});
