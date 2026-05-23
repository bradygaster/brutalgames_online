#!/usr/bin/env node
/**
 * Aggregates per-game game.json files into the root games.json registry.
 * Run: node scripts/build-games-json.js
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const GAMES_DIR = join(import.meta.dirname, '..', 'games');
const OUTPUT = join(import.meta.dirname, '..', 'games.json');

async function main() {
  const entries = await readdir(GAMES_DIR, { withFileTypes: true });
  const games = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === '_template') continue;

    const metaPath = join(GAMES_DIR, entry.name, 'game.json');
    try {
      const raw = await readFile(metaPath, 'utf8');
      const meta = JSON.parse(raw);
      games.push(meta);
    } catch {
      // No game.json in this folder — skip silently
    }
  }

  games.sort((a, b) => (b.dateAdded || '').localeCompare(a.dateAdded || ''));

  const registry = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    games
  };

  await writeFile(OUTPUT, JSON.stringify(registry, null, 2) + '\n', 'utf8');
  console.log(`games.json updated: ${games.length} game(s) registered.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
