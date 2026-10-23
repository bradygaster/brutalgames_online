(function () {
  'use strict';

  var W = 800, H = 600;
  var BG = '#2b1055', LIGHT = '#b794f6', MID = '#7c3aed', ACCENT = '#fde047', INK = '#000000';
  var STORE_KEY = 'console.flappy.high';

  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var elScore = document.getElementById('score');
  var elPipes = document.getElementById('lives');
  var elHigh = document.getElementById('high');
  var overlay = document.getElementById('overlay');
  var elTitle = document.getElementById('overlay-title');
  var elMsg = document.getElementById('overlay-msg');

  var GRAVITY = 1500, FLAP = -430, MAXFALL = 620;
  var BIRD_X = 180, BIRD = 30, PIPE_W = 76, GROUND = 70, CAP_H = 28;

  var state = 'start'; // start | playing | paused | over
  var bird, pipes, score, high, pipeCount, speed, spawnIn, particles, time;

  function loadHigh() {
    try { return parseInt(localStorage.getItem(STORE_KEY), 10) || 0; } catch (e) { return 0; }
  }
  function saveHigh() {
    try { localStorage.setItem(STORE_KEY, String(high)); } catch (e) { /* ignore */ }
  }

  function updateHud() {
    elScore.textContent = score;
    elPipes.textContent = pipeCount;
    elHigh.textContent = high;
  }

  function showOverlay(title, msg) {
    elTitle.textContent = title;
    elMsg.textContent = msg;
    overlay.classList.remove('hidden');
  }
  function hideOverlay() { overlay.classList.add('hidden'); }

  function reset() {
    bird = { y: H / 2 - GROUND / 2, vy: 0 };
    pipes = [];
    particles = [];
    score = 0; pipeCount = 0; speed = 170; spawnIn = 0.5; time = 0;
  }

  function spawnPipe() {
    // Gap shrinks gently with progress but varies randomly
    var gap = Math.max(120, 190 - pipeCount * 2) + Math.floor(Math.random() * 50) - 20;
    var min = 70, max = H - GROUND - 70 - gap;
    pipes.push({ x: W, gap: gap, top: min + Math.random() * (max - min), scored: false });
  }

  function burst(x, y, color, n) {
    var i, a;
    for (i = 0; i < n; i++) {
      a = Math.random() * Math.PI * 2;
      particles.push({ x: x, y: y, vx: Math.cos(a) * (40 + Math.random() * 100),
        vy: Math.sin(a) * (40 + Math.random() * 100), life: 0.4, color: color });
    }
  }

  function flap() {
    if (state !== 'playing') return;
    bird.vy = FLAP;
    burst(BIRD_X, bird.y + BIRD / 2, LIGHT, 4);
  }

  function newGame() {
    reset();
    updateHud();
    state = 'playing';
    hideOverlay();
    flap();
  }

  function gameOver() {
    state = 'over';
    burst(BIRD_X + BIRD / 2, bird.y + BIRD / 2, ACCENT, 16);
    showOverlay('GAME OVER', 'Score ' + score + ' - Press ENTER to restart');
  }

  function stepParticles(dt) {
    var i, p;
    for (i = particles.length - 1; i >= 0; i--) {
      p = particles[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function update(dt) {
    var i, p, bx0, bx1, by0, by1;
    time += dt;
    bird.vy = Math.min(MAXFALL, bird.vy + GRAVITY * dt);
    bird.y += bird.vy * dt;
    speed = 170 + Math.min(110, pipeCount * 4);

    spawnIn -= dt;
    if (spawnIn <= 0) {
      spawnPipe();
      spawnIn = (PIPE_W + 230) / speed;
    }

    bx0 = BIRD_X + 3; bx1 = BIRD_X + BIRD - 3;
    by0 = bird.y + 3; by1 = bird.y + BIRD - 3;

    for (i = pipes.length - 1; i >= 0; i--) {
      p = pipes[i];
      p.x -= speed * dt;
      if (p.x + PIPE_W < 0) { pipes.splice(i, 1); continue; }
      if (bx1 > p.x && bx0 < p.x + PIPE_W && (by0 < p.top || by1 > p.top + p.gap)) {
        gameOver();
        return;
      }
      if (!p.scored && p.x + PIPE_W < BIRD_X) {
        p.scored = true;
        pipeCount++;
        score++;
        if (score > high) { high = score; saveHigh(); }
        burst(BIRD_X + BIRD, bird.y + BIRD / 2, ACCENT, 8);
        updateHud();
      }
    }

    if (by1 >= H - GROUND || by0 < 0) {
      bird.y = Math.max(-3, Math.min(H - GROUND - BIRD + 3, bird.y));
      gameOver();
      return;
    }
    stepParticles(dt);
  }

  function drawPipe(x, y, h, capAtBottom) {
    var capY = capAtBottom ? y + h - CAP_H : y;
    // hard shadow
    ctx.fillStyle = INK;
    ctx.fillRect(x + 14, y + 6, PIPE_W - 16, h);
    ctx.fillRect(x + 6, capY + 6, PIPE_W, CAP_H);
    // body
    ctx.fillRect(x + 8, y, PIPE_W - 16, h);
    ctx.fillStyle = MID;
    ctx.fillRect(x + 12, y, PIPE_W - 24, h);
    ctx.fillStyle = LIGHT;
    ctx.fillRect(x + 16, y, 8, h);
    // cap
    ctx.fillStyle = INK;
    ctx.fillRect(x, capY, PIPE_W, CAP_H);
    ctx.fillStyle = MID;
    ctx.fillRect(x + 4, capY + 4, PIPE_W - 8, CAP_H - 8);
    ctx.fillStyle = LIGHT;
    ctx.fillRect(x + 8, capY + 4, 8, CAP_H - 8);
  }

  function drawBird(y, vy) {
    ctx.save();
    ctx.translate(BIRD_X + BIRD / 2, y + BIRD / 2);
    ctx.rotate(Math.max(-0.4, Math.min(0.9, vy / 600)));
    ctx.fillStyle = INK;
    ctx.fillRect(-BIRD / 2 + 4, -BIRD / 2 + 4, BIRD, BIRD);
    ctx.fillRect(-BIRD / 2, -BIRD / 2, BIRD, BIRD);
    ctx.fillStyle = ACCENT;
    ctx.fillRect(-BIRD / 2 + 3, -BIRD / 2 + 3, BIRD - 6, BIRD - 6);
    ctx.fillStyle = INK;
    ctx.fillRect(-12, vy < 0 ? -2 : 4, 12, 8);
    ctx.fillRect(BIRD / 2, -3, 12, 10);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(BIRD / 2 + 2, -1, 8, 6);
    ctx.fillStyle = '#fff';
    ctx.fillRect(2, -10, 9, 9);
    ctx.fillStyle = INK;
    ctx.fillRect(6, -7, 4, 4);
    ctx.restore();
  }

  function draw() {
    var i, p, x, scroll;
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#35176a';
    for (i = 0; i < 7; i++) ctx.fillRect(i * 150 - ((time * 20) % 150), 110 + (i % 3) * 90, 90, 30);

    for (i = 0; i < pipes.length; i++) {
      p = pipes[i];
      drawPipe(p.x, 0, p.top, true);
      drawPipe(p.x, p.top + p.gap, H - GROUND - (p.top + p.gap), false);
    }

    ctx.fillStyle = INK;
    ctx.fillRect(0, H - GROUND, W, GROUND);
    ctx.fillStyle = LIGHT;
    ctx.fillRect(0, H - GROUND + 6, W, GROUND - 6);
    ctx.fillStyle = MID;
    scroll = (time * speed) % 40;
    for (x = -40; x < W; x += 40) ctx.fillRect(x - scroll + 40, H - GROUND + 6, 20, GROUND - 6);

    drawBird(bird.y, bird.vy);

    for (i = 0; i < particles.length; i++) {
      ctx.fillStyle = particles[i].color;
      ctx.fillRect(particles[i].x, particles[i].y, 5, 5);
    }

    ctx.font = '900 56px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = INK;
    ctx.fillText(String(score), W / 2 + 3, 73);
    ctx.fillStyle = ACCENT;
    ctx.fillText(String(score), W / 2, 70);
  }

  var last = 0;
  function frame(t) {
    var dt = Math.min(0.05, (t - last) / 1000 || 0);
    last = t;
    if (state === 'playing') update(dt);
    else if (state === 'start') { time += dt; bird.y = H / 2 - GROUND / 2 + Math.sin(time * 4) * 8; }
    else if (state === 'over') stepParticles(dt);
    draw();
    requestAnimationFrame(frame);
  }

  window.addEventListener('keydown', function (e) {
    var k = e.key;
    if (k && k.length === 1) k = k.toLowerCase();
    if (k === ' ' || k === 'ArrowUp') e.preventDefault();
    if (k === 'Enter') {
      if (state === 'start' || state === 'over') newGame();
    } else if (k === 'p') {
      if (state === 'playing') { state = 'paused'; showOverlay('PAUSED', 'Press P to resume'); }
      else if (state === 'paused') { state = 'playing'; hideOverlay(); }
    } else if ((k === ' ' || k === 'ArrowUp') && !e.repeat) {
      flap();
    }
  });

  high = loadHigh();
  reset();
  updateHud();
  showOverlay('FLAP', 'Press ENTER to start');
  requestAnimationFrame(frame);
}());
