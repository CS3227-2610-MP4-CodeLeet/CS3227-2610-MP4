## ADDED Requirements

### Requirement: Text discussions
The system SHALL allow authorized users to create scoped threads/replies with text-only content, length/request limits and safe rendering.

#### Scenario: Script markup in reply
- **WHEN** a user posts executable markup
- **THEN** the rendered reply does not execute it

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
