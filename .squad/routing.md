# Routing

Each work item has exactly one accountable specialist. Contributors and reviewers are added only for concrete, bounded needs.

| Work Type | Accountable Owner | Notes |
|-----------|-------------------|-------|
| Scope, file layout, zero-dependency constraint, interfaces, task breakdown | Lead | Settles ownership disputes |
| Game loop, ship physics, bullets, asteroids, collisions, scoring, lives, levels, input | Gameplay | Owns `game.js` |
| Neo-brutalist styling, palette, HUD, menus, game-over screens, canvas rendering style | Visuals | Owns `style.css` and `index.html` presentation |
| Play-testing, browser compatibility, dependency check, review gate | Tester | Reviewer gate |
| Unmatched work or ownership disputes | Lead | Escalation path |

Built-ins (Scribe, Ralph, Rai, Fact Checker) are support identities, not routing destinations.
