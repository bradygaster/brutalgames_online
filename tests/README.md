# Playwright E2E Suite

BrutalGames.online now has a Playwright regression suite that exercises the static arcade shell across desktop and mobile projects.

## Running locally

1. Install dependencies:
   - `npm install`
2. Run the full suite:
   - `npm run test:e2e`
3. Run the demo capture only:
   - `npm run test:e2e:demo`
4. Open the HTML report after a run:
   - `npx playwright show-report`

The Playwright config starts the local static server automatically. If you want to run the server yourself, use `npm run serve:test` and then run Playwright with `PLAYWRIGHT_SKIP_WEBSERVER=1`.

## Test coverage

- `shell-loads.spec.js` validates the homepage, major sections, and clean console output.
- `game-grid.spec.js` checks lobby card rendering directly against `games.json`.
- `game-launch.spec.js` verifies the iframe launcher, close button, and Escape handling.
- `navigation.spec.js` validates anchor-based hash routing and back-button behavior.
- `featured-game.spec.js` confirms the featured cabinet is highlighted properly.
- `responsive.spec.js` checks breakpoint-driven grid layout and mobile navigation behavior.
- `new-game-submission.spec.js` covers the critical PR path by injecting a new registry entry and launching it.
- `error-states.spec.js` covers thumbnail fallback behavior and bad metadata tolerance.
- `demo-recording.spec.js` performs a slower, video-friendly end-to-end walkthrough for DevRel capture.

## Adding new scenarios

- Put reusable fixtures under `tests/fixtures/`.
- Add shared helpers to `tests/helpers.js`.
- Prefer registry injection through Playwright routing for submission and error-state scenarios so tests stay isolated and deterministic.
- Use `captureScreenshot()` at meaningful moments when a scenario should leave behind visual artifacts for debugging or storytelling.

## CI workflow

`.github/workflows/e2e-tests.yml` runs on pull requests to `main` and performs the full browser matrix:

- installs Node dependencies
- installs Playwright browsers
- starts the local static server
- runs the Playwright suite
- uploads the HTML report, screenshots, traces, and videos as artifacts

## Video recordings and GIFs

Video recording is enabled for every project in `playwright.config.js`. Razor can pull the generated `.webm` artifacts from CI or from a local run and convert the most compelling segments into animated GIFs. The dedicated demo spec intentionally pauses at key moments so the resulting recording feels presentable instead of rushed.
