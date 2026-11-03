# Product website

CodeLeet's Docusaurus documentation site is configured for `https://cs3227-2610-mp4-codeleet.github.io/CS3227-2610-MP4/`. It contains an overview and both guides, with top navigation, sidebar, on-page contents and theme/mobile controls. This is the documentation website, not the authenticated application.

Use pinned Node 24/pnpm from the repository. Run `pnpm site:dev` for local preview, `pnpm site:build` to build, or `pnpm site:serve` to inspect the production build. On Windows without installed pnpm, prefix the command with `npx.cmd --yes pnpm@12.15.0`.

Edit `docs/UserGuide.md` and `docs/DeveloperGuide.md`. The first-party preparation script generates ignored website copies before dev/build and rewrites repository references to GitHub. Restart the dev command after changing canonical guides; builds always regenerate them. Edit `website/docs/overview.md` for the homepage and `website/sidebars.js`/`docusaurus.config.js` for navigation.

The Pages workflow publishes relevant merged changes on `develop`, matching the existing environment policy, and permits manual dispatch on that branch. It does not deploy from PR branches. After the human merge, verify the deployment run and live overview, `/docs/UserGuide/` and `/docs/DeveloperGuide/` under the project base path. Do not claim publication from a successful build alone.

The guide converter supports the current simple inline Markdown link syntax. Add converter coverage before introducing reference-style links, link titles or parenthesized local destinations; do not hand-edit generated pages to work around unsupported syntax.

After building, run `pnpm site:serve --host 127.0.0.1 --port 3200` and, in a second terminal, `node workflow/scripts/verify-documentation-site.mjs`. Install the pinned Playwright Chromium first if needed. The check covers overview/guide navigation, anchors, source/edit links, reload, dark mode, mobile navigation and project-only copy. `DOCS_SITE_URL` can select the published project URL for a later live check. The documentation build/check needs no application credentials or live AI calls.
