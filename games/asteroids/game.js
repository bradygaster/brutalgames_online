(function () {
  'use strict';

  var W = 800, H = 600;
  var BG = '#2b1055', LIGHT = '#b794f6', MID = '#7c3aed', ACCENT = '#fde047', INK = '#000000';
  var TAU = Math.PI * 2;

  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var elScore = document.getElementById('score');
  var elHigh = document.getElementById('high');
  var elLives = document.getElementById('lives');
  var elLevel = document.getElementById('level');
  var overlay = document.getElementById('overlay');
  var elTitle = document.getElementById('overlay-title');
  var elMsg = document.getElementById('overlay-msg');

  var SIZES = {
    3: { r: 48, score: 20, speed: 45 },
    2: { r: 28, score: 50, speed: 75 },
    1: { r: 14, score: 100, speed: 110 }
  };
  var TURN = 4.2, THRUST = 260, MAX_SPEED = 420, DRAG = 0.4;
  var BULLET_SPEED = 520, BULLET_LIFE = 0.9, FIRE_DELAY = 0.2, MAX_BULLETS = 5;
  var SHIP_R = 14, INVULN = 2.5, RESPAWN_DELAY = 1;

  var keys = {};
  var state = 'start'; // start | playing | paused | over
  var score, lives, level, ship, bullets, asteroids, particles, fireCd, respawnTimer, levelTimer;

  function rand(a, b) { return a + Math.random() * (b - a); }
  function wrap(o) {
    if (o.x < 0) o.x += W; else if (o.x >= W) o.x -= W;
    if (o.y < 0) o.y += H; else if (o.y >= H) o.y -= H;
  }

  function makeAsteroid(x, y, size) {
    var n = 9 + Math.floor(Math.random() * 4), shape = [], i;
    for (i = 0; i < n; i++) shape.push(rand(0.75, 1.15));
    var a = rand(0, TAU), s = SIZES[size].speed * rand(0.7, 1.3) * (1 + (level - 1) * 0.08);
    return { x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, size: size,
      r: SIZES[size].r, rot: rand(0, TAU), vr: rand(-1, 1), shape: shape };
  }

  function spawnLevel() {
    var count = 3 + level, i, x, y;
    asteroids = [];
    for (i = 0; i < count; i++) {
      do { x = rand(0, W); y = rand(0, H); }
      while (Math.hypot(x - W / 2, y - H / 2) < 180);
      asteroids.push(makeAsteroid(x, y, 3));
    }
  }

  function makeShip() {
    return { x: W / 2, y: H / 2, vx: 0, vy: 0, angle: -Math.PI / 2, invuln: INVULN, thrusting: false };
  }

  function showOverlay(title, msg) {
    elTitle.textContent = title;
    elMsg.textContent = msg;
    overlay.classList.remove('hidden');
  }
  function hideOverlay() { overlay.classList.add('hidden'); }

  var HIGH_KEY = 'console.asteroids.high';
  var high = 0;
  try { high = parseInt(localStorage.getItem(HIGH_KEY), 10) || 0; } catch (e) {}

  function updateHud() {
    if (score > high) {
      high = score;
      try { localStorage.setItem(HIGH_KEY, String(high)); } catch (e) {}
    }
    if (elHigh) elHigh.textContent = high;
    elScore.textContent = score;
    elLives.textContent = lives;
    elLevel.textContent = level;
  }

  function reset() {
    score = 0; lives = 3; level = 1;
    bullets = []; particles = [];
    fireCd = 0; respawnTimer = 0; levelTimer = 0;
    ship = makeShip();
    spawnLevel();
    updateHud();
  }

  function start() {
    reset();
    state = 'playing';
    hideOverlay();
  }

  function togglePause() {
    if (state === 'playing') {
      state = 'paused';
      showOverlay('PAUSED', 'Press P to resume');
    } else if (state === 'paused') {
      state = 'playing';
      hideOverlay();
    }
  }

  function burst(x, y, n, color) {
    for (var i = 0; i < n; i++) {
      var a = rand(0, TAU), s = rand(40, 180);
      particles.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(0.3, 0.7), color: color });
    }
  }

  function fire() {
    if (fireCd > 0 || bullets.length >= MAX_BULLETS) return;
    fireCd = FIRE_DELAY;
    bullets.push({
      x: ship.x + Math.cos(ship.angle) * SHIP_R, y: ship.y + Math.sin(ship.angle) * SHIP_R,
      vx: ship.vx + Math.cos(ship.angle) * BULLET_SPEED,
      vy: ship.vy + Math.sin(ship.angle) * BULLET_SPEED, life: BULLET_LIFE
    });
  }

  function hitAsteroid(a) {
    score += SIZES[a.size].score;
    burst(a.x, a.y, 10, LIGHT);
    asteroids.splice(asteroids.indexOf(a), 1);
    if (a.size > 1) {
      for (var i = 0; i < 2; i++) asteroids.push(makeAsteroid(a.x, a.y, a.size - 1));
    }
  }

  function update(dt) {
    var i, j, a, b;
    if (fireCd > 0) fireCd -= dt;

    if (ship) {
      if (keys.ArrowLeft || keys.a) ship.angle -= TURN * dt;
      if (keys.ArrowRight || keys.d) ship.angle += TURN * dt;
      ship.thrusting = !!(keys.ArrowUp || keys.w);
      if (ship.thrusting) {
        ship.vx += Math.cos(ship.angle) * THRUST * dt;
        ship.vy += Math.sin(ship.angle) * THRUST * dt;
        var sp = Math.hypot(ship.vx, ship.vy);
        if (sp > MAX_SPEED) { ship.vx *= MAX_SPEED / sp; ship.vy *= MAX_SPEED / sp; }
      }
      var drag = Math.max(0, 1 - DRAG * dt);
      ship.vx *= drag; ship.vy *= drag;
      ship.x += ship.vx * dt; ship.y += ship.vy * dt;
      wrap(ship);
      if (ship.invuln > 0) ship.invuln -= dt;
      if (keys[' ']) fire();
    } else if (lives > 0) {
      respawnTimer -= dt;
      if (respawnTimer <= 0) ship = makeShip();
    }

    for (i = bullets.length - 1; i >= 0; i--) {
      b = bullets[i];
      b.x += b.vx * dt; b.y += b.vy * dt; wrap(b);
      b.life -= dt;
      if (b.life <= 0) bullets.splice(i, 1);
    }

    for (i = 0; i < asteroids.length; i++) {
      a = asteroids[i];
      a.x += a.vx * dt; a.y += a.vy * dt; a.rot += a.vr * dt; wrap(a);
    }

    for (i = bullets.length - 1; i >= 0; i--) {
      for (j = 0; j < asteroids.length; j++) {
        a = asteroids[j];
        if (Math.hypot(bullets[i].x - a.x, bullets[i].y - a.y) < a.r) {
          bullets.splice(i, 1);
          hitAsteroid(a);
          break;
        }
      }
    }

    if (ship && ship.invuln <= 0) {
      for (j = 0; j < asteroids.length; j++) {
        a = asteroids[j];
        if (Math.hypot(ship.x - a.x, ship.y - a.y) < a.r * 0.9 + SHIP_R * 0.6) {
          burst(ship.x, ship.y, 20, ACCENT);
          ship = null;
          lives--;
          respawnTimer = RESPAWN_DELAY;
          if (lives <= 0) {
            state = 'over';
            showOverlay('GAME OVER', 'Score ' + score + ' - press Enter to restart');
          }
          break;
        }
      }
    }

    for (i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }

    if (state === 'playing' && asteroids.length === 0) {
      levelTimer += dt;
      if (levelTimer > 1.2) {
        levelTimer = 0;
        level++;
        spawnLevel();
        if (ship) ship.invuln = Math.max(ship.invuln, 1.5);
      }
    }
    updateHud();
  }

  function outline(fill) {
    ctx.fillStyle = fill; ctx.fill();
    ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.stroke();
  }

  function draw() {
    var i, k, a, s;
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    for (i = 0; i < asteroids.length; i++) {
      a = asteroids[i];
      ctx.beginPath();
      for (k = 0; k < a.shape.length; k++) {
        var ang = a.rot + (k / a.shape.length) * TAU, rr = a.r * a.shape[k];
        var px = a.x + Math.cos(ang) * rr, py = a.y + Math.sin(ang) * rr;
        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      outline(a.size === 3 ? LIGHT : a.size === 2 ? MID : LIGHT);
    }

    for (i = 0; i < bullets.length; i++) {
      ctx.beginPath();
      ctx.arc(bullets[i].x, bullets[i].y, 4, 0, TAU);
      outline(ACCENT);
    }

    for (i = 0; i < particles.length; i++) {
      s = particles[i];
      ctx.fillStyle = s.color;
      ctx.fillRect(s.x - 2, s.y - 2, 4, 4);
    }

    if (ship && !(ship.invuln > 0 && Math.floor(ship.invuln * 10) % 2 === 0)) {
      ctx.save();
      ctx.translate(ship.x, ship.y);
      ctx.rotate(ship.angle);
      if (ship.thrusting) {
        ctx.beginPath();
        ctx.moveTo(-SHIP_R * 0.7, -6); ctx.lineTo(-SHIP_R * 1.8, 0); ctx.lineTo(-SHIP_R * 0.7, 6);
        ctx.closePath();
        outline(ACCENT);
      }
      ctx.beginPath();
      ctx.moveTo(SHIP_R, 0); ctx.lineTo(-SHIP_R, -SHIP_R * 0.8);
      ctx.lineTo(-SHIP_R * 0.5, 0); ctx.lineTo(-SHIP_R, SHIP_R * 0.8);
      ctx.closePath();
      outline(MID);
      ctx.restore();
    }
  }

  var last = 0;
  function frame(t) {
    var dt = Math.min((t - last) / 1000, 0.05);
    last = t;
    if (state === 'playing') update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  var GAME_KEYS = { ArrowLeft: 1, ArrowRight: 1, ArrowUp: 1, ArrowDown: 1, ' ': 1, a: 1, d: 1, w: 1, s: 1 };

  window.addEventListener('keydown', function (e) {
    var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (GAME_KEYS[k]) e.preventDefault();
    keys[k] = true;
    if (e.repeat) return;
    if (k === 'Enter' && (state === 'start' || state === 'over')) start();
    else if (k === 'p' || k === 'P') togglePause();
  });
  window.addEventListener('keyup', function (e) {
    keys[e.key.length === 1 ? e.key.toLowerCase() : e.key] = false;
  });
  window.addEventListener('blur', function () {
    keys = {};
    if (state === 'playing') togglePause();
  });

  reset();
  showOverlay('ASTEROIDS', 'Press Enter to start');
  requestAnimationFrame(function (t) { last = t; frame(t); });
})();
