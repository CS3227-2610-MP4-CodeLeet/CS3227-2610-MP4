# Mvp Evidence Specification

## Purpose

Provides reliable setup, deployment-readiness, architecture, security, measurement, and demonstration evidence for the implemented CodeMentor MVP without claiming unperformed hosted checks.

## Requirements

### Requirement: Deployment configuration is reproducible and secret-safe
The application SHALL document separate development and production Supabase/Vercel configuration, required environment variables, migration steps, instructor provisioning, and recovery considerations. Secret values SHALL remain outside the repository and browser bundle.

#### Scenario: Contributor configures local development
- **WHEN** a contributor follows the setup guide with local Supabase available
- **THEN** the guide identifies required public and server-only settings and starts the application without production credentials

#### Scenario: Required hosted credentials are absent
- **WHEN** deployment or live-provider verification lacks project credentials or network access
- **THEN** the workflow reports that step as pending and does not claim a successful deployment or live evaluation

### Requirement: Architecture and security evidence reflects implemented behavior
The repository SHALL include an architecture diagram, database/access diagram, AI design and data-flow description, threat model, and test evidence tied to actual implementation and commands. Evidence SHALL distinguish automated deterministic security tests from probabilistic live-model evaluations.

#### Scenario: Security report is prepared
- **WHEN** a reader examines the security evidence
- **THEN** each listed control maps to an implemented boundary and a reproducible test or an explicitly marked limitation

#### Scenario: Live-model evaluation is unavailable
- **WHEN** no live SoCLaaS key/model or supported network is available
- **THEN** mocked security tests remain clearly identified and no live-model success is claimed

### Requirement: Demonstration data and reports use synthetic examples
Demo workflows and resource experiments SHALL use synthetic code and accounts. Measurements SHALL be generated from actual executions and SHALL distinguish illustrative, estimated, and provider-reported values.

#### Scenario: Resource experiment runs
- **WHEN** the context comparison evaluates representative synthetic submissions
- **THEN** its report records actual measured request counts, token provenance, latency, cache behavior, and response-quality review fields

#### Scenario: No real student data is present
- **WHEN** demo seeds or committed reports are prepared
- **THEN** they contain no credentials or real student identity, submissions, grades, or private prompts
