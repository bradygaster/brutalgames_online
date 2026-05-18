# Nikon — History

## Project Knowledge
- BrutalGames.online: neo-brutalist arcade shell for browser mini-games
- Stack: plain HTML/CSS/JS, static hosting, no build tools
- Game addition = folder + games.json entry + optional thumbnail
- Key files: index.html, games.json, scripts/main.js, styles/main.css
- Architecture: games loaded via iframe overlay, metadata-driven grid rendering
- User: Copilot

## Learnings

- Playwright stack lives in `package.json` and `playwright.config.js`, with `http-server` on `http://127.0.0.1:4173` and projects for Chromium, Firefox, WebKit, iPhone 13, and iPad Pro 11.
- Reusable E2E helpers live in `tests/helpers.js`; registry mutation scenarios should use Playwright route fulfillment instead of editing `games.json` on disk.
- Core regression coverage is split across `tests/shell-loads.spec.js`, `tests/game-grid.spec.js`, `tests/game-launch.spec.js`, `tests/navigation.spec.js`, `tests/featured-game.spec.js`, `tests/responsive.spec.js`, `tests/new-game-submission.spec.js`, `tests/error-states.spec.js`, and `tests/demo-recording.spec.js`.
- Fixture assets for submission flows live under `tests/fixtures/`, with `tests/fixtures/sample-game/index.html` as the launch target and `tests/fixtures/games-with-new-entry.json` as the demo registry.
- CI entry point is `.github/workflows/e2e-tests.yml`; it installs browsers, starts the static server, runs Playwright, and uploads reports plus `.webm` recordings for Razor's GIF workflow.

## Team Integration

- 2026-05-18T23:38:57Z — Scribe reconciliation: E2E test suite onboarding successful. All 8 specs + helpers complete. Integration point: `.webm` recordings feed into Razor's GIF generation pipeline via `scripts/generate-demo-gif.ps1`.
