// Hero "system map" en <canvas> + stagger de reveals + glow/tilt en cards. Vanilla, sin dependencias.
(function () {
  'use strict';
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // ---- Stagger de reveals dentro de cada grilla
  document.querySelectorAll('.grid').forEach(function (g) {
    var i = 0;
    Array.prototype.forEach.call(g.children, function (c) {
      if (c.classList.contains('reveal')) c.style.transitionDelay = Math.min(i++ * 70, 420) + 'ms';
    });
  });

  // ---- Glow que sigue al mouse + tilt sutil (solo mouse, sin reduced-motion)
  if (FINE && !RM) {
    document.querySelectorAll('.svc, .card').forEach(function (el) {
      el.classList.add('fx-tilt');
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
        el.style.transform = 'perspective(800px) rotateX(' + ((0.5 - y) * 5).toFixed(2) + 'deg) rotateY(' + ((x - 0.5) * 5).toFixed(2) + 'deg) translateY(-3px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
      // al terminar el reveal, sacar el delay para que el hover responda al instante
      el.addEventListener('transitionend', function () { el.style.transitionDelay = ''; }, { once: true });
    });
  }

  // ---- Canvas del hero
  var hero = document.querySelector('.hero');
  if (!hero || !window.HTMLCanvasElement) return;
  var cv = document.createElement('canvas');
  cv.className = 'hero__fx';
  cv.setAttribute('aria-hidden', 'true');
  hero.insertBefore(cv, hero.firstChild);
  var ctx = cv.getContext('2d');
  if (!ctx) return;

  var C1 = [34, 211, 238], C2 = [167, 139, 250], C3 = [52, 211, 153];
  var LABELS = [['exchanges', 'on-chain', 'APIs', 'webhooks'], ['pipeline', 'LLM agent', 'RAG', 'SQL'], ['Telegram', 'REST API', 'dashboard', 'alerts']];
  var W, H, dpr, nodes, edges, packets, mobile, mx = 0, my = 0, tmx = 0, tmy = 0, sy = 0;
  var running = false, visible = true, raf = 0, last = 0;

  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  function build() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = hero.clientWidth; H = hero.clientHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    mobile = W < 720;
    nodes = []; edges = []; packets = [];
    // columnas: fuentes -> procesamiento/IA -> salidas (más densas a la derecha, lejos del texto)
    var cols = mobile ? 4 : 6, perCol = mobile ? 4 : 6, x0 = mobile ? 0.06 : 0.28;
    for (var c = 0; c < cols; c++) {
      var n = perCol - (c % 2), stage = Math.min(2, Math.floor(c / cols * 3));
      for (var i = 0; i < n; i++) {
        nodes.push({
          c: c, stage: stage,
          x: (x0 + (0.97 - x0) * (c / (cols - 1))) * W + rnd(-18, 18),
          y: ((i + 0.5) / n) * H * 0.9 + H * 0.05 + rnd(-20, 20),
          z: rnd(0.4, 1), r: stage === 1 ? rnd(2.6, 4) : rnd(1.6, 2.8), ph: rnd(0, 6.28), hot: 0,
          label: !mobile && i < 4 && (c === 0 || c === cols - 1 || c === 2) ? LABELS[stage][i] : ''
        });
      }
    }
    // aristas entre columnas vecinas
    nodes.forEach(function (a, ia) {
      nodes.forEach(function (b, ib) {
        if (b.c === a.c + 1 && Math.abs(a.y - b.y) < H * (mobile ? 0.38 : 0.3) && Math.random() < 0.75) edges.push({ a: ia, b: ib });
      });
    });
    var np = RM ? (mobile ? 5 : 12) : (mobile ? 10 : 26);
    for (var k = 0; k < np; k++) spawn(true);
  }

  function spawn(init) {
    if (!edges.length) return;
    // arrancar preferentemente desde la primera columna para que el flujo "corra"
    var starts = edges.filter(function (e) { return nodes[e.a].c === 0; });
    var e = init || !starts.length ? edges[(Math.random() * edges.length) | 0] : starts[(Math.random() * starts.length) | 0];
    packets.push({ e: e, t: init ? Math.random() : 0, v: rnd(0.25, 0.55) * (RM ? 0.35 : 1) });
  }

  function pos(n) {
    if (RM) return [n.x, n.y]; // sin parallax en reduced-motion
    var px = (mx * 18 + 0) * n.z, py = (my * 12 - sy * 0.15) * n.z;
    return [n.x + px, n.y + py];
  }

  function colOf(n) { return n.stage === 0 ? C1 : n.stage === 1 ? C2 : C3; }

  function draw(time, dt) {
    ctx.clearRect(0, 0, W, H);
    mx += (tmx - mx) * 0.06; my += (tmy - my) * 0.06;
    var P = nodes.map(pos), i, e, a, b;
    ctx.lineWidth = 1;
    for (i = 0; i < edges.length; i++) {
      e = edges[i]; a = P[e.a]; b = P[e.b];
      var g = ctx.createLinearGradient(a[0], 0, b[0], 0);
      g.addColorStop(0, rgba(colOf(nodes[e.a]), 0.13)); g.addColorStop(1, rgba(colOf(nodes[e.b]), 0.13));
      ctx.strokeStyle = g;
      ctx.beginPath(); ctx.moveTo(a[0], a[1]);
      ctx.bezierCurveTo((a[0] + b[0]) / 2, a[1], (a[0] + b[0]) / 2, b[1], b[0], b[1]); ctx.stroke();
    }
    // paquetes
    for (i = packets.length - 1; i >= 0; i--) {
      var p = packets[i];
      p.t += p.v * dt;
      e = p.e; a = P[e.a]; b = P[e.b];
      if (p.t >= 1) {
        nodes[e.b].hot = RM ? 0.35 : 1; // sin destellos fuertes en reduced-motion
        var nxt = edges.filter(function (x) { return x.a === e.b; });
        if (nxt.length) { p.e = nxt[(Math.random() * nxt.length) | 0]; p.t = 0; }
        else { packets.splice(i, 1); spawn(false); }
        continue;
      }
      var t = p.t, u = 1 - t, cx = (a[0] + b[0]) / 2;
      var x = u * u * u * a[0] + 3 * u * u * t * cx + 3 * u * t * t * cx + t * t * t * b[0];
      var y = u * u * u * a[1] + 3 * u * u * t * a[1] + 3 * u * t * t * b[1] + t * t * t * b[1];
      var col = colOf(t < 0.5 ? nodes[e.a] : nodes[e.b]);
      ctx.fillStyle = rgba(col, 0.18); ctx.beginPath(); ctx.arc(x, y, 6, 0, 6.283); ctx.fill();
      ctx.fillStyle = rgba(col, 0.95); ctx.beginPath(); ctx.arc(x, y, 1.8, 0, 6.283); ctx.fill();
    }
    // nodos
    ctx.font = '11px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace';
    for (i = 0; i < nodes.length; i++) {
      var n = nodes[i], q = P[i], c = colOf(n), pulse = 0.5 + 0.5 * Math.sin(time * (RM ? 0.0008 : 0.0016) + n.ph);
      n.hot = Math.max(0, n.hot - dt * (RM ? 0.6 : 1.6));
      var glow = n.r * (2.2 + pulse * 1.2 + n.hot * 4);
      ctx.fillStyle = rgba(c, 0.07 + n.hot * 0.22); ctx.beginPath(); ctx.arc(q[0], q[1], glow, 0, 6.283); ctx.fill();
      ctx.fillStyle = rgba(c, 0.55 + n.hot * 0.45); ctx.beginPath(); ctx.arc(q[0], q[1], n.r, 0, 6.283); ctx.fill();
      if (n.label) { ctx.fillStyle = rgba(c, 0.32 + n.hot * 0.4); ctx.fillText(n.label, q[0] + 9, q[1] - 8); }
    }
  }

  function loop(t) {
    raf = 0;
    if (!running) return;
    var dt = Math.min(0.05, last ? (t - last) / 1000 : 0.016); last = t;
    draw(t, dt);
    raf = requestAnimationFrame(loop);
  }
  function start() {
    var go = visible && !document.hidden;
    if (go && !running) { running = true; last = 0; raf = requestAnimationFrame(loop); }
    else if (!go && running) { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
  }

  build();
  draw(0, 0);
  window.__heroFx = { frames: 0 };
  var _d = draw; draw = function (t, dt) { window.__heroFx.frames++; _d(t, dt); };

  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { if (hero.clientWidth !== W || Math.abs(hero.clientHeight - H) > 60) { build(); draw(0, 0); } }, 150);
  }, { passive: true });
  if (FINE && !RM) window.addEventListener('pointermove', function (e) {
    tmx = e.clientX / window.innerWidth - 0.5; tmy = e.clientY / window.innerHeight - 0.5;
  }, { passive: true });
  window.addEventListener('scroll', function () { sy = Math.min(window.scrollY, H); }, { passive: true });
  document.addEventListener('visibilitychange', start);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; start(); }).observe(hero);
  }
  start();
})();
