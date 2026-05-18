# Games folder

This directory is the cabinet row.

Every game gets its own folder. The shell discovers games through `games.json`, not through magic.

## Start here

- Read [`../CONTRIBUTING.md`](../CONTRIBUTING.md) for the full drop-in flow.
- Copy [`_template/`](./_template/) when you want a fast starting point.

## Rules of the arcade

1. Put each game in `games/<game-id>/`.
2. Make sure `entryPoint` points at a real HTML file.
3. Keep the game standalone and static-host friendly.
4. Thumbnails are welcome, but optional.

If your game loads and the metadata is honest, you are on the right path.
