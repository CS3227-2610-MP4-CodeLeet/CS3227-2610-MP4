## ADDED Requirements

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
