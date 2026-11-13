## MODIFIED Requirements

### Requirement: Private cross-assignment submission history
Authenticated students SHALL have a My submissions list of their own stored revisions across assignments, with assignment title, stored language, revision, submitted time and links to existing authorized detail/feedback/published-grade views.

#### Scenario: Required constraints for private cross-assignment submission history
- **WHEN** this capability is used
- **THEN** The server SHALL derive student identity from the verified session and enforce an explicit ownership filter alongside RLS. List reads SHALL exclude source, private rubrics and grades. The list SHALL use deterministic newest-first pagination of 25 items, show loading/empty/safe retry states and retain own revisions when assignment metadata is unavailable. This real-data feature SHALL require authentication even when the synthetic assignment preview is enabled.

#### Scenario: Find and revisit revisions
- **WHEN** a student opens My submissions after saving Python/Java revisions to different assignments
- **THEN** their revisions appear newest first with paging and each link opens the original immutable source and existing feedback/grade view

#### Scenario: Foreign identity or role
- **WHEN** a student supplies another student ID through query parameters or a signed-out/instructor account requests the list
- **THEN** query parameters cannot change the verified identity and role/session guards prevent unauthorized list access

#### Scenario: Missing assignment metadata or failed query
- **WHEN** an own revision has unavailable assignment metadata or the history query fails
- **THEN** unavailable metadata uses a neutral label without losing the revision, while failures show a retry state without disclosing backend details or using fixtures

#### Scenario: New revision between pages
- **WHEN** a newer revision is inserted after a student opens a history page and before they follow its Next link
- **THEN** navigation continues strictly after the last displayed timestamp/ID pair without repeating or skipping existing revisions because of that insert, including when timestamps tie

#### Scenario: Previous, refresh and filters
- **WHEN** a student follows Previous, refreshes, uses browser history or changes title/language filters
- **THEN** URL cursors retain the requested position for unchanged filters, Previous reads the nearest newer slice in newest-first display order, and applying/clearing filters or choosing Latest submissions starts a fresh first page

#### Scenario: Invalid or legacy navigation
- **WHEN** cursor input is duplicated, malformed or conflicting, or a legacy later-page URL has no cursor
- **THEN** invalid cursors are rejected before history reads and legacy offset URLs return to the latest filtered page; cursors never grant ownership or course access
