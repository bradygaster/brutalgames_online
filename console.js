(function () {
  var list = document.getElementById("games");
  var games = window.GAMES || [];
  var cards = [];

  // Pixel sprites, 1 = filled cell.
  var SPRITES = {
    asteroids: ["...11...", "..1111..", ".111111.", "11111111", "11111111", "1111.111", ".11..11.", "1......1"],
    invaders: ["..1..1..", "...11...", "..1111..", ".11..11.", "11111111", "1.1111.1", "1.1..1.1", "..1..1.."],
    snake: ["11111...", "1...1...", "1...1111", "1......1", "11111..1", "....1..1", "....1111", "........"],
    breakout: ["11111111", "11111111", "........", "........", "...11...", "........", "........", ".111111."],
    tetris: ["..1.....", "..1.....", "..11....", "........", "11..11..", ".1111...", ".11..11.", "1111111."],
    pong: ["1......1", "1...1..1", "1......1", "1......1", "1......1", "1..1...1", "1......1", "1......1"],
    flappy: ["..1111..", ".1....1.", "11.1..1.", "1..1.111", "1.....1.", ".1111.1.", "..1111..", "..1..1.."]
  };
  var FALLBACK = ["11111111", "1......1", "1.1..1.1", "1......1", "1.1111.1", "1..11..1", "1......1", "11111111"];

  function glyph(id) {
    var rows = SPRITES[id] || FALLBACK;
    var cv = document.createElement("canvas");
    cv.className = "glyph";
    cv.width = 8;
    cv.height = 8;
    cv.setAttribute("aria-hidden", "true");
    var ctx = cv.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#000";
      rows.forEach(function (r, y) {
        for (var x = 0; x < 8; x++) if (r.charAt(x) === "1") ctx.fillRect(x, y, 1, 1);
      });
    }
    return cv;
  }

  // Read-only: games write "console.<id>.high".
  function highScore(id) {
    try {
      var v = window.localStorage.getItem("console." + id + ".high");
      if (v !== null && v !== "" && isFinite(Number(v))) return Number(v);
    } catch (e) { /* storage unavailable */ }
    return null;
  }

  games.forEach(function (g, i) {
    var li = document.createElement("li");
    var a = document.createElement("a");
    a.className = "game-card";
    a.href = g.path;
    a.style.setProperty("--card", g.color);

    var num = document.createElement("span");
    num.className = "num";
    num.textContent = String(i + 1);

    var h = document.createElement("h2");
    h.textContent = g.title;
    var p = document.createElement("p");
    p.textContent = g.blurb;

    var hs = document.createElement("div");
    hs.className = "score";
    var best = highScore(g.id);
    hs.textContent = best === null ? "Best: ---" : "Best: " + best.toLocaleString();

    a.appendChild(num);
    a.appendChild(glyph(g.id));
    a.appendChild(h);
    a.appendChild(p);
    a.appendChild(hs);
    li.appendChild(a);
    list.appendChild(li);
    cards.push(a);
  });

  function columns() {
    if (cards.length < 2) return 1;
    var top = cards[0].getBoundingClientRect().top, n = 0;
    while (n < cards.length && Math.abs(cards[n].getBoundingClientRect().top - top) < 4) n++;
    return n || 1;
  }

  function focusAt(i) {
    if (!cards.length) return;
    cards[(i + cards.length) % cards.length].focus();
  }

  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey || !cards.length) return;
    var cur = cards.indexOf(document.activeElement);
    var k = e.key;
    if (k >= "1" && k <= "9") {
      var n = Number(k) - 1;
      if (n < cards.length) { e.preventDefault(); window.location.href = games[n].path; }
    } else if (k === "ArrowRight") { e.preventDefault(); focusAt(cur < 0 ? 0 : cur + 1); }
    else if (k === "ArrowLeft") { e.preventDefault(); focusAt(cur < 0 ? 0 : cur - 1); }
    else if (k === "ArrowDown") {
      e.preventDefault();
      focusAt(cur < 0 ? 0 : Math.min(cur + columns(), cards.length - 1));
    } else if (k === "ArrowUp") {
      e.preventDefault();
      focusAt(cur < 0 ? 0 : Math.max(cur - columns(), 0));
    } else if (k === "Enter" && cur >= 0) {
      e.preventDefault();
      window.location.href = games[cur].path;
    }
  });

  focusAt(0);
})();
