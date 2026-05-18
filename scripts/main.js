const STORAGE_KEYS = {
  muted: 'brutalgames-muted',
  displayMode: 'brutalgames-display-mode',
};

const ACTIVE_STATUSES = new Set(['active', 'live', 'ready', 'available', 'published']);
const CABINET_KEYWORDS = ['coming-soon', 'experimental', 'prototype', 'beta', 'test', 'lab', 'cabinet'];
const BLANK_IMAGE =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="9" viewBox="0 0 16 9"><rect width="16" height="9" fill="#111111"/></svg>');

const state = {
  games: [],
  activeRoute: 'home',
  searchTerm: '',
  selectedGenre: 'all',
  muted: readBoolean(STORAGE_KEYS.muted, false),
  crtMode: readString(STORAGE_KEYS.displayMode, 'default') === 'crt',
  routeBeforeLaunch: '#home',
  launcherOpen: false,
  placeholderCache: new Map(),
  observer: null,
  loadError: null,
};

const elements = {
  nav: null,
  hero: null,
  grid: null,
  featured: null,
  infoPanel: null,
  searchInput: null,
  genreFilter: null,
  summary: null,
  muteToggle: null,
  displayToggle: null,
  launcher: null,
  launcherFrame: null,
  launcherTitle: null,
};

document.addEventListener('DOMContentLoaded', () => {
  init().catch((error) => {
    console.error('BrutalGames shell failed to initialize.', error);
    state.loadError = error;
    renderLoadError(error);
  });
});

async function init() {
  cacheElements();

  if (!elements.grid || !elements.featured || !elements.nav || !elements.hero) {
    console.warn('BrutalGames shell is missing one or more required containers.');
    return;
  }

  applyPreferences();
  ensureInfoPanel();
  ensureLauncher();
  initLazyObserver();
  renderNavigation();
  renderHeroControls();
  bindEvents();
  await loadGames();
  handleHashChange();
}

function cacheElements() {
  elements.grid = document.querySelector('#game-grid');
  elements.featured = document.querySelector('#featured-game');
  elements.nav = document.querySelector('#nav');
  elements.hero = document.querySelector('.hero');
}

function bindEvents() {
  window.addEventListener('hashchange', handleHashChange);
  document.addEventListener('keydown', handleGlobalKeydown);

  elements.nav.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) {
      return;
    }

    playClickSound();

    if (button.dataset.action === 'random') {
      launchRandomGame();
      return;
    }

    if (button.dataset.action === 'toggle-mute') {
      toggleMute();
      return;
    }

    if (button.dataset.action === 'toggle-display') {
      toggleDisplayMode();
      return;
    }

    if (button.dataset.route) {
      window.location.hash = button.dataset.route;
    }
  });

  elements.featured.addEventListener('click', (event) => {
    const launchButton = event.target.closest('[data-launch-id]');
    const filterButton = event.target.closest('[data-filter-genre]');

    if (filterButton) {
      playClickSound();
      applyGenreFilter(filterButton.dataset.filterGenre);
      return;
    }

    if (launchButton) {
      playClickSound();
      requestLaunch(launchButton.dataset.launchId);
    }
  });

  elements.grid.addEventListener('click', (event) => {
    const launchButton = event.target.closest('[data-launch-id]');
    const filterButton = event.target.closest('[data-filter-genre]');

    if (filterButton) {
      playClickSound();
      applyGenreFilter(filterButton.dataset.filterGenre);
      return;
    }

    if (launchButton) {
      playClickSound();
      requestLaunch(launchButton.dataset.launchId);
    }
  });
}

