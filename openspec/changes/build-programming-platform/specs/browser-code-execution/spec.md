## ADDED Requirements

### Requirement: Browser-native Python and Java

The authenticated Python/Java editor MAY expose the existing loopback practice runner automatically in development without a student runner flag. It SHALL use the same in-memory source as submission without treating execution results as grades. Production SHALL NOT enable this local runner regardless of test configuration. This partial integration does not select a hosted runtime or change the authenticated submission contract.
The system SHALL execute Python and compile/execute Java source entirely in the browser through evaluated compatible runtimes. It SHALL NOT send source to remote execution or compilation services.

#### Scenario: Python with stdin
- **WHEN** a student runs supported Python source with buffered stdin
- **THEN** execution occurs locally and captured output/status are displayed

#### Scenario: Java source compilation
- **WHEN** a student runs supported source with a public Main entry class
- **THEN** compilation and execution occur locally and compile errors or output are displayed

#### Scenario: Java buffered input
- **WHEN** supported Java source reads buffered UTF-8 stdin through System.in, BufferedReader or the documented basic Scanner API
- **THEN** browser compilation/execution delivers the input and EOF without modifying student source or using a remote execution service
- **AND** unsupported Scanner APIs produce a compiler diagnostic rather than simulated successful execution

### Requirement: Isolated and cancellable runner
The runner SHALL isolate untrusted code from app credentials/private data/arbitrary network, validate bridge messages, bound input/output, and implement a tested deadline/stop mechanism. Browser and memory limitations SHALL be documented from evidence.

#### Scenario: Infinite loop or output flood
- **WHEN** source loops indefinitely or exceeds output limits
- **THEN** execution can be stopped with bounded output and a usable UI for a fresh run

#### Scenario: Credential or network access attempt
- **WHEN** source attempts app credential access, app API invocation or unauthorized network access
- **THEN** the verified boundary denies it without exposing credentials

#### Scenario: Initialization failure
- **WHEN** runtime loading fails or browser capabilities are missing
- **THEN** the UI explains recovery without falling back to server execution

### Requirement: Published practice test comparison
Students SHALL be able to run up to five public stdin/expected-stdout cases sequentially in fresh browser sandboxes. Output comparison SHALL normalize line endings and ignore at most one final newline while preserving other whitespace and case. Only successful execution with matching stdout SHALL pass. Results SHALL be practice feedback, never authoritative grades/XP. Teacher authoring/persistence remains a shared-service contract; a local fixture preview SHALL be labeled and denied in production.

#### Scenario: Matching and mismatching output
- **WHEN** a published case runs successfully
- **THEN** the UI shows Passed or Wrong output alongside input, expected stdout and actual stdout as safe text

#### Scenario: Failed or cancelled test run
- **WHEN** compilation/execution fails, exceeds a limit or the student stops the suite
- **THEN** the UI distinguishes the outcome and leaves remaining cases unrun without marking them passed

#### Scenario: Separate execution budget
- **WHEN** Python begins executing or compiled Java begins its main method
- **THEN** its five-second per-case execution deadline starts separately from runtime loading/compilation, and displayed timing is approximate local wall time

### Requirement: Development examples in real student assignments
While teacher cases are unavailable, the authenticated assignment workspace MAY expose standalone example cases only in development with the explicit example-fixture setting. The student SHALL explicitly select the examples, whose task and provenance SHALL be clearly distinguished from the assignment. Production and default configuration SHALL not supply fixture cases. Existing browser-only execution, limits and safe results rendering SHALL apply; running examples SHALL not submit source/results or award grades/XP.

#### Scenario: Explicit example selection
- **WHEN** a student selects the development examples and runs the current Python/Java editor source
- **THEN** the UI shows pass/fail, input, expected/actual output or errors for the described example task without claiming assignment correctness

#### Scenario: Opt-out or code change
- **WHEN** the student deselects examples or changes source after a run
- **THEN** deselection cancels/discards example results and source changes invalidate earlier results without changing saved revisions

#### Scenario: Production or disabled fixtures
- **WHEN** the environment is production or the example-fixture setting is disabled
- **THEN** the server supplies no example cases and no fixture fallback is offered

### Requirement: Real-data local defaults
Real accounts and assignments SHALL be the normal development workflow. Synthetic assignments SHALL require PLAYWRIGHT_ASSIGNMENT_FIXTURES=true on a development UI-test server and SHALL never be a production fallback. The two former student preview flags SHALL not control application behavior. Local browser execution SHALL still require prepared assets and the separate static runtime service.

#### Scenario: Normal local startup
- **WHEN** a developer starts Next.js without fixture settings
- **THEN** student pages require real authentication and local Run code is available for real Python/Java assignments

### Requirement: Vercel-hosted browser execution for students and instructors
The system SHALL expose explicit Run code for authenticated students on their assignment editor and authenticated instructors on an owned assignment's submission-review page in Vercel Preview and Production. It SHALL use the current editor source or the already-authorized submission source/language and execute only in the browser through Pyodide/TeaVM. It SHALL NOT execute source in Next.js, Node.js, a Vercel Function or a remote execution/compiler service. Runs and results SHALL NOT submit revisions, publish grades or award XP.

The deployed bridge/runtime SHALL be served from a separate static, credential-free Vercel origin that auto-deploys for the matching repository branch and Production. The static build SHALL fetch only approved runtime artifacts matching committed SHA-256 values, include their required notices, use versioned static paths and expose no execution endpoint. The app SHALL resolve Preview to that branch's static runner and Production to one exact configured HTTPS runner origin. The bridge SHALL accept only the configured app project's exact Production origin and narrowly constrained Preview deployment origins for the configured Vercel scope; it SHALL reject unrelated Vercel tenants, non-HTTPS hosted origins, malformed or missing runtime configuration, and requests with the wrong source window/nonce/protocol/run ID. It SHALL omit credentials for every asset/bootstrap fetch and preserve the opaque sandbox/worker, network denial, input/output bounds and deadlines. Authenticated app CSP SHALL NOT receive the runner's eval allowance.

#### Scenario: Student runs code on a hosted assignment
- **WHEN** an authenticated student explicitly runs Python or Java source in a Vercel Preview or Production assignment workspace
- **THEN** the source executes in the browser sandbox, output/diagnostics return to that workspace, and no submission/grade/XP write or application-server execution occurs

#### Scenario: Instructor runs an authorized submission
- **WHEN** an authenticated instructor explicitly runs source shown on an assignment they own in the submission-review page
- **THEN** that stored source/language executes in the same browser-only runner, with output shown to the instructor and no submission/grade/XP mutation

#### Scenario: Untrusted parent or unavailable runner
- **WHEN** an unconfigured, unrelated, non-HTTPS or unauthorized app origin attempts to use the runner, or static assets fail integrity/configuration checks
- **THEN** the bridge rejects initialization and the UI reports a safe actionable error without sending source to a server or falling back to another execution method