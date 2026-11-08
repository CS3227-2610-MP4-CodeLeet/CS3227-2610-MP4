# Published practice cases: student integration handoff

Issue [#19](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/19); active OpenSpec `build-programming-platform`, task group 9. Proposed interface; teammate confirmation and persistence/publication implementation are pending.

```ts
type PublicPracticeCase = {
  id: string;
  name: string;
  stdin: string;
  expected_stdout: string;
};
```

The teacher-side owner creates/publishes cases and the authorized server loader returns only public cases for the requested published assignment. The assignment supplies Python/Java language. Keep private rubrics, hidden tests and unpublished cases out of all student responses. Do not accept publication flags, expected output or official scores supplied by students. The endpoint/storage design remains a follow-up: this document does not claim an API exists.

Return cases in display order, with at most five entries, unique nonempty IDs, nonempty names up to 120 characters, stdin up to 4,096 UTF-8 bytes and expected stdout up to 8,192 UTF-8 bytes. Empty cases means no tests action. Missing/invalid/unavailable teacher data must fail closed; never substitute synthetic data. Validate untrusted data before passing it to the client. Show errors as safe text, not HTML.

Students compare successful stdout against expected output. Normalize CRLF/CR to LF and ignore at most one final LF; preserve other whitespace and capitalization. Function return values are not graded. Existing browser budgets are five seconds execution per case, a separate 20-second Java preparation deadline and a 90-second suite deadline, with existing input/output bounds. Runtime/compile errors, timeout and unavailable cases never pass. Results are browser-local practice feedback, not official grades/XP and not submitted with source revisions.

The student integration temporarily supplies explicitly labelled standalone examples only through a server-side development fixture gate and explicit user selection. These examples are not records attached to a real assignment and never indicate its correctness. Production ignores the fixture flag. Replace the adapter only after reviewing the teacher loader's assignment binding, authorization, publication status and DTO validation. No migration is introduced by the student slice.
