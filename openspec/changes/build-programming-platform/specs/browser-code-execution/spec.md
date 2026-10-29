## ADDED Requirements

### Requirement: Browser-native Python and Java

The authenticated Python/Java editor MAY expose the existing loopback practice runner only in development with the explicit runner flag. It SHALL use the same in-memory source as submission without treating execution results as grades. Production SHALL NOT enable this local runner even if the flag is set. This partial integration does not select a hosted runtime or change the authenticated submission contract.
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
While teacher cases are unavailable, the authenticated assignment workspace MAY expose standalone example cases only when development, browser-runner and example-fixture flags are enabled. The student SHALL explicitly select the examples, whose task and provenance SHALL be clearly distinguished from the assignment. Production and default configuration SHALL not supply fixture cases. Existing browser-only execution, limits and safe results rendering SHALL apply; running examples SHALL not submit source/results or award grades/XP.

#### Scenario: Explicit example selection
- **WHEN** a student selects the development examples and runs the current Python/Java editor source
- **THEN** the UI shows pass/fail, input, expected/actual output or errors for the described example task without claiming assignment correctness

#### Scenario: Opt-out or code change
- **WHEN** the student deselects examples or changes source after a run
- **THEN** deselection cancels/discards example results and source changes invalidate earlier results without changing saved revisions

#### Scenario: Production or disabled fixtures
- **WHEN** the environment is production or either fixture/runner flag is disabled
- **THEN** the server supplies no example cases and no fixture fallback is offered
