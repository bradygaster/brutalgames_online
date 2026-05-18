# BrutalGames.online live demo script

**Total runtime:** 8 minutes  
**Structure:** two acts  
**Goal:** make the audience believe they can add their own game before the talk ends

---

## Demo promise

By the end of this demo, the audience should feel two things:

1. "Oh, I could restyle a classic game in this vibe."
2. "Oh wow, I could add my own game to that grid right now."

---

## Act 1 — Make an old game new again (3:00)

### 0:00 - 0:20 — Cold open
**Say:**
- "This is BrutalGames.online: a neo-brutalist browser arcade for tiny games with big personalities."
- "We are going to do two things live: make an old game new again, then drop it into the arcade."

**Show on screen:**
- Home page / arcade grid
- Existing loud shell UI

**Pause beat:**
- tiny beat after "old game new again" for anticipation

### 0:20 - 1:00 — Start from a plain classic
**Say:**
- "Let's start with the most dangerous sentence in software: I made Pong in a hurry."
- "Functionally fine. Aesthetic? Currently a crime."

**Show on screen:**
- Simple Pong or similar starter game before styling
- Bare HTML/CSS or minimalist canvas setup

**Laugh beat:**
- after "currently a crime"

### 1:00 - 2:10 — Add neo-brutalist styling fast
**Say:**
- "We're not rebuilding the game. We're changing the stage presence."
- "Chunky borders. Loud contrast. Arcade type. Hard shadows. No subtlety."

**Show on screen:**
- Add shell-matching CSS variables
- Swap in loud colors
- Add big score boxes / headers / button treatment
- Refresh the page and show the transformation

**Talking points:**
- same game loop, new vibe
- style system is intentionally easy to steal
- simple HTML games can inherit the shell look fast

### 2:10 - 3:00 — Sell the transformation
**Say:**
- "Now it doesn't look like a homework assignment. It looks like a cabinet."
- "That matters, because the repo is built for contribution theater."

**Show on screen:**
- Styled game running
- One fast round of play

**Pause beat:**
- let the audience watch one score / miss / bounce moment land

---

## Act 2 — Add it to the library live (5:00)

### 3:00 - 3:40 — Copy the template
**Say:**
- "Every cabinet in the arcade gets one folder and one JSON entry. That's the whole ritual."
- "No framework ceremony. No plugin tax."

**Show on screen:**
- `games/_template/`
- copy to `games/laser-pong-deluxe/` or similar
- point out `index.html` and `README.md`

### 3:40 - 4:30 — Wire up the metadata
**Say:**
- "This file is the registry. If the game is in `games.json`, the wall knows it exists."
- "If it isn't, the arcade has no idea your masterpiece is here."

**Show on screen:**
- Add new `games.json` object
- Highlight `id`, `title`, `entryPoint`, `status`, and `tags`

**Talking points:**
- thumbnail is nice, but optional
- `active` means playable
- simple metadata keeps contributions mechanical

### 4:30 - 5:30 — Refresh and reveal
**Say:**
- "And now the fun part: the cabinet appears."
- "We didn't rebuild the site. We fed the arcade one more cartridge."

**Show on screen:**
- Refresh the lobby
- Filter or scroll to the new card
- Click into the game and launch it

**Pause beat:**
- stop talking for a second when the new card appears in the grid

### 5:30 - 6:30 — Open the PR
**Say:**
- "Now we do the social part of software: make it easy for somebody else to trust the drop."
- "The PR template is short on purpose. This should feel exciting, not bureaucratic."

**Show on screen:**
- Fork flow or prepared branch
- Open PR using `game-submission.md`
- Fill in game name, genre, pitch, dependencies

### 6:30 - 7:20 — Watch the checks
**Say:**
- "Nikon's Playwright pass does the glamorous job: proving the experience actually works."
- "The contribution story is only good if the demo and the docs agree."

**Show on screen:**
- PR checks / Actions / E2E run
- mention demo recording also powers the hero GIF

### 7:20 - 8:00 — Close strong
**Say:**
- "This is the hook: the arcade can grow in real time, in public, with your game."
- "Bring a classic. Bring a prototype. Bring something gloriously cursed."
- "We want your weird game."

**Show on screen:**
- Final grid with the new game visible
- CONTRIBUTING.md and README CTA briefly side-by-side

---

## Speaker notes

- Keep the keyboard choreography tight. Pre-stage the files in tabs.
- Use a game everyone recognizes for Act 1 so the transformation reads instantly.
- Do not spend time explaining JSON syntax. Explain what each field *means*.
- If the room laughs, let it breathe. The drama of "it appeared in the grid" is the whole trick.

## Fallback plan if the live demo fails

If anything breaks:

1. Switch to a prepared branch with the styled game already added.
2. Show the diff for `games/<id>/` and `games.json`.
3. Play the pre-recorded flow or `docs/demo.gif`.
4. Narrate the same beats: style upgrade, metadata drop, PR, checks, appearance in grid.

The fallback should preserve the story even if the internet, browser, projector, or demo gods become hostile.
