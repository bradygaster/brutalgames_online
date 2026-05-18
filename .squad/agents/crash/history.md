# Crash — History

## Project Knowledge
- BrutalGames.online: neo-brutalist arcade shell for browser mini-games
- Stack: plain HTML/CSS/JS, static hosting, no build tools unless justified
- Games load as standalone HTML files or iframe-hosted experiences
- Adding a game = folder + metadata + optional thumbnail
- User: Copilot

## Learnings

- 2026-05-18T16:03:14-07:00 — Established a static-first project structure with `games/`, `assets/`, `components/`, `styles/`, `index.html`, `main.js`, and `games.json` as the core shell paths.
- 2026-05-18T16:03:14-07:00 — Chose a registry-driven loading pattern where `components/game-loader.js` fetches `games.json`, renders featured/grid views, and applies genre/tag filters.
- 2026-05-18T16:03:14-07:00 — Standardized game integration around isolated `games/<id>/index.html` entry points with an iframe-first launcher and new-window fallback.
- 2026-05-18T23:03:14Z — Session complete. Orchestration log written. Architecture, scaffolding, and initial-build session fully documented.
