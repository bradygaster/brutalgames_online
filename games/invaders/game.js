(function () {
  'use strict';

  var W = 800, H = 600;
  var BG = '#2b1055', LIGHT = '#b794f6', MID = '#7c3aed', ACCENT = '#fde047', INK = '#000000';
  var STORE_KEY = 'console.invaders.high';

  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var elScore = document.getElementById('score');
  var elLives = document.getElementById('lives');
  var elLevel = document.getElementById('level');
  var elHigh = document.getElementById('high');
  var overlay = document.getElementById('overlay');
  var elTitle = document.getElementById('overlay-title');
  var elMsg = document.getElementById('overlay-msg');

  var COLS = 10, ROWS = 5, CELL_W = 52, CELL_H = 40, AL_W = 34, AL_H = 24;
  var PLAYER_W = 48, PLAYER_H = 22, PLAYER_Y = H - 50, PLAYER_SPEED = 320;
  var ROW_POINTS = [30, 20, 20, 10, 10];
  var ROW_COLORS = [ACCENT, LIGHT, LIGHT, '#ffffff', '#ffffff'];

  var keys = {};
  var state = 'start'; // start | playing | paused | over
  var score, lives, wave, high, player, aliens, dir, alienX, alienY, bullet, bombs, shields;
  var ufo, ufoTimer, fireCd, bombTimer, respawn, particles, totalAliens, flash;

  function rand(a, b) { return a + Math.random() * (b - a); }

  function loadHigh() {
    try { return parseInt(localStorage.getItem(STORE_KEY), 10) || 0; } catch (e) { return 0; }
  }
  function saveHigh() {
    try { localStorage.setItem(STORE_KEY, String(high)); } catch (e) { /* ignore */ }
  }

  function updateHud() {
    elScore.textContent = score;
    elLives.textContent = lives;
    elLevel.textContent = wave;
    elHigh.textContent = high;
  }

  function showOverlay(title, msg) {
    elTitle.textContent = title;
    elMsg.textContent = msg;
    overlay.classList.remove('hidden');
  }
  function hideOverlay() { overlay.classList.add('hidden'); }

  function addScore(n) {
    score += n;
    if (score > high) { high = score; saveHigh(); }
    updateHud();
  }

  function buildShields() {
    var list = [], s, r, c, bx;
    for (s = 0; s < 4; s++) {
      bx = 110 + s * 170;
      for (r = 0; r < 4; r++) {
        for (c = 0; c < 7; c++) {
          if (r === 3 && c > 1 && c < 5) continue;
          list.push({ x: bx + c * 10, y: PLAYER_Y - 90 + r * 10, w: 10, h: 10, hp: 2 });
        }
      }
    }
    return list;
  }

  function spawnWave() {
    var r, c;
    aliens = [];
    for (r = 0; r < ROWS; r++) {
      for (c = 0; c < COLS; c++) aliens.push({ c: c, r: r, alive: true });
    }
    totalAliens = aliens.length;
    alienX = 60;
    alienY = 70 + Math.min(wave - 1, 5) * 12;
    dir = 1;
    bullet = null;
    bombs = [];
    shields = buildShields();
    ufo = null;
    ufoTimer = rand(12, 20);
    bombTimer = 1;
    player.x = W / 2;
  }

  function newGame() {
    score = 0; lives = 3; wave = 1; fireCd = 0; respawn = 0; flash = 0;
    particles = [];
    player = { x: W / 2 };
    spawnWave();
    updateHud();
    state = 'playing';
    hideOverlay();
  }

  function aliveCount() {
    var n = 0, i;
    for (i = 0; i < aliens.length; i++) if (aliens[i].alive) n++;
    return n;
  }

  function alienPos(a) {
    return { x: alienX + a.c * CELL_W, y: alienY + a.r * CELL_H };
  }

  function burst(x, y, color, n) {
    var i, a;
    for (i = 0; i < n; i++) {
      a = rand(0, Math.PI * 2);
      particles.push({ x: x, y: y, vx: Math.cos(a) * rand(30, 160), vy: Math.sin(a) * rand(30, 160),
        life: rand(0.3, 0.6), color: color });
    }
  }

  function hit(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function damageShield(rect) {
    var i, s;
    for (i = 0; i < shields.length; i++) {
      s = shields[i];
      if (hit(rect, s)) {
        s.hp--;
        burst(s.x + 5, s.y + 5, LIGHT, 3);
        if (s.hp <= 0) shields.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  function gameOver() {
    state = 'over';
    showOverlay('GAME OVER', 'Score ' + score + ' - Press ENTER to restart');
  }

  function hitPlayer() {
    lives--;
    burst(player.x, PLAYER_Y + 10, ACCENT, 24);
    flash = 0.3;
    updateHud();
    bombs = [];
    if (lives <= 0) gameOver(); else respawn = 1.2;
  }

  function update(dt) {
    var i, a, p, alive, total, speed, moveX, lowest, cols, c, r, shooter, b, ar, edge, drop;

    if (flash > 0) flash -= dt;
    for (i = particles.length - 1; i >= 0; i--) {
      p = particles[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }

    if (respawn > 0) { respawn -= dt; } else {
      if (keys.ArrowLeft || keys.a) player.x -= PLAYER_SPEED * dt;
      if (keys.ArrowRight || keys.d) player.x += PLAYER_SPEED * dt;
      player.x = Math.max(PLAYER_W / 2 + 10, Math.min(W - PLAYER_W / 2 - 10, player.x));
    }
    if (fireCd > 0) fireCd -= dt;
    if (keys[' '] && !bullet && fireCd <= 0 && respawn <= 0) {
      bullet = { x: player.x, y: PLAYER_Y - 6 };
      fireCd = 0.15;
    }

    // Aliens march faster as they die
    alive = aliveCount();
    total = totalAliens;
    speed = (28 + (wave - 1) * 6) + (1 - alive / total) * 170 + (alive === 1 ? 80 : 0);
    moveX = dir * speed * dt;
    alienX += moveX;
    edge = false;
    for (i = 0; i < aliens.length; i++) {
      a = aliens[i];
      if (!a.alive) continue;
      p = alienPos(a);
      if (p.x < 12 || p.x + AL_W > W - 12) edge = true;
    }
    if (edge) {
      alienX -= moveX;
      dir = -dir;
      alienY += 16;
    }

    // Aliens reaching shields/player row ends the game
    for (i = 0; i < aliens.length; i++) {
      a = aliens[i];
      if (!a.alive) continue;
      p = alienPos(a);
      ar = { x: p.x, y: p.y, w: AL_W, h: AL_H };
      for (drop = shields.length - 1; drop >= 0; drop--) {
        if (hit(ar, shields[drop])) shields.splice(drop, 1);
      }
      if (p.y + AL_H >= PLAYER_Y - 4) { lives = 0; updateHud(); gameOver(); return; }
    }

    // Bombs
    bombTimer -= dt;
    if (bombTimer <= 0 && alive > 0 && respawn <= 0) {
      bombTimer = Math.max(0.35, rand(0.6, 1.4) - wave * 0.07);
      cols = {};
      for (i = 0; i < aliens.length; i++) {
        a = aliens[i];
        if (a.alive && (!cols[a.c] || cols[a.c].r < a.r)) cols[a.c] = a;
      }
      lowest = Object.keys(cols);
      c = lowest[Math.floor(Math.random() * lowest.length)];
      shooter = cols[c];
      if (shooter) {
        p = alienPos(shooter);
        bombs.push({ x: p.x + AL_W / 2, y: p.y + AL_H, vy: 190 + wave * 15 });
      }
    }
    for (i = bombs.length - 1; i >= 0; i--) {
      b = bombs[i];
      b.y += b.vy * dt;
      if (b.y > H) { bombs.splice(i, 1); continue; }
      if (damageShield({ x: b.x - 2, y: b.y - 6, w: 4, h: 12 })) { bombs.splice(i, 1); continue; }
      if (respawn <= 0 && hit({ x: b.x - 2, y: b.y - 6, w: 4, h: 12 },
        { x: player.x - PLAYER_W / 2, y: PLAYER_Y, w: PLAYER_W, h: PLAYER_H })) {
        bombs.splice(i, 1);
        hitPlayer();
        if (state !== 'playing') return;
      }
    }

    // UFO
    ufoTimer -= dt;
    if (!ufo && ufoTimer <= 0) {
      ufo = Math.random() < 0.5 ? { x: -50, vx: 130 } : { x: W + 50, vx: -130 };
      ufoTimer = rand(18, 28);
    }
    if (ufo) {
      ufo.x += ufo.vx * dt;
      if (ufo.x < -80 || ufo.x > W + 80) ufo = null;
    }

    // Player bullet
    if (bullet) {
      bullet.y -= 560 * dt;
      b = { x: bullet.x - 2, y: bullet.y - 8, w: 4, h: 16 };
      if (bullet.y < 40) { bullet = null; } else if (damageShield(b)) {
        bullet = null;
      } else if (ufo && hit(b, { x: ufo.x - 24, y: 44, w: 48, h: 20 })) {
        addScore([50, 100, 150, 300][Math.floor(Math.random() * 4)]);
        burst(ufo.x, 54, ACCENT, 20);
        ufo = null; bullet = null;
      } else {
        for (i = 0; i < aliens.length; i++) {
          a = aliens[i];
          if (!a.alive) continue;
          p = alienPos(a);
          if (hit(b, { x: p.x, y: p.y, w: AL_W, h: AL_H })) {
            a.alive = false;
            addScore(ROW_POINTS[a.r]);
            burst(p.x + AL_W / 2, p.y + AL_H / 2, ROW_COLORS[a.r], 10);
            bullet = null;
            break;
          }
        }
      }
    }

    if (aliveCount() === 0) {
      wave++;
      updateHud();
      spawnWave();
      respawn = 0.8;
    }
  }

  function px(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }

  function drawAlien(x, y, color, r) {
    ctx.fillStyle = INK;
    ctx.fillRect(Math.round(x) - 3, Math.round(y) - 3, AL_W + 6, AL_H + 6);
    px(x, y, AL_W, AL_H, color);
    px(x + 7, y + 6, 6, 6, INK);
    px(x + AL_W - 13, y + 6, 6, 6, INK);
    var step = Math.floor(alienX / 12 + alienY) % 2 === 0;
    px(x + (step ? 3 : 8), y + AL_H - 6, 6, 6, INK);
    px(x + AL_W - (step ? 9 : 14), y + AL_H - 6, 6, 6, INK);
    if (r === 0) px(x + AL_W / 2 - 3, y - 8, 6, 5, color);
  }

  function draw() {
    var i, a, p, s;
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    if (flash > 0) { ctx.fillStyle = 'rgba(253,224,71,0.25)'; ctx.fillRect(0, 0, W, H); }

    ctx.fillStyle = MID;
    ctx.fillRect(0, PLAYER_Y + PLAYER_H + 8, W, 5);

    for (i = 0; i < aliens.length; i++) {
      a = aliens[i];
      if (!a.alive) continue;
      p = alienPos(a);
      drawAlien(p.x, p.y, ROW_COLORS[a.r], a.r);
    }

    for (i = 0; i < shields.length; i++) {
      s = shields[i];
      px(s.x, s.y, s.w, s.h, s.hp === 2 ? LIGHT : MID);
    }

    if (ufo) {
      px(ufo.x - 27, 41, 54, 26, INK);
      px(ufo.x - 24, 44, 48, 20, '#ef4444');
      px(ufo.x - 10, 38, 20, 8, ACCENT);
      px(ufo.x - 14, 52, 6, 6, ACCENT);
      px(ufo.x + 8, 52, 6, 6, ACCENT);
    }

    if (respawn <= 0 || Math.floor(respawn * 10) % 2 === 0) {
      px(player.x - PLAYER_W / 2 - 3, PLAYER_Y - 3, PLAYER_W + 6, PLAYER_H + 6, INK);
      px(player.x - PLAYER_W / 2, PLAYER_Y + 8, PLAYER_W, PLAYER_H - 8, ACCENT);
      px(player.x - 8, PLAYER_Y, 16, 12, ACCENT);
      px(player.x - 3, PLAYER_Y - 8, 6, 8, ACCENT);
    }

    if (bullet) px(bullet.x - 2, bullet.y - 8, 4, 16, '#ffffff');
    for (i = 0; i < bombs.length; i++) px(bombs[i].x - 3, bombs[i].y - 6, 6, 12, '#ef4444');
    for (i = 0; i < particles.length; i++) px(particles[i].x, particles[i].y, 4, 4, particles[i].color);
  }

  var last = 0;
  function frame(t) {
    var dt = Math.min(0.05, (t - last) / 1000 || 0);
    last = t;
    if (state === 'playing') update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  function normKey(e) {
    var k = e.key;
    if (k && k.length === 1) k = k.toLowerCase();
    return k;
  }

  window.addEventListener('keydown', function (e) {
    var k = normKey(e);
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].indexOf(k) >= 0) e.preventDefault();
    keys[k] = true;
    if (k === 'Enter') {
      if (state === 'start' || state === 'over') newGame();
    } else if (k === 'p') {
      if (state === 'playing') { state = 'paused'; showOverlay('PAUSED', 'Press P to resume'); }
      else if (state === 'paused') { state = 'playing'; hideOverlay(); }
    }
  });
  window.addEventListener('keyup', function (e) { keys[normKey(e)] = false; });
  window.addEventListener('blur', function () { keys = {}; });

  high = loadHigh();
  score = 0; lives = 3; wave = 1; particles = []; player = { x: W / 2 };
  spawnWave();
  updateHud();
  showOverlay('INVADERS', 'Press ENTER to start');
  requestAnimationFrame(frame);
}());
