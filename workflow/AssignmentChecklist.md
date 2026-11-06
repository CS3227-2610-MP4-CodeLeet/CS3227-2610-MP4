# Assignment compliance checklist

Source: user-provided assignment text. Reconciled on 5 November 2026 against develop `29b6c1a` and the [evidence audit](evidence/2026-11-05-documentation-reconciliation.md). Checked means evidence exists for the stated scope, not that the entire assignment or production release is approved. Unchecked means incomplete, awaiting human/operator verification, or not fully evidenced.

## Product and process

- [ ] Two named team members each own a complete role feature set and substantial shared work.
- [x] Programming/software engineering web app with student and instructor roles. Current course routes/services and merged course PRs provide implementation evidence.
- [x] At least one working SoCLaaS feature for each role. Student hints and instructor advisory grading exist; bounded live synthetic evaluations cover both roles. Hosted end-to-end acceptance remains separate.
- [ ] Specs precede implementation; accepted specs match the release.
- [x] Specialist agents coordinate through recorded triggers, context, resource ownership, and handoffs. See actual runtime coordination and independent review/test artifacts.
- [x] Explicit AI security implementation and automated tests, including live adversarial evaluation evidence. See the security map and bounded Promptfoo report; sample passes are not universal resistance or production approval.
- [x] Context engineering and resource-aware use are demonstrated in both product and development process. Role-scoped product context/quotas and bounded development context/budgets/handoffs are recorded. Controlled development comparisons and unavailable usage metrics remain limitations.
- [ ] Online deployment with separate development/production environments and automation.
- [ ] Simple UI, shared services with clear responsibilities, and minimal duplication.
- [ ] Fresh implementation; no previous MP reused.
- [ ] Team-managed hosting outside coding-assistant build-and-host environments.

## Submission artifacts

- [ ] Public team-organization repository named `CS3227-2610-MP4`.
- [x] Source code under `src/`; source tests are colocated and browser/database verification has its natural test folders.
- [x] Workflow artifacts consolidated under `workflow/` with natural OpenSpec/tool integration exceptions explained in the Developer Guide artifact catalog.
- [ ] Accurate `docs/UserGuide.md` with access and testing instructions.
- [ ] Accurate `docs/DeveloperGuide.md`, including architecture, process, artifact catalog, acknowledgements, and AI use declaration.
- [x] Product website published through GitHub Pages. Successful baseline publication and HTTP 200 for overview/both guides verified on 5 November.
- [x] `docs/Reflections.md` links two individual reflections with concrete experiments and analysis. Paul's evidence audit is complete for its stated scope; both members' final personal approval remains separate.
- [ ] Verified interaction summaries under `logs/` throughout development.
- [ ] Latest tested release on `master` before 13 November 2026, 14:00 SGT.
- [ ] Organization name submitted through Canvas quiz by 23 October 2026, 14:00 SGT.
- [ ] No repository changes after final submission; follow the course's final submission instructions.

## Evidence map

| Requirement | Planned evidence location |
| --- | --- |
| Feature acceptance | OpenSpec scenarios and task-level test reports |
| Multi-agent coordination | `workflow/evidence/` handoffs, reviews, and session summaries |
| AI security | Threat model, deterministic tests, and bounded live evaluations |
| Context/resource experiments | `workflow/evidence/` experiment records and `docs/Reflections.md` |
| Deployment separation | Environment mapping, CI run, migration and smoke-test records |
| Individual contribution | Task owners, PRs, review records, and individual reflections |

The 25% multi-agent reflections and 20% engineering-practice components warrant evidence collection from the first development session. Do not reconstruct fictitious agent activity later.

## Remaining gates

Named scopes and implementation links exist, but full individual workload/member approval has not been certified. Current guide source has been reconciled, while complete deployed journeys are still unverified. Fresh-build provenance, SRP/DRY assessment, environment separation/hosting automation, hosted recovery, final accepted-spec synchronization, every log's human review, Canvas registration and final master/freeze require their own evidence. Do not infer them from passing CI. See issue #31 for the remaining runner acceptance scope.
