(function () {
  'use strict';

  var W = 800, H = 600;
  var BG = '#2b1055', LIGHT = '#b794f6', MID = '#7c3aed', ACCENT = '#fde047', INK = '#000000';
  var STORE_KEY = 'console.tetris.high';

  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var elScore = document.getElementById('score');
  var elLines = document.getElementById('lives');
  var elLevel = document.getElementById('level');
  var elHigh = document.getElementById('high');
  var overlay = document.getElementById('overlay');
  var elTitle = document.getElementById('overlay-title');
  var elMsg = document.getElementById('overlay-msg');

  var CELL = 30, COLS = 10, ROWS = 20, BX = 60, BY = 0;
  var COLORS = { I: '#67e8f9', O: '#fde047', T: '#c084fc', S: '#86efac', Z: '#fb7185', J: '#60a5fa', L: '#fdba74' };
  var SHAPES = {
    I: [[0, 1], [1, 1], [2, 1], [3, 1]],
    O: [[1, 0], [2, 0], [1, 1], [2, 1]],
    T: [[1, 0], [0, 1], [1, 1], [2, 1]],
    S: [[1, 0], [2, 0], [0, 1], [1, 1]],
    Z: [[0, 0], [1, 0], [1, 1], [2, 1]],
    J: [[0, 0], [0, 1], [1, 1], [2, 1]],
    L: [[2, 0], [0, 1], [1, 1], [2, 1]]
  };
  var SIZE = { I: 4, O: 4, T: 3, S: 3, Z: 3, J: 3, L: 3 };
  var LINE_PTS = [0, 100, 300, 500, 800];

  var state = 'start'; // start | playing | paused | over
  var grid, cur, next, hold, canHold, bag, score, lines, level, high, acc, flash;

  function loadHigh() {
    try { return parseInt(localStorage.getItem(STORE_KEY), 10) || 0; } catch (e) { return 0; }
  }
  function saveHigh() {
    try { localStorage.setItem(STORE_KEY, String(high)); } catch (e) { /* ignore */ }
  }

  function updateHud() {
    elScore.textContent = score;
    elLines.textContent = lines;
    elLevel.textContent = level;
    elHigh.textContent = high;
  }

  function showOverlay(title, msg) {
    elTitle.textContent = title;
    elMsg.textContent = msg;
    overlay.classList.remove('hidden');
  }
  function hideOverlay() { overlay.classList.add('hidden'); }

  function dropTime() { return Math.max(0.05, 0.8 - (level - 1) * 0.07); }

  function nextType() {
    if (!bag || !bag.length) {
      bag = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
      for (var i = bag.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1)), t = bag[i];
        bag[i] = bag[j]; bag[j] = t;
      }
    }
    return bag.pop();
  }

  function makePiece(type) {
    return { type: type, cells: SHAPES[type].map(function (c) { return [c[0], c[1]]; }), x: 3, y: 0 };
  }

  function collides(cells, x, y) {
    for (var i = 0; i < cells.length; i++) {
      var cx = cells[i][0] + x, cy = cells[i][1] + y;
      if (cx < 0 || cx >= COLS || cy >= ROWS) return true;
      if (cy >= 0 && grid[cy][cx]) return true;
    }
    return false;
  }

  function rotated(cells, type, dirn) {
    var n = SIZE[type];
    return cells.map(function (c) {
      return dirn > 0 ? [n - 1 - c[1], c[0]] : [c[1], n - 1 - c[0]];
    });
  }

  function tryRotate(dirn) {
    if (cur.type === 'O') return;
    var cells = rotated(cur.cells, cur.type, dirn);
    var kicks = [[0, 0], [-1, 0], [1, 0], [0, -1], [-2, 0], [2, 0]];
    for (var i = 0; i < kicks.length; i++) {
      if (!collides(cells, cur.x + kicks[i][0], cur.y + kicks[i][1])) {
        cur.cells = cells; cur.x += kicks[i][0]; cur.y += kicks[i][1];
        return;
      }
    }
  }

  function move(dx) {
    if (!collides(cur.cells, cur.x + dx, cur.y)) cur.x += dx;
  }

  function ghostY() {
    var y = cur.y;
    while (!collides(cur.cells, cur.x, y + 1)) y++;
    return y;
  }

  function spawn(type) {
    cur = makePiece(type || next);
    if (!type) next = nextType();
    canHold = true;
    acc = 0;
    if (collides(cur.cells, cur.x, cur.y)) gameOver();
  }

  function gameOver() {
    state = 'over';
    if (score > high) { high = score; saveHigh(); }
    updateHud();
    showOverlay('GAME OVER', 'Score ' + score + ' - Press ENTER to restart');
  }

  function lock() {
    var i, y, cleared = 0;
    for (i = 0; i < cur.cells.length; i++) {
      var cy = cur.cells[i][1] + cur.y;
      if (cy < 0) { gameOver(); return; }
      grid[cy][cur.cells[i][0] + cur.x] = cur.type;
    }
    for (y = ROWS - 1; y >= 0; y--) {
      if (grid[y].every(function (v) { return v; })) {
        grid.splice(y, 1);
        grid.unshift(new Array(COLS).fill(null));
        cleared++; y++;
      }
    }
    if (cleared) {
      score += LINE_PTS[cleared] * level;
      lines += cleared;
      level = 1 + Math.floor(lines / 10);
      flash = 0.15;
    }
    if (score > high) { high = score; saveHigh(); }
    updateHud();
    spawn();
  }

  function hardDrop() {
    var y = ghostY();
    score += (y - cur.y) * 2;
    cur.y = y;
    lock();
  }

  function softDrop() {
    if (!collides(cur.cells, cur.x, cur.y + 1)) { cur.y++; score += 1; acc = 0; updateHud(); }
  }

  function doHold() {
    if (!canHold) return;
    var t = cur.type;
    if (hold) { spawn(hold); } else { spawn(); }
    hold = t;
    canHold = false;
  }

  function newGame() {
    grid = [];
    for (var y = 0; y < ROWS; y++) grid.push(new Array(COLS).fill(null));
    bag = []; hold = null; score = 0; lines = 0; level = 1; flash = 0;
    next = nextType();
    state = 'playing';
    spawn();
    hideOverlay();
    updateHud();
  }

  function update(dt) {
    if (flash > 0) flash -= dt;
    acc += dt;
    if (acc >= dropTime()) {
      acc = 0;
      if (!collides(cur.cells, cur.x, cur.y + 1)) cur.y++; else lock();
    }
  }

  function block(px, py, s, color, alpha) {
    ctx.globalAlpha = alpha === undefined ? 1 : alpha;
    ctx.fillStyle = color;
    ctx.fillRect(px, py, s, s);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.strokeRect(px + 1.5, py + 1.5, s - 3, s - 3);
  }

  function panel(x, y, w, h, label) {
    ctx.fillStyle = LIGHT; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = INK; ctx.font = 'bold 18px "Courier New", monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(label, x + w / 2, y + 8);
  }

  function preview(type, x, y, w, h) {
    if (!type) return;
    var s = 24, cells = SHAPES[type], minX = 9, maxX = -9, minY = 9, maxY = -9, i;
    for (i = 0; i < cells.length; i++) {
      minX = Math.min(minX, cells[i][0]); maxX = Math.max(maxX, cells[i][0]);
      minY = Math.min(minY, cells[i][1]); maxY = Math.max(maxY, cells[i][1]);
    }
    var ox = x + (w - (maxX - minX + 1) * s) / 2 - minX * s;
    var oy = y + 36 + (h - 36 - (maxY - minY + 1) * s) / 2 - minY * s;
    for (i = 0; i < cells.length; i++) block(ox + cells[i][0] * s, oy + cells[i][1] * s, s, COLORS[type]);
  }

  function draw() {
    var x, y, i;
    ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#1a0a3a'; ctx.fillRect(BX, BY, COLS * CELL, ROWS * CELL);
    ctx.strokeStyle = 'rgba(183,148,246,0.15)'; ctx.lineWidth = 1;
    for (x = 1; x < COLS; x++) { ctx.beginPath(); ctx.moveTo(BX + x * CELL, BY); ctx.lineTo(BX + x * CELL, BY + ROWS * CELL); ctx.stroke(); }
    for (y = 1; y < ROWS; y++) { ctx.beginPath(); ctx.moveTo(BX, BY + y * CELL); ctx.lineTo(BX + COLS * CELL, BY + y * CELL); ctx.stroke(); }
    if (grid) {
      for (y = 0; y < ROWS; y++) for (x = 0; x < COLS; x++) {
        if (grid[y][x]) block(BX + x * CELL, BY + y * CELL, CELL, COLORS[grid[y][x]]);
      }
      if (cur && state !== 'over') {
        var gy = ghostY();
        for (i = 0; i < cur.cells.length; i++) {
          if (cur.cells[i][1] + gy >= 0) block(BX + (cur.cells[i][0] + cur.x) * CELL, BY + (cur.cells[i][1] + gy) * CELL, CELL, COLORS[cur.type], 0.25);
        }
        for (i = 0; i < cur.cells.length; i++) {
          if (cur.cells[i][1] + cur.y >= 0) block(BX + (cur.cells[i][0] + cur.x) * CELL, BY + (cur.cells[i][1] + cur.y) * CELL, CELL, COLORS[cur.type]);
        }
      }
    }
    if (flash > 0) { ctx.fillStyle = 'rgba(253,224,71,0.25)'; ctx.fillRect(BX, BY, COLS * CELL, ROWS * CELL); }
    ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.strokeRect(BX, BY, COLS * CELL, ROWS * CELL);

    panel(440, 40, 180, 140, 'NEXT');
    preview(next, 440, 40, 180, 140);
    panel(440, 220, 180, 140, 'HOLD');
    preview(hold, 440, 220, 180, 140);
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
    var k = e.key;
    if (k && k.length === 1) k = k.toLowerCase();
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].indexOf(k) >= 0) e.preventDefault();
    if (k === 'Enter') {
      if (state === 'start' || state === 'over') newGame();
    } else if (k === 'p') {
      if (state === 'playing') { state = 'paused'; showOverlay('PAUSED', 'Press P to resume'); }
      else if (state === 'paused') { state = 'playing'; hideOverlay(); }
    } else if (state === 'playing') {
      if (k === 'ArrowLeft' || k === 'a') move(-1);
      else if (k === 'ArrowRight' || k === 'd') move(1);
      else if (k === 'ArrowDown' || k === 's') softDrop();
      else if (k === 'ArrowUp' || k === 'x' || k === 'w') tryRotate(1);
      else if (k === 'z') tryRotate(-1);
      else if (k === ' ') hardDrop();
      else if (k === 'c') doHold();
      if (state === 'playing') updateHud();
    }
  });

  high = loadHigh();
  score = 0; lines = 0; level = 1; flash = 0;
  updateHud();
  showOverlay('TETRIS', 'Press ENTER to start');
  requestAnimationFrame(frame);
}());
