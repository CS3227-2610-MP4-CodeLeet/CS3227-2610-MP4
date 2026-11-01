## ADDED Requirements

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

### Requirement: Deterministic private-data-safe leaderboard
The system SHALL show display names/XP with documented deterministic ties, without emails or private submissions. Synthetic seeds SHALL support local testing.

#### Scenario: Equal XP
- **WHEN** seeded students have equal XP
- **THEN** repeat queries preserve the documented tie order without private profile fields
