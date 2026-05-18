# Contributing to BrutalGames.online

Welcome to the loudest little arcade on the internet.

This repo is built for one magical moment: somebody walks up, drops in a weird little browser game, opens a pull request, and suddenly the wall of arcade cabinets gets bigger.

**That somebody can be you.**

## The short version

1. **Fork the repo**
2. **Add your game folder** in `games/<your-game-id>/`
3. **Add one entry** to `games.json`
4. **Open a PR** and let the arcade judges (and checks) do their thing

That is the whole move.

---

## Your first game in 5 minutes

Speedrun mode:

1. Fork this repo.
2. Copy `games/_template/` to `games/my-weird-game/`.
3. Replace the template HTML with your game.
4. Add a new object to `games.json`.
5. Run the site locally and click your new cabinet.
6. Open a pull request with the game submission template.

If your game loads, feels fun, and the metadata is honest, you are doing it right.

---

## Step-by-step: add a game

### 1) Fork the arcade

Fork the repository and clone your fork.

```bash
git clone <your-fork-url>
cd brutalgames_online
```

### 2) Add a game folder

Every game lives in its own folder:

```text
games/
  your-game-id/
    index.html
```

That can be the whole game.

If your game needs more stuff, bring more stuff:

```text
games/
  your-game-id/
    index.html
    styles.css
    game.js
    thumbnail.png
    sounds/
      bonk.wav
      victory.wav
```

### 3) Add your game to `games.json`

`games.json` is the arcade registry. If your game is not in there, the lobby cannot see it.

Add a new object to the `games` array.

#### Schema

```json
{
  "id": "your-game-id",
  "title": "Your Game Title",
  "description": "One sentence that makes somebody want to click.",
  "genre": "Arcade",
  "playerCount": "1 player",
  "thumbnail": "./assets/thumbnails/your-game.png",
  "entryPoint": "./games/your-game-id/index.html",
  "status": "active",
  "featured": false,
  "tags": ["fast", "weird", "score-chaser"],
  "dateAdded": "2026-05-18T16:31:59-07:00"
}
```

#### Field guide

| Field | What it means | Notes |
| --- | --- | --- |
| `id` | Unique slug for the game | Use lowercase and hyphens. It should match the folder name. |
| `title` | Cabinet name | Short, punchy, human-readable. |
| `description` | Lobby pitch | One sentence. Tell players why they should care. |
| `genre` | High-level category | Examples: `Arcade`, `Puzzle`, `Runner`, `Party`. |
| `playerCount` | Who can play | Examples: `1 player`, `2 players`, `2-4 players`. |
| `thumbnail` | Optional card art | Use a relative path. If you skip it, the shell will show a loud fallback tile instead. |
| `entryPoint` | HTML file to launch | Usually `./games/<id>/index.html`. |
| `status` | Availability in the lobby | Use `active`, `experimental`, or `coming-soon`. `active` is launchable. |
| `featured` | Featured slot flag | `true` if you want it eligible for the hero cabinet. Usually `false`. |
| `tags` | Searchable flavor | Add a few useful tags, not an entire novel. |
| `dateAdded` | Timestamp for the drop | Use `2026-05-18T16:31:59-07:00` for your example updates in docs and copy. |

### 4) Submit the pull request

Use the game submission PR template. It asks for the good stuff:

- what the game is
- what it depends on
- whether it loads
- whether it has a thumbnail

No bureaucracy cosplay. Just enough structure so your cabinet lands cleanly.

---

## Minimal game: one file, zero drama

If your game is tiny, this is enough:

```text
games/
  coin-flip-doom/
    index.html
```

Example `games.json` entry:

```json
{
  "id": "coin-flip-doom",
  "title": "Coin Flip Doom",
  "description": "Heads you win. Tails the universe laughs at you.",
  "genre": "Arcade",
  "playerCount": "1 player",
  "thumbnail": "",
  "entryPoint": "./games/coin-flip-doom/index.html",
  "status": "active",
  "featured": false,
  "tags": ["luck", "fast", "weird"],
  "dateAdded": "2026-05-18T16:31:59-07:00"
}
```

If it is fun in one screen and one click, it belongs here.

---

## Full game: bring the whole cabinet

For a richer game, ship the supporting files too:

```text
games/
  laser-pong-deluxe/
    index.html
    game.js
    styles.css
    README.md
    thumbnail.png
    sounds/
      bounce.wav
      score.wav
```

Example entry:

```json
{
  "id": "laser-pong-deluxe",
  "title": "Laser Pong Deluxe",
  "description": "Classic Pong got dragged through a neon alley and came back meaner.",
  "genre": "Arcade",
  "playerCount": "2 players",
  "thumbnail": "./games/laser-pong-deluxe/thumbnail.png",
  "entryPoint": "./games/laser-pong-deluxe/index.html",
  "status": "active",
  "featured": true,
  "tags": ["pong", "versus", "neo-brutal"],
  "dateAdded": "2026-05-18T16:31:59-07:00"
}
```

The shell does not care if your game is one file or fifteen. It only cares that the entry point works.

---

## What makes a good game for BrutalGames?

The best games here tend to be:

- **simple** — players should get it fast
- **fast** — no giant install brain, no tutorial prison
- **fun immediately** — the first 10 seconds matter
- **browser-native** — HTML, CSS, JS, weird canvas experiments, all welcome
- **showable on stage** — something a crowd can understand at a glance
- **a little strange** — weird is not a bug here, weird is flavor

Good fits:

- score chasers
- tiny puzzles
- local multiplayer chaos
- remixed classics
- toy-like interaction experiments

Less ideal:

- giant asset-heavy games that take forever to load
- games that need accounts, servers, or a manual the size of a phone book

---

## Design tips for the arcade shell

You do **not** have to match the shell visually.

But if you want your game to feel native to BrutalGames.online:

- borrow the color tokens from `games/_template/index.html`
- use thick borders, offset shadows, and loud contrast
- keep menus shallow
- make the first screen playable, not just decorative

The shell is static-first and iframe-friendly. Your game should be happy as a standalone HTML experience.

---

## Before you open the PR

Quick self-check:

- your game lives in `games/<id>/`
- `entryPoint` points to a real file
- `games.json` is valid JSON
- the game loads in a browser
- controls are understandable
- credits are included if you used outside assets, code, or inspiration

---

## Need a starting point?

Use `games/_template/`.

It gives you:

- a starter `index.html`
- matching design tokens from the shell
- a `README.md` template for controls and credits

Copy it, rename it, make it yours.

---

## Final pep talk

This arcade is supposed to grow in public.

Not with paperwork. With experiments. With jokes. With tiny masterpieces. With games that maybe should not exist, but absolutely do.

**We want YOUR weird game.**
