# Assignment compliance checklist

Source: user-provided assignment text. Reconciled on 10 November 2026 against merged develop `66c6d62`, the [5 November evidence audit](evidence/2026-11-05-documentation-reconciliation.md) and [PR #133](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/pull/133). The [11 November rubric audit](evidence/2026-11-11-mp4-rubric-audit.md) adds current branch/deployment evidence and priority actions. Checked means evidence exists for the stated scope, not that the entire assignment or production release is approved. Unchecked means incomplete, awaiting human/operator verification, or not fully evidenced.

## Product and process

- [ ] Two named team members each own a complete role feature set and substantial shared work.
- [x] Programming/software engineering web app with student and instructor roles. Current course routes/services and merged course PRs provide implementation evidence.
- [x] At least one working SoCLaaS feature for each role. Student hints and instructor advisory grading exist; bounded live synthetic evaluations cover both roles. Hosted end-to-end acceptance remains separate.
- [ ] Specs precede implementation; accepted specs match the release.
- [x] Specialist agents coordinate through recorded triggers, context, resource ownership, and handoffs. See actual runtime coordination and independent review/test artifacts.
- [x] Explicit AI security implementation and automated tests, including live adversarial evaluation evidence. See the security map and bounded Promptfoo report; sample passes are not universal resistance or production approval.
- [x] Context engineering and resource-aware use are demonstrated in both product and development process. Role-scoped product context/quotas and bounded development context/budgets/handoffs are recorded and verified through empirical evaluations (context strategy evaluation and development context benchmark). Unexposed provider prompt-cache metrics remain limitations.
- [ ] Online deployment with separate development/production environments and automation.
- [ ] Simple UI, shared services with clear responsibilities, and minimal duplication.
- [ ] Fresh implementation; no previous MP reused.
- [ ] Team-managed hosting outside coding-assistant build-and-host environments.

## Submission artifacts

- [x] Public team-organization repository named `CS3227-2610-MP4`. The [repository](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4) is public under the team organization; final master contents remain a separate gate.
- [x] Source code under `src/`; source tests are colocated and browser/database verification has its natural test folders.
- [x] Workflow artifacts consolidated under `workflow/` with natural OpenSpec/tool integration exceptions explained in the Developer Guide artifact catalog.
- [x] Accurate `docs/UserGuide.md` with access and testing instructions. Source-based reconciliation and the final documentation build are recorded in issue #169; hosted peer walkthrough remains part of release acceptance.
- [x] Accurate `docs/DeveloperGuide.md`, including architecture, process, artifact catalog, acknowledgements, and AI use declaration. Current setup/contracts and artifact paths have source/link/build checks; actual hosted operations remain separately scoped.
- [x] Product website published through GitHub Pages. The [10 November deployment](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/actions/runs/42763793439) succeeded at `dc01d92`; overview and both live guides returned HTTP 200, with updated guide content verified. This is documentation availability, not application production acceptance.
- [x] `docs/Reflections.md` links two individual reflections with concrete experiments and analysis. The cited student examples and post-merge factual status were reconciled; both members' final personal approval remains separate.
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

On 12 November the requester confirmed approval of both personal reflections, contribution claims, acknowledgements and existing generated summaries. This is reported member approval; equal workload has not been independently measured. The new issue #169 summary retains its own human-review state. Current guides have source/link/site-build checks. Public development/production configuration exposes distinct Supabase origins, but complete deployed account journeys, hosted migration/recovery state, team hosting access, final accepted-spec synchronization, Canvas registration and the final master/freeze still require their own evidence. Current checks and unresolved gates are in [the 12 November assessment](evidence/2026-11-12-open-platform-tasks.md).

On 11 November, the GitHub branch API reported protected `master` at `218e35a` and protected `develop` initially at `6a46849`, then at `116bdf2` after [PR #149](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/pull/149) merged. The earlier compare result was diverged because master has separate merge commits; do not infer content equivalence from commit counts. GitHub recorded a successful Production deployment for `218e35a` on 10 November. The team must reconcile and test the actual release commit, merge it to `master` through review, and verify that production runs that SHA. A successful Preview build or Pages deployment does not satisfy this gate.
