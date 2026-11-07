# Paul Cheng’s reflections

## My scope and evidence review

AI-assisted individual reflection, evidence reviewed on 5 November 2026 against merged develop `29b6c1a`, dated logs and PR records. Paul has stated his student-side scope, approved the deadline policy and progress design, and confirmed that John also independently found or verified the dashboard recovery issue. This review checks those statements against available records and labels the additional human report separately. It does not substitute for Paul's final approval of every first-person conclusion or a teammate's review of generated logs.

My primary focus was the student experience: the coding workspace and browser execution, saved revisions/comparison/draft recovery, and progress features such as grades, XP and leaderboard. I also directed Next.js/shared-tooling setup and runtime investigation. John and I shared interfaces and services. These are statements of responsibility and direction, not a claim that I personally wrote all code, ran every check, or authored the shared AI gateway and model evaluations.

The strongest student-side examples are [Java assignment integration](../workflow/plans/2026-10-29-java-assignments.md), [unsaved-code protection](../logs/2026-11-01-unsaved-code-guard.md), [revision comparison](../logs/2026-11-01-compare-revisions.md) and [assignment deadlines](../logs/2026-11-01-assignment-deadlines.md). The [project brief](../workflow/ProjectBrief.md) records the responsibility split; shared service work still needs accurate individual attribution. The [security evidence map](../workflow/evidence/2026-11-02-security-testing.md) distinguishes tested behavior from remaining release gates.

