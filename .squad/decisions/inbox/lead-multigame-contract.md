### 2026-10-22: Multi-game console contract
**By:** Lead
**What:**
- Layout: root `index.html` (launcher) + `console.js`/`console.css`; `shared/theme.css` (CSS variables + body/back-link); `games/manifest.js`; one folder per game `games/<id>/{index.html,game.js,style.css}`. Asteroids moved to `games/asteroids/`.
- Manifest: `games/manifest.js` sets `window.GAMES = [{id,title,blurb,color,path}]`, `path` relative to repo root (`games/<id>/index.html`). Adding a game = new folder + one manifest entry; launcher renders from it.
- Each game: zero dependencies; links `../../shared/theme.css` before its own `style.css`; uses theme variables (`--bg --panel --screen --accent --ink --border --shadow ...`) rather than hardcoded colors where new; includes `<a class="back-link" href="../../index.html">&larr; Back to console</a>` in `.page`; self-contained in its folder (no cross-game imports); keyboard-driven, ENTER to start, P to pause where applicable.
- Ownership: invaders, snake, breakout folders currently hold "Coming soon" placeholders for their owners to replace; launcher visuals owned by others.
**Why:** Lets games be built in parallel without file conflicts, keeps one theme source.
