# Workspace layout refinement

Issue #21, refs #19/#5; existing branch `feat/student-assignment-tests`, PR #20. Active OpenSpec task 9.5. Execute inline without specialist delegation.

Use one Assignments navigation entry in sidebar/Menu; keep assignment discovery in the main table. Make the logo a nonshrinking padded block. Move authenticated submission status/button into a final footer after practice cases. In the shared runner, place Run code above the Run & test heading/input/output, and pass a test-action slot to the cases heading. Use a compositional slot for the development example selector between output and cases. Preserve explicit button types, source and runner cleanup. No storage/API changes.

- [x] Add failing desktop/mobile navigation and authenticated ordering checks.
- [x] Implement shell/action ordering and verify browser behavior for both languages.
- [x] Run applicable static/unit/build/runtime regression checks; update guides/spec/log and PR #20 linked to #21. Preserve unrelated edits and leave human verification pending.
