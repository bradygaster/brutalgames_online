# Adding a new game

BrutalGames.online is designed so new games can be dropped in with minimal wiring.

## 3-step process

1. **Add the game folder**
   - Create a new folder inside `games/`.
   - Put the game's standalone HTML entry file inside it, usually `games/<game-id>/index.html`.

2. **Add metadata to `games.json`**
   - Append a new object to the `games` array.
   - Include `id`, `title`, `description`, `genre`, `playerCount`, `thumbnail`, `entryPoint`, `status`, `featured`, `tags`, and `dateAdded`.

3. **Optionally add a thumbnail**
   - Place a thumbnail image under `assets/thumbnails/`.
   - Point the metadata `thumbnail` field to that asset.

## Notes

- `status: "active"` enables the launch button in the lobby.
- `status: "coming-soon"` or `"experimental"` keeps the card visible without making it a primary launch target.
- Use relative paths in metadata so the project stays static-host friendly.
