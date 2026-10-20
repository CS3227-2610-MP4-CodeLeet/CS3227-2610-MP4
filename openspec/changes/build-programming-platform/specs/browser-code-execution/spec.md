## ADDED Requirements

### Requirement: Browser-native Python and Java
The system SHALL execute Python and compile/execute Java source entirely in the browser through evaluated compatible runtimes. It SHALL NOT send source to remote execution or compilation services.

#### Scenario: Python with stdin
- **WHEN** a student runs supported Python source with buffered stdin
- **THEN** execution occurs locally and captured output/status are displayed

#### Scenario: Java source compilation
- **WHEN** a student runs supported source with a public Main entry class
- **THEN** compilation and execution occur locally and compile errors or output are displayed

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
