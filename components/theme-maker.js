/**
 * Color Theme Maker
 * A persistent, punchy color picker that lives on the page.
 * Stores choices in cookies so they survive sessions.
 */

const COOKIE_NAME = 'brutalgames_theme';
const COOKIE_DAYS = 365;

const THEME_VARS = [
  { key: '--color-background', label: 'Background', default: '#141414' },
  { key: '--color-surface', label: 'Surface', default: '#fffdf7' },
  { key: '--color-pink', label: 'Pink', default: '#ff47b8' },
  { key: '--color-yellow', label: 'Yellow', default: '#ffe100' },
  { key: '--color-green', label: 'Green', default: '#83ff3c' },
  { key: '--color-blue', label: 'Blue', default: '#2d7fff' },
  { key: '--color-red', label: 'Red', default: '#ff5a36' }
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
      <div class="theme-maker-actions">
        <button class="button theme-reset" type="button">Reset</button>
        <button class="button theme-random" type="button">Surprise me</button>
      </div>
    </div>
  `;

  const toggle = panel.querySelector('.theme-maker-toggle');
  const drawer = panel.querySelector('.theme-maker-drawer');
  const swatches = panel.querySelector('.theme-maker-swatches');
  const resetBtn = panel.querySelector('.theme-reset');
  const randomBtn = panel.querySelector('.theme-random');

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

  // Random fun palette
  randomBtn.addEventListener('click', () => {
    const hue = Math.random() * 360;
    const palette = {
      '--color-background': hslToHex(hue, 10, 8),
      '--color-surface': hslToHex((hue + 40) % 360, 20, 96),
      '--color-pink': hslToHex((hue + 300) % 360, 100, 60),
      '--color-yellow': hslToHex((hue + 60) % 360, 100, 55),
      '--color-green': hslToHex((hue + 120) % 360, 100, 60),
      '--color-blue': hslToHex((hue + 210) % 360, 100, 55),
      '--color-red': hslToHex((hue + 15) % 360, 100, 55)
    };
    applyTheme(palette);
    saveTheme(palette);
    swatches.querySelectorAll('input[type="color"]').forEach((input) => {
      const val = palette[input.dataset.var];
      if (val) input.value = val;
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

function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
