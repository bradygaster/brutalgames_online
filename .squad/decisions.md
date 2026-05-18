# Squad Decisions

## Active Decisions

### Crash Architecture (2026-05-18T16:03:14-07:00)

1. **Static-first shell**
   - The project stays plain HTML, CSS, and JavaScript with no framework or build step.
   - This keeps hosting trivial and preserves the low-friction "drop in a game folder" workflow.

2. **Registry-driven discovery**
   - `games.json` is the single source of truth for lobby rendering.
   - The lobby reads metadata instead of hardcoding cards, which keeps new game onboarding mechanical and consistent.

3. **Standalone game boundaries**
   - Each game lives under `games/<id>/` with its own HTML entry point.
   - The shell treats games as isolated modules so teams can ship different implementations without coupling to lobby code.

4. **Iframe-first launch pattern**
   - The default launch path is an in-page iframe dialog for active games, with a new-context fallback when modal UI is unavailable.
   - This preserves the arcade feel while allowing standalone execution.

5. **Thin shared layer**
   - Shared behavior lives in `components/` and shared presentation in `styles/`.
   - This keeps reusable shell code centralized without forcing games into a framework.

### Acid Frontend (2026-05-18T16:03:14-07:00)

1. Build the arcade shell in plain vanilla JavaScript with dynamic DOM creation so the script can tolerate Crash landing `index.html` in parallel without tight markup coupling.
2. Use hash-based routing for `#home`, `#games`, `#about`, `#cabinet`, and `#leaderboards`, plus transient `#play-<id>` hashes for launcher state so browser back/close returns to the arcade cleanly.
3. Treat `coming-soon` cabinets as non-launchable with dimmed overlays, while experimental and cabinet-tagged games can still appear in the test lab if they provide an entry point.
4. Generate fallback thumbnails with canvas and lazy-load all card/featured images through `IntersectionObserver`, falling back immediately when the browser lacks observer support.
5. Persist only player-facing shell preferences in `localStorage`: mute state and CRT mode.

### Cereal Design System (2026-05-18T16:03:14-07:00)

#### Direction
- Anchor the brand in neo-brutalist arcade energy: hot pink, electric yellow, electric blue, neon green, stark white, and near-black.
- Keep every interactive surface tactile with 3-5px borders, offset-only shadows, tiny corner radii, and no blur.
- Push arcade typography into headings and controls with Press Start 2P; keep Space Grotesk for readable body copy.

#### Component Rules
- Hero uses a yellow fight-poster slab with an "INSERT COIN" stamp so the landing space feels like a cabinet marquee.
- Game cards read like collectible cartridges: white faces, colored spine bars, thick borders, hard shadows, and slam-hover motion.
- Featured content gets a full-width neon-green treatment with a built-in "TONIGHT'S MAIN EVENT" ribbon.
- Navigation and buttons use chunky alternating fills so the interface feels like physical arcade controls instead of flat UI.
- Footer stays loud and credit-roll-like with arcade type and strong blue grounding.

#### Motion + Effects
- Hover motion snaps outward using a short stepped slam rather than floaty easing.
- Active states collapse shadows to zero so controls feel mechanically pressed.
- CRT treatment is handled with a subtle scanline overlay utility instead of soft gradients or glass.
- Glitch styling is reserved for accents via duplicated hot-pink and electric-blue text ghosts.

#### Responsive Notes
- The game grid is mobile-first and scales 1 / 2 / 3 / 4 columns across breakpoints.
- Navigation stacks on small screens and shifts horizontal once space opens up.

## Governance

- All meaningful changes require team consensus
- Document architectural decisions here
- Keep history focused on work, decisions focused on direction
