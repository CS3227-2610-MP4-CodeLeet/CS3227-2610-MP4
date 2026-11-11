# Paul Cheng’s Reflections: Multi-Agent Software Engineering, Context Engineering, and Resource-Aware Use

## 1. Contribution, Ownership Scope, and Evidence

In our CodeLeet team project, I focused on the student journey from opening an assignment to running code, saving a revision and seeing progress. My contribution was to define the student behaviors we needed, settle ambiguous product rules, direct the relevant Codex work and check the results against specifications and tests. The examples below show the decisions I made, what the agents found, and how those findings changed our implementation.

John and I divided work by role while coordinating on shared interfaces and services. I directed the student coding workspace and browser execution, saved revisions, comparison and draft recovery, plus grades, XP and leaderboard. I also directed Next.js/shared-tooling setup and the runtime investigation. John focused on instructor features and shared services, including the AI gateway. I distinguish my product decisions from implementation, research and checks performed by Codex agents.

The [project brief](../workflow/ProjectBrief.md) records this responsibility split. My student-side work also includes [Java assignment integration](../workflow/plans/2026-10-29-java-assignments.md), [unsaved-code protection](../logs/2026-11-01-unsaved-code-guard.md) and [revision comparison](../logs/2026-11-01-compare-revisions.md). I selected the following three examples because they show a decision, an independent finding or executable check, and a lesson I could apply to the next task.

