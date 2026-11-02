# Dependabot Configuration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Configure weekly dependency update PRs for the repository's pnpm workspace and GitHub Actions.

**Architecture:** Use GitHub's `npm` ecosystem for the pnpm workspace at `/`, and `github-actions` at `/`. Group compatible minor and patch package updates and workflow action updates to limit PR noise; keep major package updates individually reviewable.

**Tech Stack:** Dependabot configuration schema version 2, pnpm workspace manifests and lockfile, GitHub Actions.

**Spec:** [Approved design](../specs/2026-11-01-test-coverage-and-dependency-updates-design.md)

## Global Constraints

- Do not change dependency versions or the lockfile as part of adding Dependabot configuration.
- Do not claim security alerts or security updates are enabled by a YAML file; repository security settings control those features.
- This repository's pnpm 12 lockfile contains two YAML documents. GitHub currently supports pnpm 12 version updates but does not detect dependencies from that lockfile format for Dependabot alerts/security update PRs; report this limitation and do not imply the config enables pnpm security coverage.
- Keep the update cadence weekly and avoid excessively large update groups.
- Preserve the repository's Node and pnpm version pins; Dependabot PRs must be verified by the existing CI.

## Review Focus

- pnpm detection: use the supported `npm` ecosystem at the workspace root.
- Action updates: monitor workflow references from `.github/workflows` through `github-actions` at `/`.
- Update volume: group minor and patch npm updates and group GitHub Actions updates.
- Major versions: keep them separately reviewable because they may require migration work.
- Security updates: document their dependence on GitHub repository settings.
- pnpm 12 lockfile: distinguish version update support from dependency-graph-based alert/security update support.

---

### Task 1: Add Dependabot schedules

**Files:**
- Create: `.github/dependabot.yml`

**Interfaces:**
- Produces: weekly Dependabot version update PRs for root pnpm dependencies and GitHub Actions, targeting the repository's default branch.

- [x] Add `version: 2` and an `npm` update entry at `/` with a weekly Monday schedule and a bounded open PR limit.
- [x] Group `minor` and `patch` npm updates together; leave major updates separate.
- [x] Add a `github-actions` entry at `/` with a weekly Monday schedule, bounded PR limit, and a single compatible update group.
- [x] Validate YAML and inspect the final config against the existing root `package.json`, `pnpm-lock.yaml`, and workflow layout.
- [x] Run the applicable repository format and `git diff --check` checks.
- [x] Commit the configuration as `ci: configure Dependabot updates`.

---
