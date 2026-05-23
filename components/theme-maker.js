/**
 * Color Theme Maker
 * A persistent, punchy color picker that lives on the page.
 * Stores choices in cookies so they survive sessions.
 */

const COOKIE_NAME = 'brutalgames_theme';
const COOKIE_DAYS = 365;

const THEME_VARS = [
  { key: '--color-background', label: 'Walls', default: '#141414' },
  { key: '--color-surface', label: 'Screens', default: '#fffdf7' },
  { key: '--color-pink', label: 'Neon Signs', default: '#ff47b8' },
  { key: '--color-yellow', label: 'Cabinets', default: '#ffe100' },
  { key: '--color-green', label: 'Coin Slots', default: '#83ff3c' },
  { key: '--color-blue', label: 'Wiring', default: '#2d7fff' },
  { key: '--color-red', label: 'Kill Screen', default: '#ff5a36' }
];

const THEMES = [
  { name: 'Default', colors: { '--color-background': '#141414', '--color-surface': '#fffdf7', '--color-pink': '#ff47b8', '--color-yellow': '#ffe100', '--color-green': '#83ff3c', '--color-blue': '#2d7fff', '--color-red': '#ff5a36' }},
  { name: 'Midnight Tokyo', colors: { '--color-background': '#0a0a1a', '--color-surface': '#1a1a2e', '--color-pink': '#e94560', '--color-yellow': '#f5a623', '--color-green': '#00d4aa', '--color-blue': '#533483', '--color-red': '#e94560' }},
  { name: 'Arcade Fire', colors: { '--color-background': '#1a0000', '--color-surface': '#2d0a0a', '--color-pink': '#ff2d55', '--color-yellow': '#ff9500', '--color-green': '#ffcc02', '--color-blue': '#ff6b35', '--color-red': '#dc1d24' }},
  { name: 'Vapor Wave', colors: { '--color-background': '#1a0033', '--color-surface': '#2d1b4e', '--color-pink': '#ff71ce', '--color-yellow': '#fffb96', '--color-green': '#b6ff9e', '--color-blue': '#01cdfe', '--color-red': '#ff6b9d' }},
  { name: 'Game Boy', colors: { '--color-background': '#0f380f', '--color-surface': '#306230', '--color-pink': '#8bac0f', '--color-yellow': '#9bbc0f', '--color-green': '#8bac0f', '--color-blue': '#306230', '--color-red': '#0f380f' }},
  { name: 'CRT Amber', colors: { '--color-background': '#0a0800', '--color-surface': '#1a1400', '--color-pink': '#ffb000', '--color-yellow': '#ff8c00', '--color-green': '#ffc800', '--color-blue': '#cc7700', '--color-red': '#ff5500' }},
  { name: 'Ocean Depths', colors: { '--color-background': '#001220', '--color-surface': '#001e36', '--color-pink': '#00b4d8', '--color-yellow': '#90e0ef', '--color-green': '#48cae4', '--color-blue': '#0077b6', '--color-red': '#023e8a' }},
  { name: 'Cyberpunk', colors: { '--color-background': '#0d0221', '--color-surface': '#1a0533', '--color-pink': '#ff00ff', '--color-yellow': '#fcee09', '--color-green': '#00ff41', '--color-blue': '#0abdc6', '--color-red': '#ea00d9' }},
  { name: 'Rust Belt', colors: { '--color-background': '#1c1410', '--color-surface': '#2e2218', '--color-pink': '#c75c2c', '--color-yellow': '#d4a04a', '--color-green': '#8b9d56', '--color-blue': '#5c7a8a', '--color-red': '#a0392b' }},
  { name: 'Bubblegum', colors: { '--color-background': '#2d1033', '--color-surface': '#3d1a45', '--color-pink': '#ff69b4', '--color-yellow': '#ffd700', '--color-green': '#7fff00', '--color-blue': '#87ceeb', '--color-red': '#ff1493' }},
  { name: 'Hacker', colors: { '--color-background': '#000000', '--color-surface': '#0a0a0a', '--color-pink': '#00ff00', '--color-yellow': '#33ff33', '--color-green': '#00ff00', '--color-blue': '#009900', '--color-red': '#00cc00' }},
  { name: 'Sunset Strip', colors: { '--color-background': '#1a0a1e', '--color-surface': '#2a1428', '--color-pink': '#ff4081', '--color-yellow': '#ff8a65', '--color-green': '#ffab40', '--color-blue': '#7c4dff', '--color-red': '#ff5252' }},
  { name: 'Ice Cave', colors: { '--color-background': '#0a1628', '--color-surface': '#132238', '--color-pink': '#81d4fa', '--color-yellow': '#b3e5fc', '--color-green': '#4fc3f7', '--color-blue': '#0288d1', '--color-red': '#01579b' }},
];

