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

  it('limits instructor assignments highlight to assignment routes excluding actions', () => {
    const asgHref = `/courses/${CID}/instructor`;
    expect(isNavItemActive(asgHref, `/courses/${CID}/instructor`, CID)).toBe(
      true,
    );
    expect(
      isNavItemActive(
        asgHref,
        `/courses/${CID}/instructor/assignments/a1/edit`,
        CID,
      ),
    ).toBe(true);
    expect(
      isNavItemActive(
        asgHref,
        `/courses/${CID}/instructor/assignments/a1/practice-tests`,
        CID,
      ),
    ).toBe(true);
    expect(
      isNavItemActive(
        asgHref,
        `/courses/${CID}/instructor/submissions/s1`,
        CID,
      ),
    ).toBe(true);
    // Excludes new assignment action (has own nav button) and ai-context
    expect(
      isNavItemActive(
        asgHref,
        `/courses/${CID}/instructor/assignments/new`,
        CID,
      ),
    ).toBe(false);
    expect(
      isNavItemActive(asgHref, `/courses/${CID}/instructor/ai-context`, CID),
    ).toBe(false);
  });

  it('handles standard feature and action matching', () => {
    const newHref = `/courses/${CID}/instructor/assignments/new`;
    expect(isNavItemActive(newHref, newHref, CID)).toBe(true);

    const contextHref = `/courses/${CID}/instructor/ai-context`;
    expect(isNavItemActive(contextHref, contextHref, CID)).toBe(true);

    const forumsHref = `/courses/${CID}/forums`;
    expect(isNavItemActive(forumsHref, `${forumsHref}/thread-1`, CID)).toBe(
      true,
    );
  });
});