| My decision or scope | Evidence | What I learned |
| --- | --- | --- |
| Require Python/Java execution inside the browser and authorize specialist investigation | [Runtime coordination](../workflow/evidence/runtime-feasibility/coordination.md), research, review and independent test artifacts | Different specialists exposed different defects before integration. |
| Accept late work, label it Late and apply no automatic penalty | [Deadline decision/implementation log](../logs/2026-11-01-assignment-deadlines.md), [database assertions](../supabase/tests/database/assignment_deadlines.test.sql) | A product choice can become observable timing, retry and forgery checks. |
| Choose and approve the simple personal progress overview | [Dashboard log](../logs/2026-11-03-student-progress.md), [recovery test](../src/app/courses/[courseId]/progress/error.test.tsx), [PR #90](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/pull/90) | Review and a failing test exposed a recovery defect that a visible button alone did not establish. |

## 2. Multi-Agent Software Engineering

### Coordination that produced observable findings

The [27 October runtime experiment](../workflow/evidence/runtime-feasibility/coordination.md) used a coordinator implementing the browser harness, a Java researcher examining candidate APIs/licensing, a security reviewer inspecting the execution boundary and an independent browser tester. Research and review had separate report ownership; the coordinator owned integration, while the tester owned its verification script and artifacts. The sequence was research/design review, implementation, executable testing, repair and replay, with findings triggering additional work.

This is useful evidence because the specialists found different failures. The security reviewer identified an asynchronous reservation race and unbounded empty messages/ready replays. The tester independently reproduced an output-limit status defect; the coordinator fixed it and the recorded replay passed 11/11. The reports preserve source hashes and remaining limits. I would judge coordination by these reproducible findings and their disposition, rather than the number of agent role files.

I could have asked one generalist agent to research Java, design the sandbox, implement it and sign off its own tests. That would have required fewer handoffs, but the same agent would be checking assumptions it had just made. I chose bounded, different questions because language compatibility, security and browser behavior could fail independently. The Java researcher supplied candidate APIs and licensing constraints; the coordinator then tested the downloaded snapshot and found both stdin acceptance probes failed. The security reviewer challenged the message/preparation state machine, while the tester supplied a runnable counterexample for output status. These independent findings changed the implementation path and justified the handoffs for this high-risk investigation.

In ordinary terms, the output cap worked, but the runner returned a general error rather than the correct output-limit status. The independent tester reported the discrepancy and repeated the suite after repair. The eleven cases cover multiple runner behaviors, not eleven tests of only that bug. Their [report](../workflow/evidence/runtime-feasibility/independent-test-review.md) records one local Chromium setup, no full browser matrix or hard memory quota, and limited Java functionality at that stage.

### Review that checked a real recovery outcome

The [progress dashboard record](../logs/2026-11-03-student-progress.md) documents my scope/design decisions and the actual read-only reviewer `/root/student_progress_review`. That agent found that router refresh alone retained the failed route boundary. The reviewer did not run tests. The coordinator verified the finding against installed Next.js documentation/source, wrote a real React boundary test, observed failure, connected the boundary retry callback and observed a pass.

The [regression](../src/app/courses/[courseId]/progress/error.test.tsx) causes a component error, shows the fallback, clicks Try again and waits for recovered content. It separately checks that a private diagnostic is hidden. A button's existence or a mocked refresh call would not prove successful recovery. Paul additionally confirmed John's independent involvement during the 5 November discussion. That is a human report, not a replacement for or inference from the logged agent execution.

The contrast here is between checking an implementation detail and checking the user's outcome. A shallow test could assert that **Try again** renders or that a router method was called. The read-only review exposed why that was insufficient: Next's boundary remained in its error state after a refresh. The failing React test captured the user-visible failure before the retry callback was connected, then passed when content returned. I learned to ask an independent reviewer for a behavior that could falsify my acceptance claim, and to keep the review report distinct from the later test run. John's reported verification adds human scrutiny, but the repository log is the evidence for the named agent's finding and the red-green repair.

For this feature, the historical final local milestone recorded 674 unit passes, 321 database assertions and three actual synthetic dashboard browser journeys, with standard browser prerequisite skips reported separately. Those counts belong to that baseline. They are not fresh tests of the later course integration or a production acceptance claim.

### Context, resources and handoffs

The researcher received runtime requirements and a narrow evidence file, rather than unrelated app/auth material. The security reviewer had a bounded threat question and report ownership. The tester received the executable lab and findings with a separate script write set. The record reports no parallel code-write conflict. Giving each specialist a distinct deliverable let the coordinator integrate findings without reconciling competing runtime edits.

The [coordination record](../workflow/evidence/runtime-feasibility/coordination.md) assigned the Java researcher about twelve primary-source calls/fifteen minutes, the reviewer about ten focused calls/fifteen minutes, and the independent tester twelve minutes with no further delegation. Root owned runtime setup and measurement, so specialists did not independently install the same tools. The budgets and write sets made responsibility explicit; they were requested workflow boundaries, not measured savings or OS-enforced file permissions.

Some overlap was deliberate: the independent tester repeated positive controls to confirm that the real boundary worked. That costs time, but an independent result is stronger than accepting the implementer's summary. Findings were resolved through messages, source repairs and replay, rather than letting several agents edit the same runtime simultaneously. A handoff should therefore retain the baseline/hash, scope, failed assertion, repaired behavior, actual checks, remaining limits and next owner.

### When direct work was more appropriate

The [Java input follow-up](../workflow/evidence/runtime-feasibility/java-input-resolution.md) reused the earlier research and harness with direct coordinator implementation. It recorded 31 Java cases and 11 boundary replays, including repairs for input/encoding and output handling. Reusing the existing context avoided commissioning the same research again; these were not new independent reviews.

The original candidate looked promising because it compiled Java source in a browser, but the two failed stdin probes showed that “compiles” was not the acceptance criterion for our students' programs. The follow-up supplied browser-compatible input support, then caught charset, emoji chunking and Stop/output problems in executable cases. This changed my decision rule: first test the narrow behavior a learner needs, then integrate a candidate. It also illustrates when *not* to delegate again. Once the missing input behavior and harness were concrete, one implementation owner could repair and rerun the existing cases without repeating the broad licensing/API investigation.

Revision comparison and deadlines also have direct coordinator records. A specialist per small UI file would add context transfer and integration work without automatically producing better outcomes. My rule is to use delegation for independent questions with meaningful uncertainty or risk, and keep tightly coupled edits with one accountable implementer. The runtime's independent defect reports show why that distinction mattered in practice.

## 3. Context Engineering

### Stable rules and task-specific retrieval

The repository separates brief/process rules from OpenSpec requirements, per-change plans and dated logs. A student task needs the relevant contract, routes, tests and current handoff; it does not need every earlier feature conversation. For revision comparison, the important context is own-revision access, immutable source and bounded diff behavior. For deadlines it is the accepted late rule, database capture and retry invariants.

This separation only works when documents agree. The [2 November audit](../logs/2026-11-02-user-guide-security-evidence.md) found early preview-only claims alongside newer forum/runner behavior. Retrieving more of that text without checking its date could reinforce an obsolete assumption. My lesson is to supply the current contract and commit first, then retrieve historical explanations when they resolve an uncertainty. The audit is a concrete contradiction example, not a measured comparison of prompt layouts.

The alternative I tried to avoid was a single large handoff containing old prototype notes, current course contracts and every test fixture. More text can contain more facts yet still make the task ambiguous: the obsolete preview instruction and the current runner route cannot both describe the live product. In the guide audit I compared the statements with current routes, configuration and tests before replacing them. The team's separate [five-task synthetic packet experiment](../workflow/experiments/2026-11-06-development-context-experiment.md) estimated 1,357 input tokens for focused packets versus 30,022 for broader packets and identified nine obsolete-contract hazards in the broader material. Together, the audit and packet inspection support a practical rule: retrieve the active contract first, then expand context when a test or interface question requires it. The packet figures describe constructed inputs, while the corrected guide contradiction is an observed repository outcome.

### What another agent needs to continue

For student work, I would hand over the issue/OpenSpec task, branch/base commit, allowed files, relevant session/data interfaces, user decisions, actual check results, skipped prerequisites and unresolved next step. The source snapshot and request ID matter when debugging retries; a general statement that submission works is insufficient. Secrets, real student source and raw sensitive prompts do not belong in a handoff.

The [unsaved-code record](../logs/2026-11-01-unsaved-code-guard.md) illustrates why state matters: acknowledgment of the submitted snapshot must not mark newer edits clean. The useful persisted context is that invariant and its regression test, rather than an agent's entire internal reasoning. That gives the next owner a behavior to preserve and a way to check it.

## 4. Resource-aware Use

### Browser execution trades setup cost for separation

The [runtime report](../workflow/evidence/runtime-feasibility/README.md) records approximately 13.53 MB of selected Python assets and 6.72 MB of Java assets. A local cached parent-byte preparation observation was below 1 ms, while fresh interpreter/compiler setup still took seconds. These measure different stages: cached bytes are not a reused interpreter or a provider prompt-cache hit.

Fresh workers per run/test case trade startup cost for state separation. Input/output caps and separate preparation/execution deadlines bound work, but no hard browser memory quota is claimed. In the practice integration observations, roughly 1,171 ms of sandbox lifetime contrasted with 0.4 ms of program execution in one sample. I should not use that single observation as a language-performance benchmark. The lesson is to measure the resource stage that the UI actually reports.

Reusing a warm interpreter might reduce startup work, but would also require a demonstrated way to reset program state between students and cases. The implemented fresh-worker choice favors isolation; the asset cache only avoids rereading bytes. The observed 1,171 ms versus 0.4 ms sample makes the distinction tangible: optimizing the student's algorithm would not explain most of that particular wait. I would measure cold and repeated preparation separately, alongside cancellation and memory behavior before changing the isolation trade-off.

### Development costs and honest measurements

Retries were visible costs: standalone Java success did not initially imply usable input support, and website integration exposed a missing result-field contract that isolated tests missed. The [shared observations](../workflow/evidence/2026-11-02-reflection-observations.md) preserve these failures rather than only the final passing totals. Narrow regression runs are useful during a repair; broader suites are needed after integration changes, not repeatedly after every prose correction.

The next useful experiment is a matched comparison of equivalent tasks under focused and broader context. I would record model/configuration, calls, elapsed time, correctness, review defects and exposed usage counters, while controlling for task difficulty and warm caches. That would test whether the focused handoff improves work rather than merely shrinking constructed input.

There are four different caches to distinguish: browser runtime bytes, application AI review results, any provider-side prompt cache and the development agent's context reuse. A verified application cache hit avoids a product-model request. The browser cache changes asset preparation. Those are concrete mechanisms with different resource effects, so I would measure each at its own boundary.

## 5. Spec-Driven Development and Security in the Student Workflow

### Specifications should settle user-visible ambiguity

For deadlines, the requester explicitly chose late acceptance with a Late marker and no automatic grade penalty. The [assignment specification](../openspec/changes/build-programming-platform/specs/assignments-and-grading/spec.md) then pins current due dates, historical captured deadlines and identical-retry behavior. A date field alone would leave important questions unanswered: whether exactly-at-deadline saves are late, whether extending a date rewrites history and whether a retry gets a new timestamp.

The implementation tests strict greater-than lateness, server-captured metadata and unchanged old revisions after edits/retries. This is a better match to intent than checking only that a date appears. For comparison, the specification requires own saved revisions, read-only diffing and bounded work, not merely two visible code panels. The [comparison summary](../logs/2026-11-01-compare-revisions.md) records privacy and integration checks.

### Treat code and browser results as untrusted

Student code is data for storage/feedback and untrusted executable input for the isolated browser runner. A browser pass result must not become an official grade or XP award. Students must not choose their identity, revision number or lateness through a forged request. Server/session checks and database policies matter even when the UI has no button for a forbidden action.

Prompt injection is another boundary: code comments could request private rubrics or a grade change. Student AI context excludes the rubric, and product models have no tools or publication authority. These are shared product safeguards, not a claim that I authored the AI gateway. The [AI tests and evidence](../workflow/evidence/2026-11-02-security-testing.md) separate structural context tests from live-model observations.

## 6. Conclusions and Next Checks

My strongest supported conclusion is that explicit requirements, bounded specialist tasks and observable checks helped expose concrete defects. I would use specialists for distinct expertise, meaningful uncertainty and independent challenge. I would keep small or tightly connected implementation edits with one owner. Setup, retries and deliberately repeated checks are coordination costs, not automatically avoided work.

The three examples changed how I assess agentic work. For runtime feasibility, the independent findings justified the extra coordination even though net efficiency was unmeasured. For dashboard recovery, a reviewer report became useful only when the coordinator reproduced a failure and checked recovery from the user's perspective. For deadline rules, an accepted product decision became a strict database assertion, including the exact deadline equality case and forgery protection; simply displaying a due date would not have tested the policy. I would repeat the pattern of decision, falsifiable requirement, independent challenge where warranted, and executable verification. I would reduce agent handoffs for small changes and record their actual cost when I do delegate.

The [5 November documentation audit](../workflow/evidence/2026-11-05-documentation-reconciliation.md) verifies course/auth source references, baseline CI and public Pages availability for its recorded commit. The later [release-audit log](../logs/2026-11-09-project-release-audit.md) records a separate coordinator-led repair: 858 local unit passes, 482 local database assertions, 77 authenticated browser passes with one prerequisite skip and 24 preview browser passes with six prerequisite skips. [PR #133](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/pull/133) then merged after its final-head application, authenticated E2E, database, scaffold, CodeQL and coverage checks passed. Those results document the post-merge baseline; they do not retrospectively turn the older student examples into hosted acceptance. I would record the actual hosted commit/address, both roles/languages, migrations, email flows and provider limits before claiming the release is verified.

**What I would measure next.** The linked records establish the local findings and test results I describe. To judge overall efficiency, I would compare matched single-agent and specialist runs and record timing, token use and review defects. I would also complete hosted acceptance across roles and languages before treating the release as fully verified. Provider cache-hit and internal-reasoning counters were not exposed in these records, so I do not convert the constructed-input estimates into a claimed cost saving.
