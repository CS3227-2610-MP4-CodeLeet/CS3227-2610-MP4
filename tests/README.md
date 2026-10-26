# Planned test suites

Add unit tests for shared services/context/output validation; database tests for RLS and concurrent operations; browser tests for student/instructor workflows and actual Python/Java execution; and deterministic plus bounded live AI security evaluations.

Use synthetic data and local/disposable databases. Keep hosted production credentials out of tests. Application CI includes tests/e2e/bootstrap.spec.ts, a Chromium production-build smoke test. Vitest is configured but has no domain tests yet and explicitly allows no tests at bootstrap. Database/RLS and feature checks are not claimed.
