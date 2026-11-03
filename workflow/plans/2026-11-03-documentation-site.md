# CodeLeet documentation site implementation plan

Execute inline with TDD, verification and one bounded independent review. This continues issue #87 / PR #88 on the existing documentation branch from develop.

**Goal:** Provide the requested GitHub Pages documentation structure using MP4 content only.
**Design:** Keep the existing MP4 Docusaurus installation. Use a documentation-style overview at the project root, top User Guide/Developer Guide/GitHub links, a left overview/guide sidebar, right on-page contents, breadcrumbs, theme/mobile navigation and a footer. Generate site copies from `docs/UserGuide.md` and `docs/DeveloperGuide.md` before dev/build; rewrite non-site repository links to GitHub rather than importing unrelated files. Do not duplicate hand-maintained guide content or copy MP3 implementation/configuration/text.
**Reference:** User explicitly selected the public MP3 Pages site as a layout reference only. Its overview and both guide pages were read as public HTML; implementation/configuration were not copied.
**Deployment:** Existing GitHub Pages uses workflow builds and its environment allows only develop; the old workflow instead gates master, whose remote baseline is an initial commit. Align publication to develop, automatically on relevant merged pushes and by manual dispatch. Do not relax environment branch restrictions, merge the PR, or claim publication before an actual successful deployment. Publication follows the human merge into the allowed branch.
**Spec:** `build-programming-platform`, engineering-and-delivery / separate deployment and accurate artifacts.

## Review focus

- Project base path `/CS3227-2610-MP4/`, direct guide URLs, anchors, mobile sidebar and dark/light modes.
- Relative repository links, hidden filenames and image targets; reject local paths outside the repository, and copy only the two explicit public guides.
- Guide regeneration after canonical changes; no generated-file drift or stale home-page claims.
- Build workflow triggers match allowed branch/environment and include canonical docs and generator changes.
- Keep the documentation website distinct from the authenticated app; no invented app URL or hosted acceptance.

## Tasks

- [x] Add failing-first generator tests covering guide synchronization, internal links and external repository references.
- [x] Implement first-party guide preparation, documentation routes/navigation/overview/styles and develop Pages publication; update contributor/site instructions and acknowledgements. Subsequent user steering removes all prior-project references from public guide/site copy.
- [x] Verify units, production site build, real local desktop/mobile/theme/deep-link navigation, links/format/spec/workflow structure and independent review.
- [x] Update log and linked issue/PR, commit/push and verify final-head CI; record publication gate accurately. Source head 49f3741 passed all executed PR checks; final metadata-head results are recorded on PR #88. Live Pages publication remains pending merge to develop.
