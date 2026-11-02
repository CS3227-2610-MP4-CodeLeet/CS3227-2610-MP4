# Paul Cheng’s reflections

## My scope and the evidence behind this draft

AI-assisted MP4 draft, prepared 2 November 2026. Paul must verify contribution attribution, first-person wording and conclusions before submission. The requester identified the student role as their responsibility, with Next.js/shared tooling and browser-runtime work alongside it. This draft uses that recorded scope; it does not establish personal authorship of every linked change or the shared AI gateway.

The strongest student-side examples are [Java assignment integration](../workflow/plans/2026-10-29-java-assignments.md), [unsaved-code protection](../logs/2026-11-01-unsaved-code-guard.md), [revision comparison](../logs/2026-11-01-compare-revisions.md) and [assignment deadlines](../logs/2026-11-01-assignment-deadlines.md). The [project brief](../workflow/ProjectBrief.md) records the responsibility split; shared service work still needs accurate individual attribution. The [security evidence map](../workflow/evidence/2026-11-02-security-testing.md) distinguishes tested behavior from remaining release gates.

## 1. Multi-Agent Software Engineering

### Coordination that produced observable findings

The [27 October runtime experiment](../workflow/evidence/runtime-feasibility/coordination.md) used a coordinator implementing the browser harness, a Java researcher examining candidate APIs/licensing, a security reviewer inspecting the execution boundary and an independent browser tester. Research and review had separate report ownership; the coordinator owned integration, while the tester owned its verification script and artifacts. The sequence was research/design review, implementation, executable testing, repair and replay, with findings triggering additional work.

This is useful evidence because the specialists found different failures. The security reviewer identified an asynchronous reservation race and unbounded empty messages/ready replays. The tester independently reproduced an output-limit status defect; the coordinator fixed it and the recorded replay passed 11/11. The reports preserve source hashes and remaining limits. I would judge coordination by these reproducible findings and their disposition, rather than the number of agent role files.

### Context, resources and handoffs

The researcher received runtime requirements and a narrow evidence file, not access to arbitrary app/auth changes. The security reviewer had a bounded threat question and report ownership. The tester received the executable lab and findings with a separate script write set. This reduced overlapping edits: the record reports no parallel code-write conflict. It does not prove that agents were always busy or optimally balanced; continuous utilization and idle-time measurements were not captured.

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

## What I would improve and verify before submission

The successful documentation branch CI included 147 database assertions and 29 browser passes, but 45 browser tests skipped prerequisites. That is not full deployed role acceptance. Historical authenticated local runs have different totals and belong to their own commits. I would keep a short release checklist with hosted commit/address, both languages/roles, actual-runtime checks, migration status and human verification.

Before using this draft as my individual reflection, I need to confirm my actual contribution links and lessons, add any recorded personal decisions, and review the limitations with my teammate. The remaining gaps include a controlled context/delegation experiment, exposed development usage measurements, independent review where missing and deployed verification. More confident wording would not close those gaps.