function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function loadTheme() {
  const raw = getCookie(COOKIE_NAME);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveTheme(theme) {
  setCookie(COOKIE_NAME, JSON.stringify(theme), COOKIE_DAYS);
}

function applyTheme(theme) {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(theme)) {
    root.style.setProperty(key, value);
  }
}

function resetTheme() {
  const root = document.documentElement;
  THEME_VARS.forEach(({ key }) => root.style.removeProperty(key));
  setCookie(COOKIE_NAME, '', -1);
}

export function initThemeMaker() {
  const saved = loadTheme();
  if (saved) applyTheme(saved);

  const panel = document.createElement('aside');
  panel.className = 'theme-maker';
  panel.setAttribute('aria-label', 'Color theme maker');
  panel.innerHTML = `
    <button class="theme-maker-toggle" type="button" aria-expanded="false" title="Remix colors">
      <span class="toggle-icon">🎨</span>
      <span class="toggle-label">PAINT</span>
    </button>
    <div class="theme-maker-drawer" hidden>
      <h3 class="theme-maker-title">Paint the arcade</h3>
      <div class="theme-maker-swatches"></div>
      <div class="theme-maker-themes">
        <label class="theme-select-label">Color Themes</label>
        <div class="theme-grid"></div>
      </div>
      <div class="theme-maker-actions">
        <button class="button theme-reset" type="button">Reset</button>
      </div>
    </div>
  `;

  const toggle = panel.querySelector('.theme-maker-toggle');
  const drawer = panel.querySelector('.theme-maker-drawer');
  const swatches = panel.querySelector('.theme-maker-swatches');
  const resetBtn = panel.querySelector('.theme-reset');
  const themeGrid = panel.querySelector('.theme-grid');

  // Build theme buttons
  THEMES.forEach((theme) => {
    const btn = document.createElement('button');
    btn.className = 'theme-chip';
    btn.type = 'button';
    btn.textContent = theme.name;
    btn.style.setProperty('--chip-bg', theme.colors['--color-background']);
    btn.style.setProperty('--chip-accent', theme.colors['--color-pink']);
    btn.addEventListener('click', () => {
      applyTheme(theme.colors);
      saveTheme(theme.colors);
      swatches.querySelectorAll('input[type="color"]').forEach((input) => {
        const val = theme.colors[input.dataset.var];
        if (val) input.value = val;
      });
    });
    themeGrid.appendChild(btn);
  });

  // Build color pickers
  const current = saved || {};
  THEME_VARS.forEach(({ key, label, default: def }) => {
    const swatch = document.createElement('label');
    swatch.className = 'swatch';
    swatch.innerHTML = `
      <input type="color" value="${current[key] || def}" data-var="${key}">
      <span class="swatch-label">${label}</span>
    `;
    swatches.appendChild(swatch);
  });

  // Toggle drawer
  toggle.addEventListener('click', () => {
    const open = drawer.hidden;
    drawer.hidden = !open;
    toggle.setAttribute('aria-expanded', open);
    panel.classList.toggle('open', open);
  });

  // Live update on color change
  swatches.addEventListener('input', (e) => {
    if (!e.target.matches('input[type="color"]')) return;
    const varName = e.target.dataset.var;
    document.documentElement.style.setProperty(varName, e.target.value);
    persistCurrentChoices();
  });

  // Reset
  resetBtn.addEventListener('click', () => {
    resetTheme();
    swatches.querySelectorAll('input[type="color"]').forEach((input) => {
      const def = THEME_VARS.find((v) => v.key === input.dataset.var)?.default;
      if (def) input.value = def;
    });
  });

  function persistCurrentChoices() {
    const theme = {};
    swatches.querySelectorAll('input[type="color"]').forEach((input) => {
      theme[input.dataset.var] = input.value;
    });
    saveTheme(theme);
  }

  document.body.appendChild(panel);
}
