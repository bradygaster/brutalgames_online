const DEFAULT_SELECTORS = {
  featuredSelector: '#featured-game',
  gridSelector: '#game-grid',
  countSelector: '#game-count',
  genreFilterSelector: '#genre-filter',
  tagFilterSelector: '#tag-filter',
  dialogSelector: '#game-launcher',
  frameSelector: '#game-frame',
  closeSelector: '#close-launcher',
  titleSelector: '#game-launcher-title'
};

const FALLBACK_THUMBNAIL_LABEL = 'Thumbnail unavailable';

export class GameLoader {
  constructor(options = {}) {
    this.source = options.source ?? './games.json';
    this.selectors = { ...DEFAULT_SELECTORS, ...options };
    this.games = [];
    this.featuredContainer = null;
    this.gridContainer = null;
    this.countContainer = null;
    this.genreFilter = null;
    this.tagFilter = null;
    this.launchDialog = null;
    this.launchFrame = null;
    this.launchTitle = null;
    this.closeButton = null;
  }

  async init() {
    this.cacheDom();
    this.bindLauncherEvents();

    try {
      const response = await fetch(this.source, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Unable to load game registry (${response.status})`);
      }

      const payload = await response.json();
      const registry = Array.isArray(payload.games) ? payload.games : [];
      this.games = registry
        .map((game, index) => this.normalizeGame(game, index))
        .filter(Boolean)
        .sort((left, right) => String(right.dateAdded).localeCompare(String(left.dateAdded)));
      this.populateGenreFilter();
      this.bindFilterEvents();
      this.render();
    } catch (error) {
      this.renderError(error instanceof Error ? error.message : 'Unable to load game registry.');
    }
  }

  cacheDom() {
    this.featuredContainer = document.querySelector(this.selectors.featuredSelector);
    this.gridContainer = document.querySelector(this.selectors.gridSelector);
    this.countContainer = document.querySelector(this.selectors.countSelector);
    this.genreFilter = document.querySelector(this.selectors.genreFilterSelector);
    this.tagFilter = document.querySelector(this.selectors.tagFilterSelector);
    this.launchDialog = document.querySelector(this.selectors.dialogSelector);
    this.launchFrame = document.querySelector(this.selectors.frameSelector);
    this.launchTitle = document.querySelector(this.selectors.titleSelector);
    this.closeButton = document.querySelector(this.selectors.closeSelector);
  }

  bindFilterEvents() {
    if (this.genreFilter) {
      this.genreFilter.addEventListener('change', () => this.render());
    }

    if (this.tagFilter) {
      this.tagFilter.addEventListener('input', () => this.render());
    }
  }

  bindLauncherEvents() {
    if (this.closeButton) {
      this.closeButton.addEventListener('click', () => this.closeLauncher());
    }

    if (!this.launchDialog) {
      return;
    }

    this.launchDialog.addEventListener('click', (event) => {
      if (event.target === this.launchDialog) {
        this.closeLauncher();
      }
    });
    this.launchDialog.addEventListener('close', () => this.resetLauncherFrame());
    this.launchDialog.addEventListener('cancel', () => this.resetLauncherFrame());
  }

  populateGenreFilter() {
    if (!this.genreFilter) {
      return;
    }

    const genres = [...new Set(this.games.map((game) => game.genre).filter(Boolean))].sort((left, right) => left.localeCompare(right));
    const options = ['<option value="all">All genres</option>'];

    genres.forEach((genre) => {
      options.push(`<option value="${escapeHtml(genre)}">${escapeHtml(genre)}</option>`);
    });

    this.genreFilter.innerHTML = options.join('');
  }

  getFilteredGames() {
    const genre = this.genreFilter?.value ?? 'all';
    const tagQuery = (this.tagFilter?.value ?? '').trim().toLowerCase();

    return this.games.filter((game) => {
      const matchesGenre = genre === 'all' || game.genre === genre;
      const haystack = [game.title, game.genre, game.description, ...(game.tags ?? [])].join(' ').toLowerCase();
      const matchesTag = !tagQuery || haystack.includes(tagQuery);
      return matchesGenre && matchesTag;
    });
  }

  render() {
    const filteredGames = this.getFilteredGames();
    this.renderCount(filteredGames.length);
    this.renderFeatured(filteredGames);
    this.renderGrid(filteredGames);
  }

  renderCount(total) {
    if (this.countContainer) {
      this.countContainer.textContent = `${total} game${total === 1 ? '' : 's'} in view`;
    }
  }

  renderFeatured(filteredGames) {
    if (!this.featuredContainer) {
      return;
    }

    const featuredGame = filteredGames.find((game) => game.featured) ?? filteredGames[0];

    if (!featuredGame) {
      this.featuredContainer.innerHTML = '<p>No games match the current filters.</p>';
      return;
    }

    const card = document.createElement('article');
    card.className = 'game-card featured-card';
    card.dataset.gameId = featuredGame.id;
    card.innerHTML = `
      <div class="game-thumb">
        ${this.renderThumbnailMarkup(featuredGame)}
      </div>
      <div class="game-content">
        <p class="status-pill">${escapeHtml(featuredGame.status)}</p>
        <h3>${escapeHtml(featuredGame.title)}</h3>
        <p>${escapeHtml(featuredGame.description)}</p>
        <dl class="game-meta">
          <div><dt>Genre</dt><dd>${escapeHtml(featuredGame.genre)}</dd></div>
          <div><dt>Players</dt><dd>${escapeHtml(featuredGame.playerCount)}</dd></div>
        </dl>
        <div class="tag-list">${this.renderTags(featuredGame.tags)}</div>
        <button class="button" type="button" ${!this.isLaunchable(featuredGame) ? 'disabled' : ''}>${this.isLaunchable(featuredGame) ? 'Launch game' : 'Unavailable'}</button>
      </div>
    `;

    this.attachCardEnhancements(card, featuredGame);
    this.featuredContainer.replaceChildren(card);
  }

  renderGrid(filteredGames) {
    if (!this.gridContainer) {
      return;
    }

    this.gridContainer.innerHTML = '';

    if (!filteredGames.length) {
      this.gridContainer.innerHTML = '<p>No games match the current filters.</p>';
      return;
    }

    filteredGames.forEach((game) => {
      const card = document.createElement('article');
      card.className = 'game-card';
      card.dataset.gameId = game.id;
      card.setAttribute('role', 'listitem');
      card.innerHTML = `
        <div class="game-thumb">
          ${this.renderThumbnailMarkup(game)}
        </div>
        <div class="game-content">
          <div class="card-heading">
            <h3>${escapeHtml(game.title)}</h3>
            <span class="status-pill">${escapeHtml(game.status)}</span>
          </div>
          <p>${escapeHtml(game.description)}</p>
          <p class="game-summary">${escapeHtml(game.genre)} · ${escapeHtml(game.playerCount)}</p>
          <div class="tag-list">${this.renderTags(game.tags)}</div>
          <button class="button" type="button" ${!this.isLaunchable(game) ? 'disabled' : ''}>${this.isLaunchable(game) ? 'Launch game' : 'Coming soon'}</button>
        </div>
      `;

      this.attachCardEnhancements(card, game);
      this.gridContainer.appendChild(card);
    });
  }

  renderTags(tags = []) {
    return tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('');
  }

  renderThumbnailMarkup(game) {
    const title = escapeAttribute(game.title || FALLBACK_THUMBNAIL_LABEL);
    const fallback = escapeAttribute(buildPlaceholderThumbnail(game.title));
    const source = escapeAttribute(game.thumbnail || buildPlaceholderThumbnail(game.title));
    return `<img src="${source}" alt="${title} thumbnail" loading="lazy" data-fallback-src="${fallback}">`;
  }

  attachCardEnhancements(card, game) {
    const button = card.querySelector('button');
    if (button && this.isLaunchable(game)) {
      button.addEventListener('click', () => this.launchGame(game));
    }

    const image = card.querySelector('img[data-fallback-src]');
    if (!image) {
      return;
    }

    image.addEventListener(
      'error',
      () => {
        if (image.dataset.fallbackApplied === 'true') {
          return;
        }
        image.dataset.fallbackApplied = 'true';
        image.src = image.dataset.fallbackSrc;
      },
      { once: true }
    );
  }

  normalizeGame(game, index) {
    if (!game || typeof game !== 'object') {
      console.warn(`Skipping invalid game entry at index ${index}.`);
      return null;
    }

    const title = normalizeString(game.title);
    const id = normalizeString(game.id) || slugify(title);

    if (!title || !id) {
      console.warn(`Skipping incomplete game entry at index ${index}.`);
      return null;
    }

    const entryPoint = normalizeString(game.entryPoint);
    const requestedStatus = normalizeString(game.status, 'coming-soon').toLowerCase();
    const isActive = requestedStatus === 'active' && Boolean(entryPoint);

    return {
      id,
      title,
      description: normalizeString(game.description, 'No description available yet.'),
      genre: normalizeString(game.genre, 'Unknown'),
      playerCount: normalizeString(game.playerCount, 'Unknown'),
      thumbnail: normalizeString(game.thumbnail),
      entryPoint,
      status: isActive ? 'active' : requestedStatus || 'coming-soon',
      featured: Boolean(game.featured),
      tags: Array.isArray(game.tags)
        ? game.tags.map((tag) => normalizeString(tag)).filter(Boolean)
        : [],
      dateAdded: normalizeString(game.dateAdded, '')
    };
  }

  isLaunchable(game) {
    return game.status === 'active' && Boolean(game.entryPoint);
  }

  launchGame(game) {
    if (!this.isLaunchable(game)) {
      return;
    }

    if (this.launchDialog && this.launchFrame && typeof this.launchDialog.showModal === 'function') {
      this.launchFrame.src = game.entryPoint;
      if (this.launchTitle) {
        this.launchTitle.textContent = `Now playing: ${game.title}`;
      }
      if (!this.launchDialog.open) {
        this.launchDialog.showModal();
      }
      return;
    }

    window.open(game.entryPoint, '_blank', 'noopener');
  }

  closeLauncher() {
    if (!this.launchDialog) {
      this.resetLauncherFrame();
      return;
    }

    if (typeof this.launchDialog.close === 'function' && this.launchDialog.open) {
      this.launchDialog.close();
      return;
    }

    this.resetLauncherFrame();
  }

  resetLauncherFrame() {
    if (this.launchFrame) {
      this.launchFrame.src = 'about:blank';
    }
  }

  renderError(message) {
    const markup = `<p>${escapeHtml(message)}</p>`;
    if (this.featuredContainer) {
      this.featuredContainer.innerHTML = markup;
    }
    if (this.gridContainer) {
      this.gridContainer.innerHTML = markup;
    }
    if (this.countContainer) {
      this.countContainer.textContent = '0 games in view';
    }
  }
}

function normalizeString(value, fallback = '') {
  return typeof value === 'string' ? value.trim() || fallback : fallback;
}

function buildPlaceholderThumbnail(title = FALLBACK_THUMBNAIL_LABEL) {
  const initials = String(title)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('') || 'BG';
  const label = escapeHtml(title || FALLBACK_THUMBNAIL_LABEL);

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" role="img" aria-label="${label}">
      <rect width="640" height="360" fill="#050505"/>
      <rect x="20" y="20" width="600" height="320" fill="#ffe100" stroke="#050505" stroke-width="12"/>
      <rect x="48" y="48" width="544" height="264" fill="#ff47b8" stroke="#050505" stroke-width="8"/>
      <text x="320" y="165" text-anchor="middle" font-family="Arial, sans-serif" font-size="96" font-weight="700" fill="#050505">${initials}</text>
      <text x="320" y="235" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#050505">${label}</text>
    </svg>
  `)}`;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttribute(value = '') {
  return escapeHtml(value);
}
