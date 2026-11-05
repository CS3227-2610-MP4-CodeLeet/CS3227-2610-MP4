# Codex Subagents Configuration

This directory contains declarative subagent configurations for OpenAI Codex and ChatGPT CLI / IDE environments, supporting **Multi-Agent Software Engineering (MASE)** in CodeLeet (CS3227-2610-MP4).

These configurations operationalize the specialist role catalog defined in [`workflow/agents/README.md`](../../workflow/agents/README.md) and adhere to the coordination protocol described in [`workflow/AgentProcess.md`](../../workflow/AgentProcess.md).

## Subagent Roster

| File | Subagent Name | Role | Sandbox Mode | Reasoning Effort | Focus Area |
| --- | --- | --- | --- | --- | --- |
| `spec_planner.toml` | `spec_planner` | Spec & Architecture Planner | `read-only` | `high` | OpenSpec specifications, interface design, task breakdown |
| `security_reviewer.toml` | `security_reviewer` | Independent Security Reviewer | `read-only` | `high` | Supabase Auth/RLS, browser sandbox isolation, SoCLaaS prompt security |
| `test_reviewer.toml` | `test_reviewer` | Independent Test Reviewer | `read-only` | `medium` | Test gaps, edge cases, pgTAP DB assertions, Playwright E2E verification |
| `tdd_implementer.toml` | `tdd_implementer` | TDD Implementer | `workspace-write` | `medium` | Red-Green-Refactor implementation, strictly bounded file ownership |
| `documentation_evidence.toml` | `documentation_evidence` | Documentation & Evidence Auditor | `read-only` | `low` | Link verification, scaffold checks, session log fidelity, guide accuracy |

## Coordination Protocol

As specified in [`workflow/AgentProcess.md`](../../workflow/AgentProcess.md):

1. **Root Coordinator / Orchestrator**: The primary session acts as the coordinator, managing task scoping, resource allocation, and integration decisions.
2. **Separation of Duties**: Implementers cannot review or approve their own code. Security and test reviews must be conducted by independent subagents.
3. **Disjoint Write Sets**: Subagents operate under explicit write boundaries. Reviewers and planners run with `sandbox_mode = "read-only"` to prevent unauthorized code mutations.
4. **Structured Handoffs**: Work transferred between agents follows the format in [`workflow/templates/Handoff.md`](../../workflow/templates/Handoff.md), recording triggers, allowed files, time budgets, and reproducible findings.
5. **No Invented Claims**: Subagents must report actual command outputs and limitations; token counts or hidden reasoning metrics are never fabricated.

## Tool Registration & Usage

In the OpenAI Codex CLI or ChatGPT environment:
- Subagents are formally registered in [`.codex/config.toml`](../config.toml) via `[agents.<role>]` configuration blocks pointing to their respective `config_file = "agents/<role>.toml"`.
- The coordinator can delegate tasks via the `/subagents` command or by mentioning specialized agents (e.g., `@security_reviewer`, `@test_reviewer`).
- Custom subagents inherit the parent environment's permissions and MCP servers while applying specialized developer instructions and sandbox restrictions defined in their configuration file.

