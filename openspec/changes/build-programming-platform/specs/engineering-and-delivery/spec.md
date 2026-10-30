## ADDED Requirements

### Requirement: Reproducible local workspaces
The repository SHALL provide repeatable local seed data with at least ten synthetic student accounts, three instructor accounts, ten Python/Java assignments, private rubrics, immutable revisions and draft/published grades. Seed commands SHALL target only local development, preserve unrelated records, reject conflicting seed identities and avoid committed passwords or hosted secrets. Contributors SHALL update seeds when relevant schema contracts change.

#### Scenario: Reapply local seed
- **WHEN** a developer runs `db:seed` repeatedly against the local stack
- **THEN** missing fixture rows are created without duplicates or resetting unrelated data, existing fixture edits remain, and only seed-account passwords are rotated to the generated password shown by the command

#### Scenario: Fresh local setup
- **WHEN** migrations and configured local seeds run on a fresh local database
- **THEN** both role workspaces contain synthetic records and a subsequent `db:seed` provides usable generated local login credentials

### Requirement: Actual specialist coordination evidence
The process SHALL retain proposed specs before implementation and actual specialist triggers, bounded context, file ownership, handoffs, review outcomes and available usage metrics. Generated roles SHALL NOT be represented as executed coordination.

#### Scenario: Implementation handoff
- **WHEN** a specialist returns a material implementation task
- **THEN** its record identifies scenarios, changed files, actual checks, blockers and next owner

### Requirement: Security and context-resource experiments
The team SHALL implement/test AI security and record reproducible context/resource experiments with synthetic fixtures, quality checks, measured outcomes and limitations. Product AI SHALL use SoCLaaS.

#### Scenario: Context comparison
- **WHEN** safe baseline and optimized contexts are compared
- **THEN** the record includes actual usage and quality without unauthorized data or unmeasured savings claims

### Requirement: Separate deployment and accurate artifacts
The system SHALL use team-managed deployment automation with separate development/production data/secrets. Release artifacts SHALL include accurate guides, reflections, verified interaction summaries, GitHub Pages product site and tested master code.

#### Scenario: Preview deployment
- **WHEN** a preview/development build is deployed
- **THEN** it uses development resources without production secrets or data

#### Scenario: Release guide review
- **WHEN** a release is prepared
- **THEN** guides match verified deployed behavior and explicitly state unresolved limitations

### Requirement: Reproducible repository agent skills
The repository SHALL keep reviewed agent skills in `.agents/skills` and record each installed external skill's source and content hash in `skills-lock.json`. Skill guidance SHALL preserve project security boundaries, including keeping credentials private and code execution in the browser.

#### Scenario: Reproduce installed skills
- **WHEN** a contributor inspects or refreshes repository agent skills
- **THEN** each installed skill is discoverable under `.agents/skills` and its upstream source and content hash are recorded in `skills-lock.json`
- **AND** skills that instruct agents to expose credentials are excluded

### Requirement: ESLint maintainability limits
The project SHALL enforce configured cyclomatic and cognitive complexity, file and function size, nesting depth, parameter count, statement count and duplicate-string limits for linted JavaScript and TypeScript. The SonarJS plugin SHALL be a development-only dependency, and only explicitly selected SonarJS rules SHALL be enabled.

#### Scenario: Maintainability regression
- **WHEN** lint runs on a changed JavaScript or TypeScript file that exceeds a configured limit
- **THEN** ESLint reports the applicable rule and the existing lint command fails on errors or warnings

#### Scenario: SonarJS scope
- **WHEN** a contributor runs ESLint
- **THEN** the cognitive-complexity and duplicate-string rules are available from SonarJS without enabling unrelated SonarJS recommendations

### Requirement: Reproducible Node and pnpm tooling
The repository SHALL pin one exact supported Node.js 24 patch in `.node-version`, use the exact pnpm version recorded in `package.json`, and invoke pnpm directly without Corepack wrappers. CI and contributor documentation SHALL use the repository pin.

#### Scenario: Local and CI runtime selection
- **WHEN** a contributor or CI job selects Node.js
- **THEN** both use the exact version in `.node-version`, while `package.json` accepts only the Node 24 major line

#### Scenario: Package manager invocation
- **WHEN** a contributor runs an application or website command
- **THEN** project scripts and documentation invoke the pinned pnpm directly without requiring Corepack

### Requirement: Issue-linked development and closeout records
Every material change SHALL link to a scope-matched GitHub issue and an active OpenSpec change before implementation. Contributors SHALL apply relevant repository-local Superpowers skills and commit verified related work incrementally using the repository's Conventional Commit branch/message rules. Before pushing and creating/updating a PR, the contributor SHALL finalize a dated per-change `logs/` summary linking the issue, OpenSpec change, branch/commits and PR, and summarizing each prompt/interaction chronologically, decisions, actual handoffs, checks and limitations. Summaries SHALL be concise and reviewed by a human; they SHALL NOT contain raw transcripts, secrets, credentials, real student data or sensitive prompt content.

#### Scenario: New material change begins
- **WHEN** implementation begins for a material change
- **THEN** an existing issue whose scope matches is linked or a new GitHub issue is created, then an OpenSpec change records the requirements and verification tasks
- **AND** relevant Superpowers skills guide planning and implementation without implying unexecuted specialist work

#### Scenario: Change is ready for PR
- **WHEN** implementation and applicable checks are complete
- **THEN** related verified chunks have Conventional Commits, the dated summary is finalized and human verification remains pending until a teammate reviews it
- **AND** the pushed branch and PR link the issue, OpenSpec change, summary and actual verification evidence
