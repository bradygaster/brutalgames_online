(function () {
  'use strict';

  var W = 800, H = 600;
  var BG = '#2b1055', LIGHT = '#b794f6', MID = '#7c3aed', ACCENT = '#fde047', INK = '#000000';
  var STORE_KEY = 'console.snake.high';

  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var elScore = document.getElementById('score');
  var elLen = document.getElementById('lives');
  var elSpeed = document.getElementById('level');
  var elHigh = document.getElementById('high');
  var overlay = document.getElementById('overlay');
  var elTitle = document.getElementById('overlay-title');
  var elMsg = document.getElementById('overlay-msg');

  var CELL = 25, COLS = W / CELL, ROWS = H / CELL;
  var DIRS = {
    ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1],
    ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0]
  };

  var state = 'start'; // start | playing | paused | over
  var snake, dir, queue, food, score, high, speedLevel, acc, grew, particles, deadFlash, eaten;

  function loadHigh() {
    try { return parseInt(localStorage.getItem(STORE_KEY), 10) || 0; } catch (e) { return 0; }
  }
  function saveHigh() {
    try { localStorage.setItem(STORE_KEY, String(high)); } catch (e) { /* ignore */ }
  }

  function updateHud() {
    elScore.textContent = score;
    elLen.textContent = snake.length;
    elSpeed.textContent = speedLevel;
    elHigh.textContent = high;
  }

  function showOverlay(title, msg) {
    elTitle.textContent = title;
    elMsg.textContent = msg;
    overlay.classList.remove('hidden');
  }
  function hideOverlay() { overlay.classList.add('hidden'); }

  // Seconds per step: starts slow, ramps with each apple, floors at 0.05s
  function stepTime() { return Math.max(0.05, 0.14 - (speedLevel - 1) * 0.008); }

  function placeFood() {
    var free = [], x, y, i, occupied = {};
    for (i = 0; i < snake.length; i++) occupied[snake[i].x + ',' + snake[i].y] = true;
    for (y = 0; y < ROWS; y++) {
      for (x = 0; x < COLS; x++) if (!occupied[x + ',' + y]) free.push({ x: x, y: y });
    }
    food = free.length ? free[Math.floor(Math.random() * free.length)] : null;
  }

  function newGame() {
    snake = [{ x: 10, y: 12 }, { x: 9, y: 12 }, { x: 8, y: 12 }];
    dir = [1, 0];
    queue = [];
    score = 0; speedLevel = 1; eaten = 0; acc = 0; particles = []; deadFlash = 0;
    placeFood();
    updateHud();
    state = 'playing';
    hideOverlay();
  }

  function burst(x, y, color) {
    var i, a;
    for (i = 0; i < 12; i++) {
      a = Math.random() * Math.PI * 2;
      particles.push({ x: x, y: y, vx: Math.cos(a) * (40 + Math.random() * 120),
        vy: Math.sin(a) * (40 + Math.random() * 120), life: 0.5, color: color });
    }
  }

  function gameOver(won) {
    state = 'over';
    deadFlash = 0.5;
    showOverlay(won ? 'YOU WIN' : 'GAME OVER', 'Score ' + score + ' - Press ENTER to restart');
  }

  function step() {
    var d = queue.length ? queue.shift() : dir, head, nx, ny, i, tail;
    // Ignore a 180 degree reversal
    if (!(d[0] === -dir[0] && d[1] === -dir[1])) dir = d;
    head = snake[0];
    nx = head.x + dir[0];
    ny = head.y + dir[1];
    if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) { gameOver(false); return; }
    tail = food && nx === food.x && ny === food.y ? null : snake[snake.length - 1];
    for (i = 0; i < snake.length; i++) {
      if (snake[i].x === nx && snake[i].y === ny && snake[i] !== tail) { gameOver(false); return; }
    }
    snake.unshift({ x: nx, y: ny });
    if (food && nx === food.x && ny === food.y) {
      eaten++;
      score += 10 * speedLevel;
      if (score > high) { high = score; saveHigh(); }
      speedLevel = 1 + Math.floor(eaten / 3);
      burst(nx * CELL + CELL / 2, ny * CELL + CELL / 2, ACCENT);
      placeFood();
      if (!food) { updateHud(); gameOver(true); return; }
    } else {
      snake.pop();
    }
    updateHud();
  }

  function update(dt) {
    var i, p;
    acc += dt;
    while (acc >= stepTime() && state === 'playing') {
      acc -= stepTime();
      step();
    }
    for (i = particles.length - 1; i >= 0; i--) {
      p = particles[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function block(x, y, fill, inset) {
    var o = inset || 0;
    ctx.fillStyle = INK;
    ctx.fillRect(x * CELL + o, y * CELL + o, CELL - o * 2, CELL - o * 2);
    ctx.fillStyle = fill;
    ctx.fillRect(x * CELL + o + 2, y * CELL + o + 2, CELL - o * 2 - 4, CELL - o * 2 - 4);
  }

  function draw() {
    var i, x, y;
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#35176a';
    for (y = 0; y < ROWS; y++) {
      for (x = 0; x < COLS; x++) {
        if ((x + y) % 2 === 0) ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
      }
    }
    if (food) block(food.x, food.y, '#ef4444', 2);
    for (i = snake.length - 1; i >= 0; i--) {
      block(snake[i].x, snake[i].y, i === 0 ? ACCENT : (i % 2 ? LIGHT : '#9f75f0'), 0);
    }
    if (snake.length) {
      ctx.fillStyle = INK;
      ctx.fillRect(snake[0].x * CELL + 6 + dir[0] * 3, snake[0].y * CELL + 6 + dir[1] * 3, 4, 4);
      ctx.fillRect(snake[0].x * CELL + 15 + dir[0] * 3, snake[0].y * CELL + 6 + dir[1] * 3, 4, 4);
    }
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

  window.addEventListener('keydown', function (e) {
    var k = e.key, d, ref;
    if (k && k.length === 1) k = k.toLowerCase();
    if (DIRS[k] || k === ' ') e.preventDefault();
    if (k === 'Enter') {
      if (state === 'start' || state === 'over') newGame();
    } else if (k === 'p') {
      if (state === 'playing') { state = 'paused'; showOverlay('PAUSED', 'Press P to resume'); }
      else if (state === 'paused') { state = 'playing'; hideOverlay(); }
    } else if (DIRS[k] && state === 'playing') {
      d = DIRS[k];
      ref = queue.length ? queue[queue.length - 1] : dir;
      if (queue.length < 3 && !(d[0] === -ref[0] && d[1] === -ref[1]) && !(d[0] === ref[0] && d[1] === ref[1])) {
        queue.push(d);
      }
    }
  });

  high = loadHigh();
  snake = [{ x: 10, y: 12 }, { x: 9, y: 12 }, { x: 8, y: 12 }];
  dir = [1, 0]; queue = []; score = 0; speedLevel = 1; particles = []; acc = 0; eaten = 0;
  placeFood();
  updateHud();
  showOverlay('SNAKE', 'Press ENTER to start');
  requestAnimationFrame(frame);
}());
