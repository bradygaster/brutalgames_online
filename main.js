import { GameLoader } from './components/game-loader.js';

export function boot() {
  const loader = new GameLoader({
    source: './games.json',
    featuredSelector: '#featured-game',
    gridSelector: '#game-grid',
    countSelector: '#game-count',
    genreFilterSelector: '#genre-filter',
    tagFilterSelector: '#tag-filter',
    dialogSelector: '#game-launcher',
    frameSelector: '#game-frame',
    closeSelector: '#close-launcher',
    titleSelector: '#game-launcher-title'
  });

  loader.init();
  return loader;
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
}
