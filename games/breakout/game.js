(function () {
  'use strict';

  var W = 800, H = 600;
  var BG = '#2b1055', LIGHT = '#b794f6', MID = '#7c3aed', ACCENT = '#fde047', INK = '#000000';
  var STORE_KEY = 'console.breakout.high';

  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var elScore = document.getElementById('score');
  var elLives = document.getElementById('lives');
  var elLevel = document.getElementById('level');
  var elHigh = document.getElementById('high');
  var overlay = document.getElementById('overlay');
  var elTitle = document.getElementById('overlay-title');
  var elMsg = document.getElementById('overlay-msg');

  var PAD_Y = H - 44, PAD_H = 16, PAD_SPEED = 560, BALL_R = 8;
  var BRICK_COLS = 10, BRICK_W = 70, BRICK_H = 24, BRICK_GAP = 6, BRICK_TOP = 70;
  var BRICK_LEFT = (W - (BRICK_COLS * (BRICK_W + BRICK_GAP) - BRICK_GAP)) / 2;
  var ROW_COLORS = ['#ef4444', '#fb923c', ACCENT, '#4ade80', LIGHT, '#ffffff'];

  var keys = {};
  var state = 'start'; // start | playing | paused | over
  var score, lives, level, high, paddle, ball, bricks, particles, stuck;

  function loadHigh() {
    try { return parseInt(localStorage.getItem(STORE_KEY), 10) || 0; } catch (e) { return 0; }
  }
  function saveHigh() {
    try { localStorage.setItem(STORE_KEY, String(high)); } catch (e) { /* ignore */ }
  }

  function updateHud() {
    elScore.textContent = score;
    elLives.textContent = lives;
    elLevel.textContent = level;
    elHigh.textContent = high;
  }

  function showOverlay(title, msg) {
    elTitle.textContent = title;
    elMsg.textContent = msg;
    overlay.classList.remove('hidden');
  }
  function hideOverlay() { overlay.classList.add('hidden'); }

  function buildBricks() {
    var rows = Math.min(4 + level, 6), r, c;
    bricks = [];
    for (r = 0; r < rows; r++) {
      for (c = 0; c < BRICK_COLS; c++) {
        // Higher levels get patterned gaps and tougher bricks
        if (level % 3 === 2 && (c + r) % 5 === 0) continue;
        bricks.push({
          x: BRICK_LEFT + c * (BRICK_W + BRICK_GAP), y: BRICK_TOP + r * (BRICK_H + BRICK_GAP),
          w: BRICK_W, h: BRICK_H, row: r, hp: (level >= 3 && r === 0) ? 2 : 1
        });
      }
    }
  }

  function resetBall() {
    stuck = true;
    ball = { x: paddle.x, y: PAD_Y - BALL_R - 2, vx: 0, vy: 0 };
  }

  function ballSpeed() { return 380 + (level - 1) * 30; }

  function startLevel() {
    paddle = { x: W / 2, w: Math.max(80, 130 - (level - 1) * 8) };
    buildBricks();
    resetBall();
  }

  function newGame() {
    score = 0; lives = 3; level = 1; particles = [];
    startLevel();
    updateHud();
    state = 'playing';
    hideOverlay();
  }

  function burst(x, y, color) {
    var i, a;
    for (i = 0; i < 8; i++) {
      a = Math.random() * Math.PI * 2;
      particles.push({ x: x, y: y, vx: Math.cos(a) * (40 + Math.random() * 140),
        vy: Math.sin(a) * (40 + Math.random() * 140), life: 0.45, color: color });
    }
  }

  function launch() {
    // Slight random tilt so the first bounce isn't perfectly vertical
    var a = -Math.PI / 2 + (Math.random() - 0.5) * 0.5, s = ballSpeed();
    ball.vx = Math.cos(a) * s;
    ball.vy = Math.sin(a) * s;
    stuck = false;
  }

  function loseLife() {
    lives--;
    updateHud();
    if (lives <= 0) {
      state = 'over';
      showOverlay('GAME OVER', 'Score ' + score + ' - Press ENTER to restart');
    } else {
      resetBall();
    }
  }

  function moveBall(dt) {
    var i, b, px, py, cx, cy, dx, dy, ox, oy, rel, ang, s;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    if (ball.x < BALL_R) { ball.x = BALL_R; ball.vx = Math.abs(ball.vx); }
    if (ball.x > W - BALL_R) { ball.x = W - BALL_R; ball.vx = -Math.abs(ball.vx); }
    if (ball.y < BALL_R) { ball.y = BALL_R; ball.vy = Math.abs(ball.vy); }

    // Paddle: hit position sets the bounce angle (up to 60 degrees from vertical)
    if (ball.vy > 0 && ball.y + BALL_R >= PAD_Y && ball.y - BALL_R <= PAD_Y + PAD_H &&
        ball.x >= paddle.x - paddle.w / 2 - BALL_R && ball.x <= paddle.x + paddle.w / 2 + BALL_R) {
      rel = Math.max(-1, Math.min(1, (ball.x - paddle.x) / (paddle.w / 2)));
      ang = rel * (Math.PI / 3);
      s = Math.min(ballSpeed() * 1.35, Math.hypot(ball.vx, ball.vy) * 1.01);
      ball.vx = Math.sin(ang) * s;
      ball.vy = -Math.cos(ang) * s;
      ball.y = PAD_Y - BALL_R;
    }

    for (i = 0; i < bricks.length; i++) {
      b = bricks[i];
      cx = Math.max(b.x, Math.min(ball.x, b.x + b.w));
      cy = Math.max(b.y, Math.min(ball.y, b.y + b.h));
      dx = ball.x - cx; dy = ball.y - cy;
      if (dx * dx + dy * dy > BALL_R * BALL_R) continue;
      ox = BALL_R - Math.abs(dx);
      oy = BALL_R - Math.abs(dy);
      if (dx === 0 && dy === 0) {
        ball.vy = -ball.vy;
      } else if (Math.abs(dx) > Math.abs(dy) || (Math.abs(dx) === Math.abs(dy) && ox < oy)) {
        ball.vx = dx > 0 ? Math.abs(ball.vx) : -Math.abs(ball.vx);
      } else {
        ball.vy = dy > 0 ? Math.abs(ball.vy) : -Math.abs(ball.vy);
      }
      b.hp--;
      if (b.hp <= 0) {
        px = b.x + b.w / 2; py = b.y + b.h / 2;
        burst(px, py, ROW_COLORS[b.row]);
        score += (6 - b.row) * 10;
        if (score > high) { high = score; saveHigh(); }
        bricks.splice(i, 1);
      } else {
        score += 5;
      }
      updateHud();
      break;
    }

    if (ball.y - BALL_R > H) loseLife();
  }

  function update(dt) {
    var i, p, steps, n;
    if (keys.ArrowLeft || keys.a) paddle.x -= PAD_SPEED * dt;
    if (keys.ArrowRight || keys.d) paddle.x += PAD_SPEED * dt;
    paddle.x = Math.max(paddle.w / 2 + 6, Math.min(W - paddle.w / 2 - 6, paddle.x));

    if (stuck) {
      ball.x = paddle.x;
      ball.y = PAD_Y - BALL_R - 2;
      if (keys[' ']) launch();
    } else {
      // Substep so fast balls can't tunnel through bricks
      steps = Math.max(1, Math.ceil(Math.hypot(ball.vx, ball.vy) * dt / 6));
      for (n = 0; n < steps && !stuck && state === 'playing'; n++) {
        moveBall(dt / steps);
        if (bricks.length === 0) {
          level++;
          updateHud();
          startLevel();
          break;
        }
      }
    }

    for (i = particles.length - 1; i >= 0; i--) {
      p = particles[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function draw() {
    var i, b;
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    for (i = 0; i < bricks.length; i++) {
      b = bricks[i];
      ctx.fillStyle = INK;
      ctx.fillRect(b.x - 2, b.y - 2, b.w + 4, b.h + 4);
      ctx.fillStyle = b.hp > 1 ? MID : ROW_COLORS[b.row];
      ctx.fillRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(b.x + 1, b.y + 1, b.w - 2, 4);
    }

    ctx.fillStyle = INK;
    ctx.fillRect(paddle.x - paddle.w / 2 - 3, PAD_Y - 3, paddle.w + 6, PAD_H + 6);
    ctx.fillStyle = ACCENT;
    ctx.fillRect(paddle.x - paddle.w / 2, PAD_Y, paddle.w, PAD_H);

    ctx.fillStyle = INK;
    ctx.fillRect(ball.x - BALL_R - 3, ball.y - BALL_R - 3, BALL_R * 2 + 6, BALL_R * 2 + 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ball.x - BALL_R, ball.y - BALL_R, BALL_R * 2, BALL_R * 2);

    for (i = 0; i < particles.length; i++) {
      ctx.fillStyle = particles[i].color;
      ctx.fillRect(particles[i].x, particles[i].y, 4, 4);
    }

    if (state === 'playing' && stuck) {
      ctx.fillStyle = ACCENT;
      ctx.font = '900 18px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PRESS SPACE TO LAUNCH', W / 2, H / 2 + 80);
    }
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
  score = 0; lives = 3; level = 1; particles = [];
  startLevel();
  updateHud();
  showOverlay('BREAKOUT', 'Press ENTER to start');
  requestAnimationFrame(frame);
}());
