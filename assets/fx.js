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

  // ---- Terminal system.map: las líneas se "tipean" una vez, al entrar en pantalla
  var tb = document.querySelector('.term__body');
  if (tb && !RM) {
    tb.innerHTML = tb.innerHTML.split('\n').map(function (l) { return '<span class="tline">' + (l || ' ') + '</span>'; }).join('');
    tb.classList.add('is-typing');
    var typeIt = function () {
      Array.prototype.forEach.call(tb.children, function (l, i) { setTimeout(function () { l.classList.add('on'); }, 250 + i * 190); });
    };
    if ('IntersectionObserver' in window) {
      var tio = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { tio.disconnect(); typeIt(); } });
      tio.observe(tb);
    } else typeIt();
  }

  // ---- CTAs magnéticos (solo mouse)
  if (FINE && !RM) {
    document.querySelectorAll('.hero__ctas .btn, .contact .btn--primary').forEach(function (b) {
      b.classList.add('fx-mag');
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.28).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.4).toFixed(1) + 'px)';
      });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });
  }

  // ---- Capa de fondo fija: red de sistema 3D (proyección propia sobre canvas 2D)
  if (!window.HTMLCanvasElement) return;
  var hero = document.querySelector('.hero');
  var root = document.documentElement;
  var sections = Array.prototype.slice.call(document.querySelectorAll('main > section'));
  var cv = document.createElement('canvas');
  cv.className = 'bgfx';
  cv.setAttribute('aria-hidden', 'true');
  var ctx = cv.getContext('2d');
  if (!ctx) return;

  var LOW = (navigator.hardwareConcurrency || 8) <= 4;
  var COL = [[34, 211, 238], [167, 139, 250], [52, 211, 153]];
  var LABELS = [['exchanges', 'on-chain', 'APIs'], ['pipeline', 'LLM agent', 'RAG', 'SQL'], ['Telegram', 'REST API', 'dashboard', 'alerts']];
  // foco por sección: 0 fuentes, 1 IA, 2 salidas, -1 vista general (hero)
  var FOCUS = { about: 0, journey: 0, stack: 0, certs: 0, services: 1, community: 1, projects: 2, contact: 2 };
  var W, H, dpr, mobile, nodes = [], edges = [], packets = [], ripples = [], sparks = [], sprites = [];
  var cam = { yaw: 0.5, pitch: -0.28, dist: 5.2, tx: 0, ty: 0, ox: 0.66, a: 1, side: 1 };
  var goal = { tx: 0, ty: 0, dist: 5.2, ox: 0.66, a: 1, side: 1 };
  var vyaw = 0, vpitch = 0, drag = null, pxm = -1, pym = -1, running = false, raf = 0, last = 0, frame = 0, nextEvt = 3;
  var stats = window.__heroFx = { frames: 0, focus: -1 };

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a.toFixed(3) + ')'; }

  function makeSprites() {
    sprites = COL.map(function (c) {
      var s = document.createElement('canvas'), g = s.getContext('2d'), R = 32;
      s.width = s.height = R * 2;
      var gr = g.createRadialGradient(R, R, 0, R, R, R);
      gr.addColorStop(0, rgba(c, 1)); gr.addColorStop(0.18, rgba(c, 0.55)); gr.addColorStop(0.45, rgba(c, 0.12)); gr.addColorStop(1, rgba(c, 0));
      g.fillStyle = gr; g.fillRect(0, 0, R * 2, R * 2);
      return s;
    });
  }

  function build() {
    nodes = []; edges = []; packets = [];
    var per = (mobile || LOW) ? [7, 8, 7] : [15, 16, 15];
    for (var s = 0; s < 3; s++) {
      var cx = (s - 1) * 1.75, L = LABELS[s];
      for (var i = 0; i < per[s]; i++) {
        // distribución esférica con núcleo más denso
        var u = rnd(-1, 1), th = rnd(0, 6.283), rr = Math.pow(Math.random(), 0.6) * (s === 1 ? 0.75 : 0.65), q = Math.sqrt(1 - u * u);
        var lab = i < L.length ? L[i] : '';
        nodes.push({ s: s, x: cx + q * Math.cos(th) * rr * (lab ? 0.6 : 1), y: u * rr * 1.1 * (lab ? 0.7 : 1), z: q * Math.sin(th) * rr,
          r: lab ? 3.4 : (s === 1 ? rnd(2, 3.4) : rnd(1.4, 2.6)), ph: rnd(0, 6.283), hot: 0, label: lab });
      }
    }
    var d2 = function (a, b) { var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z; return dx * dx + dy * dy + dz * dz; };
    nodes.forEach(function (a, ia) {
      // 2 enlaces hacia la etapa siguiente (los más cercanos con algo de azar) + 1 interno
      var cand = [];
      nodes.forEach(function (b, ib) { if (b.s === a.s + 1) cand.push([d2(a, b) * rnd(0.6, 1.4), ib]); });
      cand.sort(function (p, q) { return p[0] - q[0]; });
      cand.slice(0, 2).forEach(function (c) { edges.push(mkEdge(ia, c[1], true)); });
      var best = -1, bd = 9;
      nodes.forEach(function (b, ib) { if (ib > ia && b.s === a.s) { var d = d2(a, b); if (d < bd) { bd = d; best = ib; } } });
      if (best >= 0 && Math.random() < 0.7) edges.push(mkEdge(ia, best, false));
    });
    var np = RM ? 8 : (mobile || LOW ? 14 : 34);
    for (var k = 0; k < np; k++) spawn(true);
  }
  function mkEdge(a, b, flow) {
    var A = nodes[a], B = nodes[b];
    // punto de control 3D: arco hacia afuera para que las aristas sean curvas
    return { a: a, b: b, flow: flow, cx: (A.x + B.x) / 2, cy: (A.y + B.y) / 2 + rnd(-0.5, 0.5), cz: (A.z + B.z) / 2 + rnd(-0.6, 0.6) };
  }
  function spawn(init) {
    var fl = edges.filter(function (e) { return e.flow && (init || nodes[e.a].s === 0); });
    if (!fl.length) return;
    packets.push({ e: fl[(Math.random() * fl.length) | 0], t: init ? Math.random() : 0, v: rnd(0.35, 0.7) * (RM ? 0.3 : 1) });
  }

  // proyección: rotación yaw/pitch alrededor del objetivo + perspectiva
  var cy_, sy_, cp_, sp_, F;
  function prep() {
    cy_ = Math.cos(cam.yaw); sy_ = Math.sin(cam.yaw); cp_ = Math.cos(cam.pitch); sp_ = Math.sin(cam.pitch);
    F = Math.min(W, H * 1.25) * (mobile ? 0.95 : 0.8);
  }
  function proj(x, y, z, o) {
    x -= cam.tx; y -= cam.ty;
    var x1 = x * cy_ - z * sy_, z1 = x * sy_ + z * cy_;
    var y1 = y * cp_ - z1 * sp_, z2 = y * sp_ + z1 * cp_;
    var d = z2 + cam.dist; if (d < 0.3) d = 0.3;
    var k = F / d;
    o.x = W * cam.ox + x1 * k; o.y = H * 0.5 + y1 * k; o.k = k / F * cam.dist; o.d = d;
    return o;
  }
  function depthA(o) { return Math.max(0.12, Math.min(1, 1.55 - (o.d - cam.dist) * 0.42 - 0.45)); }
  // atenuación detrás de la columna de texto (izquierda en desktop, todo en mobile)
  function textMask(x, y) {
    var m;
    if (mobile) m = 0.6;
    else { var t = (x / W - 0.18) / 0.42; t = t < 0 ? 0 : t > 1 ? 1 : t; m = 0.16 + 0.84 * t * t * (3 - 2 * t); }
    return 1 + (m - 1) * cam.side;
  }

  var tmp = { x: 0, y: 0, k: 0, d: 0 }, P = [];
  function qbez(a, c, b, t) { var u = 1 - t; return u * u * a + 2 * u * t * c + t * t * b; }

  function draw(time, dt) {
    stats.frames++;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var GA = cam.a * (1 + 0.5 * cam.side);
    if (GA < 0.01) return;
    prep();
    var i, n, o, e, A, B, C = { x: 0, y: 0 };
    for (i = 0; i < nodes.length; i++) { n = nodes[i]; P[i] = proj(n.x, n.y, n.z, P[i] || {}); }
    // aristas curvas (control proyectado)
    ctx.lineWidth = 1;
    for (i = 0; i < edges.length; i++) {
      e = edges[i]; A = P[e.a]; B = P[e.b];
      proj(e.cx, e.cy, e.cz, tmp);
      var al = 0.2 * Math.min(depthA(A), depthA(B)) * GA * textMask((A.x + B.x) / 2) * (e.flow ? 1 : 0.6);
      if (al < 0.006) continue;
      ctx.strokeStyle = rgba(COL[nodes[e.flow ? e.b : e.a].s], al);
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.quadraticCurveTo(2 * tmp.x - (A.x + B.x) / 2, 2 * tmp.y - (A.y + B.y) / 2, B.x, B.y); ctx.stroke();
    }
    ctx.globalCompositeOperation = 'lighter';
    // paquetes en 3D sobre la curva
    for (i = packets.length - 1; i >= 0; i--) {
      var p = packets[i]; p.t += p.v * dt; e = p.e;
      if (p.t >= 1) {
        nodes[e.b].hot = RM ? 0.3 : 1;
        var nx = edges.filter(function (x) { return x.flow && x.a === e.b; });
        if (nx.length) { p.e = nx[(Math.random() * nx.length) | 0]; p.t = 0; } else { packets.splice(i, 1); if (packets.length < 60) spawn(false); }
        continue;
      }
      A = nodes[e.a]; B = nodes[e.b];
      proj(qbez(A.x, e.cx, B.x, p.t), qbez(A.y, e.cy, B.y, p.t), qbez(A.z, e.cz, B.z, p.t), tmp);
      var pa = depthA(tmp) * GA * textMask(tmp.x), sz = 14 * tmp.k;
      if (pa < 0.02) continue;
      ctx.globalAlpha = Math.min(1, pa * 0.9);
      ctx.drawImage(sprites[p.t < 0.5 ? A.s : B.s], tmp.x - sz, tmp.y - sz, sz * 2, sz * 2);
    }
    // nodos: orden por profundidad (lejos primero); profundidad de campo = más grande/suave y tenue lejos
    var ord = P.map(function (q, j) { return j; }).sort(function (a, b) { return P[b].d - P[a].d; });
    ctx.font = '500 11px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace';
    for (var j = 0; j < ord.length; j++) {
      i = ord[j]; n = nodes[i]; o = P[i];
      n.hot = Math.max(0, n.hot - dt * (RM ? 0.5 : 1.4));
      var da = depthA(o), m = textMask(o.x) * GA, pulse = 0.5 + 0.5 * Math.sin(time * (RM ? 0.0006 : 0.0015) + n.ph);
      var blur = Math.max(0, o.d - cam.dist + 0.3) * 1.4; // lejos y muy cerca = desenfocado
      var rad = n.r * o.k * (1 + blur * 0.6);
      var g = rad * (4 + pulse * 1.5 + n.hot * 5);
      ctx.globalAlpha = Math.min(1, (0.35 + n.hot * 0.5) * da * m);
      ctx.drawImage(sprites[n.s], o.x - g, o.y - g, g * 2, g * 2);
      ctx.globalAlpha = Math.min(1, (0.8 + n.hot * 0.2) * da * m / (1 + blur));
      ctx.drawImage(sprites[n.s], o.x - rad * 1.6, o.y - rad * 1.6, rad * 3.2, rad * 3.2);
      if (n.label && !mobile) {
        var la = da * da * m * (0.55 + n.hot * 0.45);
        if (la > 0.04) { ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = Math.min(1, la); ctx.fillStyle = rgba(COL[n.s], 1); ctx.fillText(n.label, o.x + rad + 8, o.y - rad - 4); ctx.globalCompositeOperation = 'lighter'; }
      }
    }
    // eventos: una alerta dispara -> onda + ráfaga de paquetes
    nextEvt -= dt;
    if (nextEvt <= 0) {
      nextEvt = rnd(4, 7) * (RM ? 2 : 1);
      var outs = nodes.filter(function (q) { return q.s === 2; }), al2 = outs[outs.length - 1];
      var tgt = Math.random() < 0.5 ? nodes.indexOf(al2) : nodes.indexOf(outs[(Math.random() * outs.length) | 0]);
      nodes[tgt].hot = RM ? 0.4 : 1;
      ripples.push({ n: tgt, t: 0 });
      if (!RM) for (var b = 0; b < 5; b++) spawn(false);
    }
    for (i = ripples.length - 1; i >= 0; i--) {
      var rp = ripples[i]; rp.t += dt * (RM ? 0.35 : 0.7);
      if (rp.t >= 1) { ripples.splice(i, 1); continue; }
      o = P[rp.n];
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = (1 - rp.t) * (RM ? 0.25 : 0.6) * GA * textMask(o.x);
      ctx.strokeStyle = rgba(COL[2], 1); ctx.lineWidth = 1.5;
      for (var w = 0; w < 2; w++) { var rt = rp.t - w * 0.18; if (rt > 0) { ctx.beginPath(); ctx.arc(o.x, o.y, 6 + rt * 110 * o.k, 0, 6.283); ctx.stroke(); } }
      ctx.globalCompositeOperation = 'lighter';
    }
    // partículas de brillo cerca del puntero (desktop)
    for (i = sparks.length - 1; i >= 0; i--) {
      var sp = sparks[i]; sp.l -= dt;
      if (sp.l <= 0) { sparks.splice(i, 1); continue; }
      sp.x += sp.vx * dt; sp.y += sp.vy * dt;
      var ss = 6 * sp.l + 2;
      ctx.globalAlpha = sp.l * 0.7;
      ctx.drawImage(sprites[sp.c], sp.x - ss, sp.y - ss, ss * 2, ss * 2);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }

  // ---- foco según la sección activa (deck: .is-on; scroll normal: la que cruza el centro)
  function activeSection() {
    if (root.classList.contains('deck')) { for (var i = 0; i < sections.length; i++) if (sections[i].classList.contains('is-on')) return sections[i]; }
    var mid = H * 0.45;
    for (var j = 0; j < sections.length; j++) { var r = sections[j].getBoundingClientRect(); if (r.top <= mid && r.bottom > mid) return sections[j]; }
    return sections[0];
  }
  function updateGoal() {
    var s = activeSection(), f = s === hero || !s ? -1 : (FOCUS[s.id] != null ? FOCUS[s.id] : 1);
    stats.focus = f;
    if (f < 0) { goal.tx = 0; goal.ty = 0; goal.dist = mobile ? 4.6 : 3.9; goal.ox = mobile ? 0.5 : 0.62; goal.a = 1; goal.side = 1; }
    else { goal.tx = (f - 1) * 1.75; goal.ty = 0; goal.dist = mobile ? 3.6 : 2.9; goal.ox = mobile ? 0.5 : 0.72; goal.a = mobile ? 0.3 : 0.36; goal.side = 0; }
  }

  function step(dt) {
    var k = 1 - Math.pow(RM ? 0.25 : 0.12, dt); // suavizado exponencial independiente del fps
    cam.tx += (goal.tx - cam.tx) * k; cam.ty += (goal.ty - cam.ty) * k; cam.dist += (goal.dist - cam.dist) * k;
    cam.ox += (goal.ox - cam.ox) * k; cam.a += (goal.a - cam.a) * k; cam.side += (goal.side - cam.side) * k;
    if (!drag) {
      cam.yaw += (RM ? 0.03 : 0.09) * dt + vyaw * dt;
      vyaw *= Math.pow(0.08, dt); vpitch *= Math.pow(0.08, dt);
      cam.pitch += vpitch * dt + (-0.28 - cam.pitch) * (1 - Math.pow(0.6, dt));
    }
    cam.pitch = Math.max(-1.1, Math.min(0.9, cam.pitch));
  }

  function loop(t) {
    raf = 0;
    if (!running) return;
    var dt = Math.min(0.05, last ? (t - last) / 1000 : 0.016);
    frame++;
    // fuera del hero basta con ~30fps: el fondo es sutil y ahorra batería
    if (cam.side < 0.5 && !drag && frame % 2 && sparks.length === 0) { raf = requestAnimationFrame(loop); return; }
    last = t;
    if (frame % 8 === 0) updateGoal();
    step(dt);
    draw(t, dt);
    raf = requestAnimationFrame(loop);
  }
  function start() {
    var go = !document.hidden;
    if (go && !running) { running = true; last = 0; raf = requestAnimationFrame(loop); }
    else if (!go && running) { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
  }
  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = window.innerWidth, h = window.innerHeight, wasMobile = mobile;
    if (w === W && Math.abs(h - H) < 120 && cv.width) { H = h; cv.height = Math.round(H * dpr); return; }
    W = w; H = h; mobile = W < 820;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    if (wasMobile !== mobile || !nodes.length) build();
  }

  function init() {
    document.body.insertBefore(cv, document.body.firstChild);
    makeSprites(); size(); updateGoal();
    cam.tx = goal.tx; cam.dist = goal.dist; cam.ox = goal.ox; cam.a = goal.a; cam.side = goal.side;
    draw(0, 0);
    requestAnimationFrame(function () { cv.classList.add('is-on'); });
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { size(); updateGoal(); }, 150); }, { passive: true });
    document.addEventListener('visibilitychange', start);
    // órbita con arrastre (mouse/touch) sobre el hero, sin capturar clicks en links/botones
    if (!RM && hero) {
      hero.addEventListener('pointerdown', function (e) {
        if (e.target.closest('a,button,input,textarea,.term')) return;
        drag = { x: e.clientX, y: e.clientY, id: e.pointerId, t: performance.now(), touch: e.pointerType !== 'mouse' };
      });
      window.addEventListener('pointermove', function (e) {
        if (drag && e.pointerId === drag.id) {
          var dx = e.clientX - drag.x, dy = e.clientY - drag.y, now = performance.now(), ddt = Math.max(0.008, (now - drag.t) / 1000);
          if (drag.touch && Math.abs(dy) > Math.abs(dx) * 1.2) return; // en touch el gesto vertical sigue siendo scroll
          cam.yaw += dx * 0.006; cam.pitch += dy * 0.004;
          vyaw = Math.max(-3, Math.min(3, dx * 0.006 / ddt)); vpitch = Math.max(-2, Math.min(2, dy * 0.004 / ddt));
          drag.x = e.clientX; drag.y = e.clientY; drag.t = now;
        }
      }, { passive: true });
      var end = function () { drag = null; };
      window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end);
    }
    if (FINE && !RM) window.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var dx = e.clientX - pxm, dy = e.clientY - pym; pxm = e.clientX; pym = e.clientY;
      if (sparks.length < 40 && dx * dx + dy * dy > 30) sparks.push({ x: pxm, y: pym, vx: rnd(-20, 20) - dx * 0.4, vy: rnd(-30, 5) - dy * 0.4, l: rnd(0.5, 0.9), c: (Math.random() * 3) | 0 });
      // suave inclinación de la cámara hacia el puntero
      if (!drag) vyaw += (e.clientX / W - 0.5) * 0.02;
    }, { passive: true });
    window.addEventListener('scroll', updateGoal, { passive: true, capture: true });
    start();
  }
  // arrancar después del primer render para no competir con el LCP
  var kick = function () { (window.requestIdleCallback || function (f) { setTimeout(f, 60); })(init, { timeout: 900 }); };
  if (document.readyState === 'complete') kick(); else window.addEventListener('load', kick, { once: true });
})();
