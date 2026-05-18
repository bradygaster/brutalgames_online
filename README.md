# BrutalGames.online

BrutalGames.online is a neo-brutalist browser arcade: a loud, fast, static-first wall of mini-games where tiny experiments, remixed classics, and beautifully weird HTML games can show up in the grid almost instantly.

![Demo](docs/demo.gif)

> Demo GIF placeholder. Nikon's Playwright recording flow will generate `docs/demo.gif`.

[![Live Site](https://img.shields.io/badge/live%20site-coming%20soon-ff47b8?style=for-the-badge)](https://brutalgames.online)
[![Static HTML](https://img.shields.io/badge/stack-HTML-ffe100?style=for-the-badge&logo=html5&logoColor=111111)](#tech-stack)
[![Vanilla JS](https://img.shields.io/badge/stack-Vanilla%20JS-83ff3c?style=for-the-badge&logo=javascript&logoColor=111111)](#tech-stack)
[![Playwright](https://img.shields.io/badge/testing-Playwright-2d7fff?style=for-the-badge&logo=playwright&logoColor=ffffff)](#tech-stack)

## Add Your Game

**Want your game on the wall?** Start here:

1. Copy `games/_template/`
2. Drop your game into `games/<your-id>/`
3. Add one entry to `games.json`
4. Open a PR and watch the arcade grow

➡️ **Read [`CONTRIBUTING.md`](CONTRIBUTING.md)**

## Quick start for contributors

```bash
git clone <your-fork-url>
cd brutalgames_online
```

Then:

- build your game in `games/<your-id>/`
- register it in `games.json`
- test it locally in the browser
- submit a PR with `.github/PULL_REQUEST_TEMPLATE/game-submission.md`

Need the step-by-step version? Go straight to [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Live site

- Placeholder URL: [https://brutalgames.online](https://brutalgames.online)

## Tech stack

- Plain HTML
- Plain CSS
- Vanilla JavaScript
- Static hosting
- Playwright for demo recording and end-to-end verification
- FFmpeg for GIF creation from recorded demos

## Contributor runway

- `games/_template/` — starter game shell
- `games.json` — the arcade registry
- `docs/demo-script.md` — live stage walkthrough
- `scripts/generate-demo-gif.ps1` — turn Nikon's Playwright recording into the hero GIF

## Why this repo exists

Because adding a browser game should feel like dropping a new cabinet into an arcade, not filing paperwork with a committee.

Bring a classic. Bring a prototype. Bring something gloriously cursed.

## One more time, louder

# ADD YOUR GAME

Fork it. Build it. Register it. PR it.

**We want your weird game.**