async function loadGames() {
  try {
    const response = await fetch('games.json', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Registry request failed with ${response.status}`);
    }

    const payload = await response.json();
    const rawGames = Array.isArray(payload) ? payload : Array.isArray(payload?.games) ? payload.games : [];
    state.games = rawGames.map(normalizeGame).sort(sortByDateDesc);
    state.loadError = null;
  } catch (error) {
    state.games = [];
    state.loadError = error;
    console.error('Unable to load games.json.', error);
  }
}

function handleHashChange() {
  const rawHash = window.location.hash || '#home';

  if (rawHash.startsWith('#play-')) {
    const gameId = decodeURIComponent(rawHash.slice(6));
    const game = state.games.find((entry) => entry.id === gameId);

    if (game && isLaunchableGame(game)) {
      openLauncher(game);
      return;
    }

    elements.infoPanel.hidden = false;
    setStatusMessage(elements.infoPanel, 'Cabinet offline', 'That game cannot be launched right now.');
    closeLauncher(true);
    window.location.hash = state.routeBeforeLaunch;
    return;
  }

  state.activeRoute = normalizeRoute(rawHash);
  closeLauncher(true);
  renderApp();
  smoothScrollToRoute(state.activeRoute);
}

function renderApp() {
  updateInfoPanel();
  updateGenreFilterOptions();

  if (state.loadError) {
    renderLoadError(state.loadError);
    return;
  }

  const baseGames = getGamesForRoute(state.activeRoute);
  const filteredGames = applyFilters(baseGames);
  const featuredGame = selectFeaturedGame(baseGames);

  renderFeaturedGame(featuredGame);
  renderGameGrid(filteredGames);
  refreshLazyImages();
  updateSummary(filteredGames, baseGames.length);
  updateNavState();
}

function renderNavigation() {
  const navItems = [
    { label: 'Home', route: '#home' },
    { label: 'All Games', route: '#games' },
    { label: 'Random Game', action: 'random' },
    { label: 'About', route: '#about' },
    { label: 'Leaderboards', route: '#leaderboards' },
    { label: 'Cabinet/Test Lab', route: '#cabinet' },
  ];

  elements.nav.textContent = '';

  const navList = document.createElement('div');
  navList.className = 'nav-group';

  navItems.forEach((item) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'nav-btn';
    button.textContent = item.label;

    if (item.route) {
      button.dataset.route = item.route;
    }

    if (item.action) {
      button.dataset.action = item.action;
    }

    attachHoverSound(button);
    navList.appendChild(button);
  });

  const utilityList = document.createElement('div');
  utilityList.className = 'nav-group nav-group--utility';

  elements.muteToggle = document.createElement('button');
  elements.muteToggle.type = 'button';
  elements.muteToggle.className = 'nav-btn';
  elements.muteToggle.dataset.action = 'toggle-mute';
  attachHoverSound(elements.muteToggle);

  elements.displayToggle = document.createElement('button');
  elements.displayToggle.type = 'button';
  elements.displayToggle.className = 'nav-btn';
  elements.displayToggle.dataset.action = 'toggle-display';
  attachHoverSound(elements.displayToggle);

  utilityList.append(elements.muteToggle, elements.displayToggle);
  elements.nav.append(navList, utilityList);

  updateToggleLabels();
  updateNavState();
}

function renderHeroControls() {
  const existing = elements.hero.querySelector('.hero-console');
  if (existing) {
    existing.remove();
  }

  const consolePanel = document.createElement('div');
  consolePanel.className = 'hero-console';

  const searchLabel = document.createElement('label');
  searchLabel.className = 'hero-console__search';
  searchLabel.textContent = 'Search cabinet';

  elements.searchInput = document.createElement('input');
  elements.searchInput.type = 'search';
  elements.searchInput.placeholder = 'Find a brutal classic';
  elements.searchInput.autocomplete = 'off';
  elements.searchInput.value = state.searchTerm;
  elements.searchInput.addEventListener('input', (event) => {
    state.searchTerm = event.target.value.trim().toLowerCase();
    renderApp();
  });

  const genreLabel = document.createElement('label');
  genreLabel.className = 'hero-console__filter';
  genreLabel.textContent = 'Genre';

  elements.genreFilter = document.createElement('select');
  elements.genreFilter.addEventListener('change', (event) => {
    state.selectedGenre = event.target.value;
    renderApp();
  });

  elements.summary = document.createElement('p');
  elements.summary.className = 'hero-console__summary';

  searchLabel.appendChild(elements.searchInput);
  genreLabel.appendChild(elements.genreFilter);
  consolePanel.append(searchLabel, genreLabel, elements.summary);
  elements.hero.appendChild(consolePanel);

  updateGenreFilterOptions();
  updateSummary([], 0);
}

function ensureInfoPanel() {
  const infoPanel = document.createElement('section');
  infoPanel.id = 'arcade-info';
  infoPanel.className = 'featured-game';
  infoPanel.hidden = true;
  elements.hero.insertAdjacentElement('afterend', infoPanel);
  elements.infoPanel = infoPanel;
}

function ensureLauncher() {
  const overlay = document.createElement('div');
  overlay.className = 'game-launcher';
  overlay.hidden = true;
  Object.assign(overlay.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '9999',
    display: 'grid',
    placeItems: 'center',
    padding: '1rem',
    background: 'rgba(0, 0, 0, 0.88)',
  });

  const shell = document.createElement('div');
  Object.assign(shell.style, {
    width: 'min(1200px, 100%)',
    height: 'min(85vh, 800px)',
    display: 'grid',
    gridTemplateRows: 'auto 1fr',
    border: '3px solid #ffffff',
    background: '#111111',
    boxShadow: '0 24px 80px rgba(0, 0, 0, 0.45)',
  });

  const bar = document.createElement('div');
  Object.assign(bar.style, {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    padding: '0.75rem 1rem',
    background: '#1f1f1f',
    color: '#ffffff',
  });

  elements.launcherTitle = document.createElement('strong');
  elements.launcherTitle.textContent = 'Loading…';

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'nav-btn';
  closeButton.textContent = 'Close';
  attachHoverSound(closeButton);
  closeButton.addEventListener('click', () => closeLauncher());

  elements.launcherFrame = document.createElement('iframe');
  elements.launcherFrame.title = 'BrutalGames launcher';
  elements.launcherFrame.allow = 'autoplay; fullscreen';
  Object.assign(elements.launcherFrame.style, {
    width: '100%',
    height: '100%',
    border: '0',
    background: '#000000',
  });

  bar.append(elements.launcherTitle, closeButton);
  shell.append(bar, elements.launcherFrame);
  overlay.appendChild(shell);
  document.body.appendChild(overlay);
  elements.launcher = overlay;
}

function renderFeaturedGame(game) {
  elements.featured.textContent = '';

  if (!game) {
    setStatusMessage(elements.featured, 'No featured cabinet yet', 'Drop a featured game into games.json to spotlight it here.');
    return;
  }

  const wrapper = document.createElement('article');
  wrapper.className = 'featured-game';
  wrapper.dataset.status = game.status;

  const media = document.createElement('div');
  media.className = 'featured-game__media';
  media.appendChild(createLazyImage(game, 'featured-game__image'));

  const body = document.createElement('div');
  body.className = 'featured-game__body';

  const eyebrow = document.createElement('div');
  eyebrow.className = 'featured-game__meta';

  const genreButton = document.createElement('button');
  genreButton.type = 'button';
  genreButton.className = 'badge';
  genreButton.dataset.filterGenre = game.genre.toLowerCase();
  genreButton.textContent = game.genre;
  attachHoverSound(genreButton);

  const playerTag = document.createElement('span');
  playerTag.className = 'tag';
  playerTag.textContent = formatPlayerCount(game.playerCount);

  const statusTag = document.createElement('span');
  statusTag.className = 'tag';
  statusTag.textContent = game.status.replace(/-/g, ' ').toUpperCase();

  eyebrow.append(genreButton, playerTag, statusTag);

  const title = document.createElement('h2');
  title.textContent = game.title;

  const description = document.createElement('p');
  description.textContent = game.description;

  const actionRow = document.createElement('div');
  actionRow.className = 'featured-game__actions';

  const playButton = document.createElement('button');
  playButton.type = 'button';
  playButton.className = 'nav-btn';
  playButton.dataset.launchId = game.id;
  playButton.textContent = isLaunchableGame(game) ? 'PLAY NOW' : 'COMING SOON';
  playButton.disabled = !isLaunchableGame(game);
  attachHoverSound(playButton);

  actionRow.appendChild(playButton);
  body.append(eyebrow, title, description, actionRow);
  wrapper.append(media, body);
  elements.featured.appendChild(wrapper);
}

function renderGameGrid(games) {
  elements.grid.textContent = '';

  if (!games.length) {
    setStatusMessage(elements.grid, 'No matches found', 'Try another genre, clear your search, or jump into the test lab.');
    return;
  }

  const fragment = document.createDocumentFragment();
  games.forEach((game) => fragment.appendChild(createGameCard(game)));
  elements.grid.appendChild(fragment);
}

function createGameCard(game) {
  const card = document.createElement('article');
  card.className = 'game-card';
  card.dataset.gameId = game.id;
  card.dataset.status = game.status;

  if (isComingSoon(game)) {
    card.style.opacity = '0.72';
  }

  const media = document.createElement('div');
  media.className = 'game-card__media';
  media.appendChild(createLazyImage(game, 'game-card__image'));

  if (isComingSoon(game)) {
    const overlay = document.createElement('div');
    overlay.className = 'badge';
    overlay.textContent = 'COMING SOON';
    Object.assign(overlay.style, {
      position: 'absolute',
      inset: '0',
      display: 'grid',
      placeItems: 'center',
      background: 'rgba(0, 0, 0, 0.55)',
      color: '#ffffff',
      letterSpacing: '0.12em',
    });
    media.style.position = 'relative';
    media.appendChild(overlay);
  }

  const body = document.createElement('div');
  body.className = 'game-card__body';

  const title = document.createElement('h3');
  title.textContent = game.title;

  const meta = document.createElement('div');
  meta.className = 'game-card__meta';

  const genreButton = document.createElement('button');
  genreButton.type = 'button';
  genreButton.className = 'badge';
  genreButton.dataset.filterGenre = game.genre.toLowerCase();
  genreButton.textContent = game.genre;
  attachHoverSound(genreButton);

  const playerTag = document.createElement('span');
  playerTag.className = 'tag';
  playerTag.textContent = formatPlayerCount(game.playerCount);

  meta.append(genreButton, playerTag);

  const description = document.createElement('p');
  description.textContent = truncateText(game.description, 128);

  const tagRow = document.createElement('div');
  tagRow.className = 'game-card__tags';
  game.tags.slice(0, 3).forEach((tag) => {
    const tagElement = document.createElement('span');
    tagElement.className = 'tag';
    tagElement.textContent = tag;
    tagRow.appendChild(tagElement);
  });

  const actionRow = document.createElement('div');
  actionRow.className = 'game-card__actions';

  const playButton = document.createElement('button');
  playButton.type = 'button';
  playButton.className = 'nav-btn';
  playButton.dataset.launchId = game.id;
  playButton.textContent = isLaunchableGame(game) ? 'PLAY' : 'STANDBY';
  playButton.disabled = !isLaunchableGame(game);
  attachHoverSound(playButton);

  actionRow.appendChild(playButton);
  body.append(title, meta, description, tagRow, actionRow);
  card.append(media, body);

  return card;
}

function createLazyImage(game, className) {
  const image = document.createElement('img');
  image.className = `${className} lazy-thumb`;
  image.alt = `${game.title} thumbnail`;
  image.loading = 'lazy';
  image.decoding = 'async';
  image.src = BLANK_IMAGE;
  image.dataset.src = game.thumbnail || getPlaceholderThumbnail(game.title);
  image.dataset.fallback = getPlaceholderThumbnail(game.title);
  image.addEventListener('error', () => {
    image.src = image.dataset.fallback;
  });
  return image;
}

function updateGenreFilterOptions() {
  if (!elements.genreFilter) {
    return;
  }

  const previousValue = state.selectedGenre;
  const genres = [...new Set(state.games.map((game) => game.genre).filter(Boolean))].sort((left, right) =>
    left.localeCompare(right),
  );

  elements.genreFilter.textContent = '';

  const allOption = document.createElement('option');
  allOption.value = 'all';
  allOption.textContent = 'All genres';
  elements.genreFilter.appendChild(allOption);

  genres.forEach((genre) => {
    const option = document.createElement('option');
    option.value = genre.toLowerCase();
    option.textContent = genre;
    elements.genreFilter.appendChild(option);
  });

  elements.genreFilter.value = genres.some((genre) => genre.toLowerCase() === previousValue) ? previousValue : 'all';
  state.selectedGenre = elements.genreFilter.value;
}

function updateInfoPanel() {
  const route = state.activeRoute;
  elements.infoPanel.hidden = !['about', 'leaderboards', 'cabinet'].includes(route);

  if (route === 'about') {
    setStatusMessage(
      elements.infoPanel,
      'Welcome to BrutalGames.online',
      'A loud little arcade shell built for browser mini-games, surprise drops, and prototype cabinets. Use search, genre filters, or the randomizer to jump in fast.',
    );
    return;
  }

  if (route === 'leaderboards') {
    setStatusMessage(
      elements.infoPanel,
      'Leaderboards incoming',
      'Global scores are not wired up yet, but the shell is reserving space for bragging rights.',
    );
    return;
  }

  if (route === 'cabinet') {
    setStatusMessage(
      elements.infoPanel,
      'Test Lab / Cabinet Mode',
      'This lane highlights experimental builds, prototypes, and any cabinet still wearing COMING SOON tape.',
    );
    return;
  }
}

function updateSummary(filteredGames, totalGames) {
  if (!elements.summary) {
    return;
  }

  const routeLabelMap = {
    home: 'live cabinets',
    games: 'all cabinets',
    about: 'live cabinets',
    leaderboards: 'live cabinets',
    cabinet: 'test lab cabinets',
  };

  const label = routeLabelMap[state.activeRoute] || 'cabinets';
  elements.summary.textContent = `${filteredGames.length} showing / ${totalGames} ${label}`;
}

function updateNavState() {
  const activeHash = `#${state.activeRoute}`;
  elements.nav.querySelectorAll('[data-route]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.route === activeHash);
    button.setAttribute('aria-pressed', String(button.dataset.route === activeHash));
  });

  updateToggleLabels();
}

function updateToggleLabels() {
  if (elements.muteToggle) {
    elements.muteToggle.textContent = state.muted ? 'Sound: OFF' : 'Sound: ON';
    elements.muteToggle.setAttribute('aria-pressed', String(state.muted));
  }

  if (elements.displayToggle) {
    elements.displayToggle.textContent = state.crtMode ? 'CRT: ON' : 'CRT: OFF';
    elements.displayToggle.setAttribute('aria-pressed', String(state.crtMode));
  }
}

function applyPreferences() {
  document.documentElement.classList.toggle('crt-mode', state.crtMode);
  document.documentElement.dataset.displayMode = state.crtMode ? 'crt' : 'default';
}

function toggleMute() {
  state.muted = !state.muted;
  persistState(STORAGE_KEYS.muted, String(state.muted));
  updateToggleLabels();
}

function toggleDisplayMode() {
  state.crtMode = !state.crtMode;
  persistState(STORAGE_KEYS.displayMode, state.crtMode ? 'crt' : 'default');
  applyPreferences();
  updateToggleLabels();
}

function requestLaunch(gameId) {
  const game = state.games.find((entry) => entry.id === gameId);
  if (!game) {
    return;
  }

  if (!isLaunchableGame(game)) {
    elements.infoPanel.hidden = false;
    setStatusMessage(elements.infoPanel, 'Cabinet warming up', `${game.title} is still marked ${game.status.replace(/-/g, ' ')}.`);
    smoothScrollToRoute('about');
    return;
  }

  state.routeBeforeLaunch = window.location.hash && !window.location.hash.startsWith('#play-') ? window.location.hash : '#home';
  playLaunchSound();
  window.location.hash = `play-${encodeURIComponent(game.id)}`;
}

function openLauncher(game) {
  if (!elements.launcher || !elements.launcherFrame) {
    return;
  }

  elements.launcherTitle.textContent = game.title;
  elements.launcherFrame.src = game.entryPoint;
  elements.launcher.hidden = false;
  document.body.style.overflow = 'hidden';
  state.launcherOpen = true;
}

function closeLauncher(skipHashReset = false) {
  if (!elements.launcher || !state.launcherOpen) {
    return;
  }

  elements.launcher.hidden = true;
  elements.launcherFrame.src = 'about:blank';
  document.body.style.overflow = '';
  state.launcherOpen = false;

  if (!skipHashReset && window.location.hash.startsWith('#play-')) {
    window.location.hash = state.routeBeforeLaunch;
  }
}

function handleGlobalKeydown(event) {
  if (event.key === 'Escape' && state.launcherOpen) {
    closeLauncher();
  }
}

function launchRandomGame() {
  const activeCandidates = state.games.filter((game) => isLaunchableGame(game) && ACTIVE_STATUSES.has(game.status));
  const fallbackCandidates = state.games.filter(isLaunchableGame);
  const candidates = activeCandidates.length ? activeCandidates : fallbackCandidates;

  if (!candidates.length) {
    elements.infoPanel.hidden = false;
    setStatusMessage(elements.infoPanel, 'No cabinets ready', 'Add at least one active game to games.json before using the randomizer.');
    smoothScrollToRoute('about');
    return;
  }

  const randomGame = candidates[Math.floor(Math.random() * candidates.length)];
  requestLaunch(randomGame.id);
}

function applyGenreFilter(genre) {
  if (!elements.genreFilter) {
    return;
  }

  state.selectedGenre = genre || 'all';
  elements.genreFilter.value = state.selectedGenre;
  renderApp();
  smoothScrollToRoute('games');
}

function getGamesForRoute(route) {
  if (!state.games.length) {
    return [];
  }

  if (route === 'games') {
    return [...state.games];
  }

  if (route === 'cabinet') {
    return state.games.filter(isCabinetGame);
  }

  return state.games.filter((game) => !isCabinetGame(game));
}

function applyFilters(games) {
  return games.filter((game) => {
    const matchesGenre = state.selectedGenre === 'all' || game.genre.toLowerCase() === state.selectedGenre;
    const matchesSearch =
      !state.searchTerm ||
      [game.title, game.description, game.genre, game.tags.join(' ')]
        .join(' ')
        .toLowerCase()
        .includes(state.searchTerm);

    return matchesGenre && matchesSearch;
  });
}

function selectFeaturedGame(games) {
  if (!games.length) {
    return null;
  }

  const featured = games.find((game) => game.featured);
  if (featured) {
    return featured;
  }

  return [...games].sort(sortByDateDesc)[0];
}

function renderLoadError(error) {
  const message = error?.message || 'Unknown loader failure';
  setStatusMessage(elements.featured, 'Unable to load the arcade registry', message);
  setStatusMessage(elements.grid, 'No games available', 'Check games.json and refresh once the registry is back online.');
  updateSummary([], 0);
  updateNavState();
}

function setStatusMessage(target, title, copy) {
  if (!target) {
    return;
  }

  target.textContent = '';
  const panel = document.createElement('div');
  panel.className = 'featured-game';

  const heading = document.createElement('h2');
  heading.textContent = title;

  const text = document.createElement('p');
  text.textContent = copy;

  panel.append(heading, text);
  target.appendChild(panel);
}

function smoothScrollToRoute(route) {
  const targets = {
    home: elements.hero,
    games: elements.grid,
    about: elements.infoPanel,
    leaderboards: elements.infoPanel,
    cabinet: elements.infoPanel,
  };

  const target = targets[route] || elements.hero;
  if (!target) {
    return;
  }

  window.requestAnimationFrame(() => {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function normalizeGame(game, index) {
  const title = `${game?.title || `Cabinet ${index + 1}`}`.trim();
  const rawStatus = `${game?.status || 'active'}`.trim().toLowerCase();

  return {
    id: `${game?.id || `cabinet-${index + 1}`}`.trim(),
    title,
    description: `${game?.description || 'No cabinet notes yet.'}`.trim(),
    genre: `${game?.genre || 'Arcade'}`.trim(),
    playerCount: `${game?.playerCount || '1P'}`.trim(),
    thumbnail: `${game?.thumbnail || ''}`.trim(),
    entryPoint: `${game?.entryPoint || ''}`.trim(),
    status: rawStatus || 'active',
    featured: Boolean(game?.featured),
    tags: Array.isArray(game?.tags) ? game.tags.map((tag) => `${tag}`.trim()).filter(Boolean) : [],
    dateAdded: `${game?.dateAdded || ''}`.trim(),
  };
}

function normalizeRoute(hash) {
  const route = hash.replace('#', '').toLowerCase();
  return ['home', 'games', 'about', 'cabinet', 'leaderboards'].includes(route) ? route : 'home';
}

function isComingSoon(game) {
  return game.status.includes('coming-soon');
}

function isCabinetGame(game) {
  const haystack = [game.status, game.genre, ...game.tags].join(' ').toLowerCase();
  return CABINET_KEYWORDS.some((keyword) => haystack.includes(keyword));
}

function isLaunchableGame(game) {
  if (!game.entryPoint || isComingSoon(game)) {
    return false;
  }

  return !/(offline|maintenance)/.test(game.status);
}

function sortByDateDesc(left, right) {
  return parseDate(right.dateAdded) - parseDate(left.dateAdded);
}

function parseDate(value) {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatPlayerCount(value) {
  return value.toUpperCase().includes('P') ? value : `${value}P`;
}

function truncateText(value, limit) {
  if (value.length <= limit) {
    return value;
  }

  return `${value.slice(0, limit - 1).trimEnd()}…`;
}

function getPlaceholderThumbnail(title) {
  if (state.placeholderCache.has(title)) {
    return state.placeholderCache.get(title);
  }

  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 450;

  const context = canvas.getContext('2d');
  if (!context) {
    return BLANK_IMAGE;
  }

  const seed = hashString(title);
  const hueA = seed % 360;
  const hueB = (seed * 7) % 360;

  const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, `hsl(${hueA}, 82%, 48%)`);
  gradient.addColorStop(1, `hsl(${hueB}, 74%, 32%)`);
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = 'rgba(255, 255, 255, 0.12)';
  for (let index = 0; index < 10; index += 1) {
    const size = 48 + ((seed + index * 37) % 140);
    const x = (seed * (index + 3)) % canvas.width;
    const y = (seed * (index + 11)) % canvas.height;
    context.fillRect(x, y, size, size / 2);
  }

  context.fillStyle = '#ffffff';
  context.font = '700 54px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  wrapCanvasText(context, title.toUpperCase(), canvas.width / 2, canvas.height / 2, 560, 60);

  const image = canvas.toDataURL('image/png');
  state.placeholderCache.set(title, image);
  return image;
}

function wrapCanvasText(context, text, x, y, maxWidth, lineHeight) {
  const words = text.split(/\s+/);
  const lines = [];
  let currentLine = '';

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (context.measureText(nextLine).width <= maxWidth) {
      currentLine = nextLine;
      return;
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    currentLine = word;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.slice(0, 3).forEach((line, index) => {
    context.fillText(line, x, startY + index * lineHeight, maxWidth);
  });
}

function hashString(value) {
  return [...value].reduce((hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0, 7);
}

function initLazyObserver() {
  if (!('IntersectionObserver' in window)) {
    return;
  }

  state.observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        const image = entry.target;
        image.src = image.dataset.src || image.dataset.fallback || BLANK_IMAGE;
        state.observer.unobserve(image);
      });
    },
    { rootMargin: '240px 0px' },
  );
}

function refreshLazyImages() {
  document.querySelectorAll('.lazy-thumb').forEach((image) => {
    if (state.observer) {
      state.observer.observe(image);
      return;
    }

    image.src = image.dataset.src || image.dataset.fallback || BLANK_IMAGE;
  });
}

function attachHoverSound(element) {
  element.addEventListener('mouseenter', () => {
    playHoverSound();
  });
}

function playHoverSound() {
  if (state.muted) {
    return;
  }
}

function playClickSound() {
  if (state.muted) {
    return;
  }
}

function playLaunchSound() {
  if (state.muted) {
    return;
  }
}

function readBoolean(key, fallback) {
  const value = window.localStorage.getItem(key);
  if (value === null) {
    return fallback;
  }

  return value === 'true';
}

function readString(key, fallback) {
  return window.localStorage.getItem(key) ?? fallback;
}

function persistState(key, value) {
  window.localStorage.setItem(key, value);
}
