(function () {
  'use strict';

  var W = 800, H = 600;
  var BG = '#2b1055', LIGHT = '#b794f6', ACCENT = '#fde047';
  var STORE_KEY = 'console.pong.high';
  var WIN_SCORE = 7;

  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var elScore = document.getElementById('score');
  var elRally = document.getElementById('rally');
  var elWins = document.getElementById('wins');
  var elHigh = document.getElementById('high');
  var elMode = document.getElementById('mode');
  var overlay = document.getElementById('overlay');
  var elTitle = document.getElementById('overlay-title');
  var elMsg = document.getElementById('overlay-msg');

  var PAD_W = 14, PAD_H = 90, PAD_X = 28, PAD_SPEED = 460, BALL_R = 9;
  var BALL_START = 330, BALL_MAX = 780, BALL_BOOST = 1.05, MAX_ANGLE = Math.PI / 3.2;
  var AI_SPEED = 300, AI_DEADZONE = 14, AI_REACT = 0.18;

  var keys = {};
  var state = 'start'; // start | playing | paused | over
  var twoPlayer = false;
  var scoreL = 0, scoreR = 0, rally = 0, wins = 0, high = 0, serveDelay = 0;
  var left, right, ball, aiTarget = H / 2, aiTimer = 0, particles = [];

  function loadHigh() {
    try { return parseInt(localStorage.getItem(STORE_KEY), 10) || 0; } catch (e) { return 0; }
  }
  function saveHigh() {
    try { localStorage.setItem(STORE_KEY, String(high)); } catch (e) { /* ignore */ }
  }

  function updateHud() {
    elScore.textContent = scoreL + ' - ' + scoreR;
    elRally.textContent = rally;
    elWins.textContent = wins;
    elHigh.textContent = high;
    elMode.textContent = twoPlayer ? '2P' : '1P';
  }

  function showOverlay(title, msg) {
    elTitle.textContent = title;
    elMsg.textContent = msg;
    overlay.classList.remove('hidden');
  }
  function hideOverlay() { overlay.classList.add('hidden'); }

  function serve(dir) {
    var a = (Math.random() - 0.5) * 0.7;
    ball = { x: W / 2, y: H / 2, speed: BALL_START, vx: Math.cos(a) * BALL_START * dir, vy: Math.sin(a) * BALL_START };
    rally = 0;
    serveDelay = 0.8;
    aiTarget = H / 2;
  }

  function newGame() {
    scoreL = 0; scoreR = 0; particles = [];
    left = { y: H / 2 - PAD_H / 2 };
    right = { y: H / 2 - PAD_H / 2 };
    serve(Math.random() < 0.5 ? -1 : 1);
    state = 'playing';
    hideOverlay();
    updateHud();
  }

  function burst(x, y, color) {
    for (var i = 0; i < 8; i++) {
      var a = Math.random() * Math.PI * 2, s = 60 + Math.random() * 140;
      particles.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.4, color: color });
    }
  }

  function clampPad(p) { p.y = Math.max(0, Math.min(H - PAD_H, p.y)); }

  function moveAI(dt) {
    aiTimer -= dt;
    if (aiTimer <= 0) {
      aiTimer = AI_REACT;
      // Only tracks when ball approaches, with an aim error so it can be beaten
      aiTarget = ball.vx > 0 ? ball.y + (Math.random() - 0.5) * PAD_H * 1.1 : H / 2;
    }
    var c = right.y + PAD_H / 2, d = aiTarget - c;
    if (Math.abs(d) > AI_DEADZONE) right.y += Math.sign(d) * Math.min(AI_SPEED * dt, Math.abs(d));
    clampPad(right);
  }

  function paddleHit(p, x, dir) {
    var rel = (ball.y - (p.y + PAD_H / 2)) / (PAD_H / 2);
    rel = Math.max(-1, Math.min(1, rel));
    ball.speed = Math.min(BALL_MAX, ball.speed * BALL_BOOST);
    var a = rel * MAX_ANGLE;
    ball.vx = Math.cos(a) * ball.speed * dir;
    ball.vy = Math.sin(a) * ball.speed;
    ball.x = x;
    rally++;
    if (rally > high) { high = rally; saveHigh(); }
    burst(ball.x, ball.y, ACCENT);
    updateHud();
  }

  function point(leftScored) {
    if (leftScored) scoreL++; else scoreR++;
    burst(ball.x, ball.y, LIGHT);
    if (scoreL >= WIN_SCORE || scoreR >= WIN_SCORE) {
      state = 'over';
      var msg;
      if (twoPlayer) msg = (leftScored ? 'PLAYER 1' : 'PLAYER 2') + ' WINS';
      else if (leftScored) { wins++; msg = 'YOU WIN'; }
      else msg = 'CPU WINS';
      updateHud();
      showOverlay('GAME OVER', msg + ' ' + scoreL + '-' + scoreR + ' - ENTER to restart');
      return;
    }
    serve(leftScored ? 1 : -1);
    updateHud();
  }

  function update(dt) {
    var i;
    if (keys.w || keys.ArrowUp) left.y -= PAD_SPEED * dt;
    if (keys.s || keys.ArrowDown) left.y += PAD_SPEED * dt;
    clampPad(left);
    if (twoPlayer) {
      if (keys.i) right.y -= PAD_SPEED * dt;
      if (keys.k) right.y += PAD_SPEED * dt;
      clampPad(right);
    } else {
      moveAI(dt);
    }

    for (i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }

    if (serveDelay > 0) { serveDelay -= dt; return; }

    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    if (ball.y < BALL_R) { ball.y = BALL_R; ball.vy = Math.abs(ball.vy); }
    if (ball.y > H - BALL_R) { ball.y = H - BALL_R; ball.vy = -Math.abs(ball.vy); }

    var lx = PAD_X + PAD_W, rx = W - PAD_X - PAD_W;
    if (ball.vx < 0 && ball.x - BALL_R <= lx && ball.x + BALL_R >= PAD_X &&
        ball.y >= left.y - BALL_R && ball.y <= left.y + PAD_H + BALL_R) {
      paddleHit(left, lx + BALL_R, 1);
    } else if (ball.vx > 0 && ball.x + BALL_R >= rx && ball.x - BALL_R <= W - PAD_X &&
        ball.y >= right.y - BALL_R && ball.y <= right.y + PAD_H + BALL_R) {
      paddleHit(right, rx - BALL_R, -1);
    } else if (ball.x < -BALL_R) {
      point(false);
    } else if (ball.x > W + BALL_R) {
      point(true);
    }
  }

  function draw() {
    var i;
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = LIGHT;
    for (i = 0; i < H; i += 30) ctx.fillRect(W / 2 - 3, i + 6, 6, 18);

    ctx.font = '900 64px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(183,148,246,0.45)';
    ctx.fillText(String(scoreL), W / 2 - 80, 80);
    ctx.fillText(String(scoreR), W / 2 + 80, 80);

    if (!left) return;
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000';
    ctx.fillStyle = ACCENT;
    ctx.fillRect(PAD_X, left.y, PAD_W, PAD_H);
    ctx.strokeRect(PAD_X, left.y, PAD_W, PAD_H);
    ctx.fillStyle = LIGHT;
    ctx.fillRect(W - PAD_X - PAD_W, right.y, PAD_W, PAD_H);
    ctx.strokeRect(W - PAD_X - PAD_W, right.y, PAD_W, PAD_H);

    ctx.fillStyle = '#fff';
    ctx.fillRect(ball.x - BALL_R, ball.y - BALL_R, BALL_R * 2, BALL_R * 2);
    ctx.strokeRect(ball.x - BALL_R, ball.y - BALL_R, BALL_R * 2, BALL_R * 2);

    for (i = 0; i < particles.length; i++) {
      ctx.fillStyle = particles[i].color;
      ctx.fillRect(particles[i].x, particles[i].y, 4, 4);
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
    if (['ArrowUp', 'ArrowDown', ' '].indexOf(k) >= 0) e.preventDefault();
    keys[k] = true;
    if (k === 'Enter') {
      if (state === 'start' || state === 'over') newGame();
    } else if (k === 'p') {
      if (state === 'playing') { state = 'paused'; showOverlay('PAUSED', 'Press P to resume'); }
      else if (state === 'paused') { state = 'playing'; hideOverlay(); }
    } else if (k === 't' && !e.repeat) {
      if (state !== 'playing') {
        twoPlayer = !twoPlayer;
        updateHud();
      }
    }
  });
  window.addEventListener('keyup', function (e) { keys[normKey(e)] = false; });
  window.addEventListener('blur', function () { keys = {}; });

  high = loadHigh();
  updateHud();
  showOverlay('PONG', 'Press ENTER to start - T toggles 1P/2P');
  requestAnimationFrame(frame);
}());
