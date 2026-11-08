# Security review: <change>

Status: template; no checks have been performed.

| Asset/boundary | Threat | Implemented control | Test/evidence | Residual risk |
| --- | --- | --- | --- | --- |
| Roles and submissions | Cross-user reads/writes, self-promotion | TBD | TBD | TBD |
| Private rubric/draft grades | Student/API/AI leakage | TBD | TBD | TBD |
| AI input/output | Instruction injection, XSS, malformed or oversized output | TBD | TBD | TBD |
| AI budget/cache | Concurrent quota bypass, cross-user cache disclosure | TBD | TBD | TBD |
| Browser runner | App credential access, network, DOM/bridge escape, runaway execution | TBD | TBD | TBD |
| XP and grades | Forged run results, duplicate awards, concurrent publication | TBD | TBD | TBD |
| CI/deployment | Secret leakage, unsafe PR execution, dev/prod crossover | TBD | TBD | TBD |

## Findings

- Severity, reproduction, affected requirement:
- Fix owner and evidence:
- Live-model evaluation setup and limitations:
- Reviewer identity, date, and final disposition:

Prompt wording is defense in depth; authorization and omission of private data must hold independently of model behavior. Workers alone do not prevent network, storage, or origin access.
