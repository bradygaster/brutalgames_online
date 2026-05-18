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
  }

  async init() {
    this.cacheDom();
    this.bindLauncherEvents();

    try {
      const response = await fetch(this.source);
      if (!response.ok) {
        throw new Error(`Unable to load game registry (${response.status})`);
      }

      const payload = await response.json();
      this.games = Array.isArray(payload.games) ? payload.games : [];
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

    if (this.launchDialog) {
      this.launchDialog.addEventListener('click', (event) => {
        if (event.target === this.launchDialog) {
          this.closeLauncher();
        }
      });
    }
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
    card.innerHTML = `
      <div class="game-thumb">
        <img src="${escapeAttribute(featuredGame.thumbnail)}" alt="${escapeAttribute(featuredGame.title)} thumbnail" loading="lazy">
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
        <button class="button" type="button" ${featuredGame.status !== 'active' ? 'disabled' : ''}>${featuredGame.status === 'active' ? 'Launch game' : 'Unavailable'}</button>
      </div>
    `;

    const button = card.querySelector('button');
    if (button && featuredGame.status === 'active') {
      button.addEventListener('click', () => this.launchGame(featuredGame));
    }

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
      card.setAttribute('role', 'listitem');
      card.innerHTML = `
        <div class="game-thumb">
          <img src="${escapeAttribute(game.thumbnail)}" alt="${escapeAttribute(game.title)} thumbnail" loading="lazy">
        </div>
        <div class="game-content">
          <div class="card-heading">
            <h3>${escapeHtml(game.title)}</h3>
            <span class="status-pill">${escapeHtml(game.status)}</span>
          </div>
          <p>${escapeHtml(game.description)}</p>
          <p class="game-summary">${escapeHtml(game.genre)} · ${escapeHtml(game.playerCount)}</p>
          <div class="tag-list">${this.renderTags(game.tags)}</div>
          <button class="button" type="button" ${game.status !== 'active' ? 'disabled' : ''}>${game.status === 'active' ? 'Launch game' : 'Coming soon'}</button>
        </div>
      `;

      const button = card.querySelector('button');
      if (button && game.status === 'active') {
        button.addEventListener('click', () => this.launchGame(game));
      }

      this.gridContainer.appendChild(card);
    });
  }

  renderTags(tags = []) {
    return tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('');
  }

  launchGame(game) {
    if (game.status !== 'active') {
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
    if (!this.launchDialog || !this.launchFrame) {
      return;
    }

    if (typeof this.launchDialog.close === 'function' && this.launchDialog.open) {
      this.launchDialog.close();
    }
    this.launchFrame.src = 'about:blank';
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
