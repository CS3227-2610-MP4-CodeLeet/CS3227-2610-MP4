## ADDED Requirements

### Requirement: Search discussion titles and opening posts
Authorized forum members SHALL be able to search thread titles or opening-post bodies using case-insensitive literal text before existing stable 25-row pagination. Search SHALL NOT include replies, author identity or unrelated/private data. Input SHALL be trimmed, bounded to 160 characters and reject duplicate/control-character parameters; blank input SHALL browse all discussions. Terms SHALL be safely escaped for both pattern matching and query grammar.

#### Scenario: Find older matching discussions
- **WHEN** a member applies a title/body query and uses Next/Previous or browser navigation
- **THEN** matching discussions use created_at/ID descending order with q retained in URLs; applying/clearing returns to page one, and an empty result offers clear search

#### Scenario: Literal untrusted search input
- **WHEN** a member enters punctuation, quotes, slashes, wildcard symbols or query-injection-shaped text
- **THEN** it matches only literal text, never adds predicates or renders executable markup, and existing verified-member/RLS/projection boundaries remain enforced

### Requirement: Text discussions
The system SHALL allow authorized users to create scoped threads/replies with text-only content, length/request limits and safe rendering.

#### Scenario: Script markup in reply
- **WHEN** a user posts executable markup
- **THEN** the rendered reply does not execute it

#### Scenario: Shared signed-in forum
- **WHEN** a verified student or instructor opens Forums
- **THEN** they can browse threads/replies and create plain-text posts with a trusted username/role and server timestamp, while signed-out and unprovisioned accounts cannot access discussions

#### Scenario: Forged author and direct writes
- **WHEN** a client supplies author/role/time fields or bypasses the posting RPC
- **THEN** unexpected fields and direct database writes are rejected without exposing private profiles, submissions or grading data

#### Scenario: Retry-safe bounded posting
- **WHEN** a member posts a title of 1–160 characters and body of 1–8,000 characters through same-origin JSON bounded to 34,000 bytes
- **THEN** the server atomically enforces ten combined posts per rolling minute, accepts identical request-ID retries before quota and rejects different payloads reusing an ID

#### Scenario: Stable browsing
- **WHEN** a member browses discussion pages
- **THEN** threads/replies use newest-first timestamp/ID ordering with 25 rows per page and safe empty/error/unavailable states on mobile and both themes

### Requirement: Atomic idempotent XP
The system SHALL derive XP from authorized published grades using a documented formula. Awards/adjustments SHALL commit atomically with publication and prevent repeated or concurrent duplicate rewards.

#### Scenario: Duplicate publication
- **WHEN** grade publication repeats or runs concurrently
- **THEN** the student receives only the correct resulting XP amount

#### Scenario: Grade correction
- **WHEN** an instructor authorizes a published-grade correction
- **THEN** XP adjusts to the new formula result rather than adding another full award

#### Scenario: Instructor maximum and best published revision
- **WHEN** an instructor creates or edits an owned assignment
- **THEN** Maximum XP is a required whole number from 0–100,000, with zero awarding no XP; older clients omitting it preserve existing values
- **AND** each student's award is floor(published score / captured rubric maximum × current assignment maximum XP), using only their best currently published revision, with latest revision then grade ID breaking equal-score ties

#### Scenario: Maximum edits, withdrawal and legacy publication
- **WHEN** an instructor changes maximum XP, corrects a published grade or withdraws publication
- **THEN** current awards and nonzero audit deltas change in the same transaction, serialized with publication; no published candidate yields zero
- **AND** later rubric edits do not reinterpret earlier captured score bases; pre-migration grades require instructor review/republishing before earning XP

#### Scenario: Private own XP
- **WHEN** a verified student opens My XP
- **THEN** their exact total and stable 25-row assignment breakdown exclude peer data, private rubrics, unpublished grades, grade/source identifiers and hidden assignment titles
- **AND** client award/ledger writes and private grading-core invocation are denied; browser results and AI suggestions cannot award XP

### Requirement: Deterministic private-data-safe leaderboard
The system SHALL show display names/XP with documented deterministic ties, without emails or private submissions. Synthetic seeds SHALL support local testing.

#### Scenario: Equal XP
- **WHEN** seeded students have equal XP
- **THEN** repeat queries preserve the documented tie order without private profile fields

#### Scenario: Shared ranks and bounded browsing
- **WHEN** a verified student, instructor or admin opens Leaderboard
- **THEN** current students with positive summed server-owned XP appear highest first in 25-row pages, with shared competition ranks (1, 1, 3)
- **AND** ties sort by case-insensitive username then a private stable ID, without changing their shared rank or returning that ID

#### Scenario: Own position and zero XP
- **WHEN** a student browses any page
- **THEN** their exact total and global rank are available even outside that page, and their displayed row is marked You; zero XP is unranked and excluded from the table
- **AND** instructors/admins can browse but are not ranked and receive no student summary

#### Scenario: Corrected awards and narrow access
- **WHEN** published grades, maximum XP or current student roles change
- **THEN** the next leaderboard read reflects authoritative current awards/roles in one snapshot, without writing awards or exposing assignment titles, private grades, submissions, emails or broad peer profiles
- **AND** anonymous/unprovisioned callers, duplicate/invalid pages and forged identity/XP/rank parameters are denied; errors are distinct from empty results
