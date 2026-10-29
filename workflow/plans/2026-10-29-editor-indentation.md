# Editor indentation

Issue #15 / PR #16, branch `fix/account-workspace-controls`, active OpenSpec `build-programming-platform` task 7.20.

Use the shared native editor for submissions and practice. Tab inserts spaces to the next four-column stop; selected lines indent together. Shift+Tab removes up to four leading spaces or one tab. Enter retains leading whitespace and adds one level after Python block colons or an opening bracket/Java brace outside strings/comments. Enter between a matching bracket pair creates an indented blank line and aligns the closing delimiter. Typing a Java closing brace on an indented blank line removes one level. This is bounded indentation assistance, not a complete VS Code language service or code formatter.

Keep pure edit calculations separate from DOM keyboard handling. Use a small lexical mask for unfinished strings/comments, preserving line offsets. The syntax-colour grammars remain independent. Preserve selection, source outside the edit, native undo and both scroll layers. Do not intercept composition or modifier shortcuts. Escape then Tab allows normal focus movement; include screen-reader keyboard help. Reject an edit that would exceed the authenticated editor's character limit without truncating source. Runtime, AI and persistence remain unchanged.

- [x] Write failing pure edit tests and browser keyboard regressions.
- [x] Implement edit helpers and shared keyboard hook, including native undo and focus exit; integrate the real form through the shared editor.
- [x] Verify indentation, selected blocks, strings/comments, limits, undo, keyboard escape and actual submission/run regressions. Run relevant static/unit/build checks and update guides/log/spec.
- [x] Commit/push verified work and update PR #16; human verification remains pending.