| My recorded decision or scope | Agent work and evidence | What I can conclude |
| --- | --- | --- |
| Require Python/Java execution inside the browser and authorize specialist investigation | [Runtime coordination](../workflow/evidence/runtime-feasibility/coordination.md), research, review and independent test artifacts | Specialists contributed different findings. Local acceptance is narrower than production security. |
| Accept late work, label it Late and apply no automatic penalty | [Deadline decision/implementation log](../logs/2026-11-01-assignment-deadlines.md), [database assertions](../supabase/tests/database/assignment_deadlines.test.sql) | A product choice can become observable timing, retry and forgery checks. |
| Choose and approve the simple personal progress overview | [Dashboard log](../logs/2026-11-03-student-progress.md), [recovery test](../src/app/courses/[courseId]/progress/error.test.tsx), [PR #90](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/pull/90) | Review and a failing test exposed a recovery defect that a visible button alone did not establish. |

## 1. Multi-Agent Software Engineering

### Coordination that produced observable findings

The [27 October runtime experiment](../workflow/evidence/runtime-feasibility/coordination.md) used a coordinator implementing the browser harness, a Java researcher examining candidate APIs/licensing, a security reviewer inspecting the execution boundary and an independent browser tester. Research and review had separate report ownership; the coordinator owned integration, while the tester owned its verification script and artifacts. The sequence was research/design review, implementation, executable testing, repair and replay, with findings triggering additional work.

This is useful evidence because the specialists found different failures. The security reviewer identified an asynchronous reservation race and unbounded empty messages/ready replays. The tester independently reproduced an output-limit status defect; the coordinator fixed it and the recorded replay passed 11/11. The reports preserve source hashes and remaining limits. I would judge coordination by these reproducible findings and their disposition, rather than the number of agent role files.

In ordinary terms, the output cap worked, but the runner returned a general error rather than the correct output-limit status. The independent tester reported the discrepancy and repeated the suite after repair. The eleven cases cover multiple runner behaviors, not eleven tests of only that bug. Their [report](../workflow/evidence/runtime-feasibility/independent-test-review.md) records one local Chromium setup, no full browser matrix or hard memory quota, and limited Java functionality at that stage.

### Review that checked a real recovery outcome

The [progress dashboard record](../logs/2026-11-03-student-progress.md) documents my scope/design decisions and the actual read-only reviewer `/root/student_progress_review`. That agent found that router refresh alone retained the failed route boundary. The reviewer did not run tests. The coordinator verified the finding against installed Next.js documentation/source, wrote a real React boundary test, observed failure, connected the boundary retry callback and observed a pass.

The [regression](../src/app/courses/[courseId]/progress/error.test.tsx) causes a component error, shows the fallback, clicks Try again and waits for recovered content. It separately checks that a private diagnostic is hidden. A button's existence or a mocked refresh call would not prove successful recovery. Paul additionally confirmed John's independent involvement during the 5 November discussion. That is a human report, not a replacement for or inference from the logged agent execution.

For this feature, the historical final local milestone recorded 674 unit passes, 321 database assertions and three actual synthetic dashboard browser journeys, with standard browser prerequisite skips reported separately. Those counts belong to that baseline. They are not fresh tests of the later course integration or a production acceptance claim.

### Context, resources and handoffs

The researcher received runtime requirements and a narrow evidence file, not access to arbitrary app/auth changes. The security reviewer had a bounded threat question and report ownership. The tester received the executable lab and findings with a separate script write set. This reduced overlapping edits: the record reports no parallel code-write conflict. It does not prove that agents were always busy or optimally balanced; continuous utilization and idle-time measurements were not captured.

The [coordination record](../workflow/evidence/runtime-feasibility/coordination.md) assigned the Java researcher about twelve primary-source calls/fifteen minutes, the reviewer about ten focused calls/fifteen minutes, and the independent tester twelve minutes with no further delegation. These are requested budgets, not measured cost savings or proof that every budget was met. Root owned runtime setup and measurement, so specialists did not independently install the same tools. Distinct write sets were workflow instructions, not OS-enforced file permissions.

Some overlap was deliberate: the independent tester repeated positive controls to confirm that the real boundary worked. That costs time, but an independent result is stronger than accepting the implementer's summary. Findings were resolved through messages, source repairs and replay, rather than letting several agents edit the same runtime simultaneously. A handoff should therefore retain the baseline/hash, scope, failed assertion, repaired behavior, actual checks, remaining limits and next owner.

### When direct work was more appropriate

The [Java input follow-up](../workflow/evidence/runtime-feasibility/java-input-resolution.md) reused the earlier research and harness with direct coordinator implementation. It recorded 31 Java cases and 11 boundary replays, including repairs for input/encoding and output handling. Reusing the existing context avoided commissioning the same research again; these were not new independent reviews.

Revision comparison and deadlines also have direct coordinator records. A specialist per small UI file would add context transfer and integration work without automatically producing better outcomes. My proposed rule is to use delegation for independent questions with meaningful uncertainty or risk, and keep tightly coupled edits with one accountable implementer. The experiment supports the value of independent findings, but no matched single-agent baseline establishes a net speedup or cost saving.

## 2. Context Engineering

### Stable rules and task-specific retrieval

The repository separates brief/process rules from OpenSpec requirements, per-change plans and dated logs. A student task needs the relevant contract, routes, tests and current handoff; it does not need every earlier feature conversation. For revision comparison, the important context is own-revision access, immutable source and bounded diff behavior. For deadlines it is the accepted late rule, database capture and retry invariants.

This separation only works when documents agree. The [2 November audit](../logs/2026-11-02-user-guide-security-evidence.md) found early preview-only claims alongside newer forum/runner behavior. Retrieving more of that text without checking its date could reinforce an obsolete assumption. My lesson is to supply the current contract and commit first, then retrieve historical explanations when they resolve an uncertainty. The audit is a concrete contradiction example, not a measured comparison of prompt layouts.

### What another agent needs to continue

For student work, I would hand over the issue/OpenSpec task, branch/base commit, allowed files, relevant session/data interfaces, user decisions, actual check results, skipped prerequisites and unresolved next step. The source snapshot and request ID matter when debugging retries; a general statement that submission works is insufficient. Secrets, real student source and raw sensitive prompts do not belong in a handoff.

The [unsaved-code record](../logs/2026-11-01-unsaved-code-guard.md) illustrates why state matters: acknowledgment of the submitted snapshot must not mark newer edits clean. The useful persisted context is that invariant and its regression test, rather than an agent's entire internal reasoning. Internal reasoning-token percentages are unavailable and cannot be reconstructed from wall time.

## 3. Resource-aware Use

### Browser execution trades setup cost for separation

The [runtime report](../workflow/evidence/runtime-feasibility/README.md) records approximately 13.53 MB of selected Python assets and 6.72 MB of Java assets. A local cached parent-byte preparation observation was below 1 ms, while fresh interpreter/compiler setup still took seconds. These measure different stages: cached bytes are not a reused interpreter or a provider prompt-cache hit.

Fresh workers per run/test case trade startup cost for state separation. Input/output caps and separate preparation/execution deadlines bound work, but no hard browser memory quota is claimed. In the practice integration observations, roughly 1,171 ms of sandbox lifetime contrasted with 0.4 ms of program execution in one sample. I should not use that single observation as a language-performance benchmark. The lesson is to measure the resource stage that the UI actually reports.

### Development costs and honest measurements

Retries were visible costs: standalone Java success did not initially imply usable input support, and website integration exposed a missing result-field contract that isolated tests missed. The [shared observations](../workflow/evidence/2026-11-02-reflection-observations.md) preserve these failures rather than only the final passing totals. Narrow regression runs are useful during a repair; broader suites are needed after integration changes, not repeatedly after every prose correction.

No development token bill, provider cache-hit percentage or matched model-routing experiment is available for my student work. I cannot claim a percentage saving from smaller handoffs. A future experiment should compare equivalent tasks under narrow and broader context, recording model/configuration, calls, elapsed time, correctness/review defects and exposed usage counters, while controlling for task difficulty and warm caches. This is proposed work, not a completed experiment.

## 4. SDD and security in the student workflow

### Specifications should settle user-visible ambiguity

For deadlines, the requester explicitly chose late acceptance with a Late marker and no automatic grade penalty. The [assignment specification](../openspec/changes/build-programming-platform/specs/assignments-and-grading/spec.md) then pins current due dates, historical captured deadlines and identical-retry behavior. A date field alone would leave important questions unanswered: whether exactly-at-deadline saves are late, whether extending a date rewrites history and whether a retry gets a new timestamp.

The implementation tests strict greater-than lateness, server-captured metadata and unchanged old revisions after edits/retries. This is a better match to intent than checking only that a date appears. For comparison, the specification requires own saved revisions, read-only diffing and bounded work, not merely two visible code panels. The [comparison summary](../logs/2026-11-01-compare-revisions.md) records privacy and integration checks.

### Treat code and browser results as untrusted

Student code is data for storage/feedback and untrusted executable input for the isolated browser runner. A browser pass result must not become an official grade or XP award. Students must not choose their identity, revision number or lateness through a forged request. Server/session checks and database policies matter even when the UI has no button for a forbidden action.

Prompt injection is another boundary: code comments could request private rubrics or a grade change. Student AI context excludes the rubric, and product models have no tools or publication authority. These are shared product safeguards, not a claim that I authored the AI gateway. The [AI tests and evidence](../workflow/evidence/2026-11-02-security-testing.md) separate structural context tests from live-model observations.

## Conclusions and remaining verification

My strongest supported conclusion is that explicit requirements, bounded specialist tasks and observable checks helped expose concrete defects. I would use specialists for distinct expertise, meaningful uncertainty and independent challenge. I would keep small or tightly connected implementation edits with one owner. Setup, retries and deliberately repeated checks are coordination costs, not automatically avoided work.

The [5 November documentation audit](../workflow/evidence/2026-11-05-documentation-reconciliation.md) verifies merged course/auth changes, current source references, baseline CI and public Pages availability separately from production application acceptance. Historical tests remain attached to their commits/environments. I would record the actual hosted commit/address, both roles/languages, migrations, email flows and provider limits before claiming the release is verified.

Evidence review is complete for the cited claims to the extent described by that audit. Paul must verify his final personal wording and conclusions before submission; teammate review of logs also remains separate. Unfinished work includes a controlled development-context/delegation comparison, unavailable usage measurements and remaining independent/hosted checks. No net time/token saving, production security guarantee or final assignment completion is inferred.
