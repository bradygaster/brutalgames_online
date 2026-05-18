# Acid — History

## Project Knowledge
- BrutalGames.online: neo-brutalist arcade shell for browser mini-games
- Stack: plain HTML/CSS/JS, static hosting
- Key components: game card grid, navigation bar, hero area, featured game section, footer
- Mobile friendly, fast load times required
- User: Copilot

## Learnings

- 2026-05-18T16:03:14-07:00 — `scripts/main.js` now owns the arcade shell lifecycle: registry fetch, hash routing, launcher overlay, search, genre filtering, mute state, CRT mode, and lazy-loaded thumbnails.
- 2026-05-18T16:03:14-07:00 — The shell assumes `games.json` is root-level and shaped as an array of game objects; it gracefully degrades by rendering status panels into `#featured-game`, `#game-grid`, and the injected `#arcade-info` section when loading or launch failures happen.
- 2026-05-18T16:03:14-07:00 — Placeholder art is generated per title with canvas gradients and cached in-memory, so missing thumbnails still get colorful cards without extra assets.
