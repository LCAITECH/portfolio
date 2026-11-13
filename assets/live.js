/* Demo en vivo: precios (CoinGecko) + Fear & Greed (Alternative.me). Sin dependencias.
   Efectos: conteo animado de precios, flash verde/rojo al actualizar, sparklines que se dibujan,
   aguja del Fear & Greed con barrido (ease-out con leve rebote) y alertas que entran de a una.
   Con prefers-reduced-motion todo se muestra directo, sin animaciones. */
(function () {
  var sec = document.getElementById('live'); if (!sec || !window.fetch) return;
  var CG = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana&sparkline=true&price_change_percentage=24h';
  var FG = 'https://api.alternative.me/fng/?limit=1';
  var KEY = 'lca-live', TTL = 60000, wait = TTL, timer = 0, busy = false, seen = false, data = null;
  var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || sec).querySelector(s); };
  var html = document.documentElement;
  var bi = function (en, es) { return '<span lang="en">' + en + '</span><span lang="es">' + es + '</span>'; };
  var usd = function (n) { return '$' + n.toLocaleString('en-US', { maximumFractionDigits: n < 1000 ? 2 : 0, minimumFractionDigits: n < 1000 ? 2 : 0 }); };
  var pct = function (n) { return (n > 0 ? '+' : '') + n.toFixed(1) + '%'; };
  var esc = function (s) { return String(s).replace(/[<>&"]/g, ''); };
  var FGES = { 'Extreme Fear': 'Miedo extremo', Fear: 'Miedo', Neutral: 'Neutral', Greed: 'Codicia', 'Extreme Greed': 'Codicia extrema' };
  var shown = {};        // último precio mostrado por moneda (para el conteo y el flash)
  var fngShown = null;   // último valor mostrado del Fear & Greed
  var fedAt = 0;         // timestamp de los datos ya animados en el feed
  var feedTimers = [];

  function load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }
  function get(u) { return fetch(u).then(function (r) { if (!r.ok) { var e = new Error(r.status); e.code = r.status; throw e; } return r.json(); }); }

  // ---- animación genérica (rAF) con easing
  var easeOut = function (k) { return 1 - Math.pow(1 - k, 3); };
  var easeBack = function (k) { var c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); }; // leve sobrepaso
  function tween(from, to, ms, ease, step, done) {
    if (RM || from === to) { step(to); if (done) done(); return; }
    var t0 = 0;
    (function f(now) {
      if (!t0) t0 = now;
      var k = Math.min(1, (now - t0) / ms);
      step(from + (to - from) * ease(k));
      if (k < 1) window.requestAnimationFrame(f); else if (done) done();
    })(performance.now());
  }

  function spark(p) {
    var a = p.slice(-168), lo = Math.min.apply(0, a), hi = Math.max.apply(0, a), k = hi - lo || 1;
    var pts = a.map(function (v, i) { return [(i * 100 / (a.length - 1)), (27 - (v - lo) / k * 24)]; });
    var line = pts.map(function (q, i) { return (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join('');
    return { line: line, area: line + 'L100 30L0 30Z' };
  }

  // ---- Aguja: valor 0..100 → ángulo -90..+90 (rotación SVG alrededor del centro 60,62)
  var needle = $('.live__needle');
  function setNeedle(v) { if (needle) needle.setAttribute('transform', 'rotate(' + (Math.max(-2, Math.min(102, v)) * 1.8 - 90).toFixed(2) + ' 60 62)'); }
  function zoneColor(v) {
    var stops = [[0, [239, 68, 68]], [28, [249, 115, 22]], [50, [251, 191, 36]], [72, [163, 230, 53]], [100, [52, 211, 153]]];
    for (var i = 1; i < stops.length; i++) if (v <= stops[i][0]) {
      var a = stops[i - 1], b = stops[i], k = (v - a[0]) / (b[0] - a[0]);
      return 'rgb(' + a[1].map(function (c, j) { return Math.round(c + (b[1][j] - c) * k); }).join(',') + ')';
    }
    return 'rgb(52,211,153)';
  }
  function gauge(v, cl) {
    var from = fngShown == null ? 0 : fngShown;
    var txt = document.getElementById('liveFngTxt');
    var label = ' ' + bi(cl, FGES[cl] || cl);
    var col = zoneColor(v);
    sec.style.setProperty('--fng', col);
    if (fngShown === v) { setNeedle(v); txt.innerHTML = '<b style="color:' + col + '">' + v + '</b>' + label; return; }
    fngShown = v;
    tween(from, v, 1600, easeBack, setNeedle);
    tween(from, v, 1200, easeOut, function (x) { txt.innerHTML = '<b style="color:' + zoneColor(Math.max(0, Math.min(100, x))) + '">' + Math.round(x) + '</b>' + label; });
  }

  function coin(x) {
    var el = $('[data-coin="' + x.id + '"]'); if (!el) return;
    var ch = x.price_change_percentage_24h || 0, ath = x.ath_change_percentage || 0, s = x.symbol.toUpperCase();
    var pxEl = $('.live__px', el), prev = shown[x.id], now = x.current_price;
    if (prev !== now) {
      if (prev != null && !RM) {
        el.classList.remove('is-up', 'is-dn'); void el.offsetWidth;
        el.classList.add(now >= prev ? 'is-up' : 'is-dn');
      }
      tween(prev == null ? now * 0.985 : prev, now, prev == null ? 1100 : 700, easeOut, function (v) { pxEl.textContent = usd(v); });
      shown[x.id] = now;
    } else pxEl.textContent = usd(now);
    var cg = $('.live__chg', el); cg.textContent = pct(ch) + ' 24h'; cg.className = 'live__chg ' + (ch >= 0 ? 'up' : 'dn');
    $('.live__ath', el).textContent = 'ATH ' + pct(ath);
    var sp = x.sparkline_in_7d && x.sparkline_in_7d.price;
    if (sp && sp.length > 1) {
      var sv = $('.live__spark', el), d = spark(sp), up = sp[sp.length - 1] >= sp[0];
      var line = $('.live__line', sv), area = $('.live__area', sv);
      var fresh = line.getAttribute('d') !== d.line;
      line.setAttribute('d', d.line); area.setAttribute('d', d.area);
      area.setAttribute('fill', up ? 'url(#liveUp)' : 'url(#liveDn)');
      sv.setAttribute('class', 'live__spark ' + (up ? 'up' : 'dn') + (fresh && !RM ? ' is-draw' : ''));
      if (fresh && !RM) { void sv.getBoundingClientRect(); sv.classList.add('is-drawn'); }
      sv.setAttribute('aria-label', s + ' 7d ' + pct((sp[sp.length - 1] / sp[0] - 1) * 100));
    }
  }

  function feed(msgs, hm, animate) {
    var ol = document.getElementById('liveFeed');
    feedTimers.forEach(clearTimeout); feedTimers = [];
    var li = function (h) { var n = document.createElement('li'); n.innerHTML = '<p>' + h + '</p><time>' + hm + '</time>'; return n; };
    if (!animate || RM) { ol.innerHTML = ''; msgs.forEach(function (m) { ol.appendChild(li(m)); }); return; }
    ol.innerHTML = '';
    var at = 150;
    msgs.forEach(function (m) {
      var typing;
      feedTimers.push(setTimeout(function () {
        typing = document.createElement('li'); typing.className = 'live__typing'; typing.setAttribute('aria-hidden', 'true');
        typing.innerHTML = '<span class="dots"><i></i><i></i><i></i></span>';
        ol.appendChild(typing);
      }, at));
      at += 650;
      feedTimers.push(setTimeout(function () {
        if (typing && typing.parentNode) typing.parentNode.removeChild(typing);
        var n = li(m); n.className = 'is-new'; ol.appendChild(n);
        void n.offsetWidth; n.className = '';
      }, at));
      at += 260;
    });
  }

  function render() {
    if (!data) return;
    var c = data.c || [], f = data.f, msgs = [], t = new Date(data.t);
    var hm = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    c.forEach(function (x) {
      coin(x);
      var ath = x.ath_change_percentage || 0, s = x.symbol.toUpperCase();
      msgs.push('📉 ' + bi('<b>' + s + '</b> is ' + Math.abs(ath).toFixed(1) + '% below ATH (' + usd(x.ath) + ')', '<b>' + s + '</b> está ' + Math.abs(ath).toFixed(1) + '% debajo del ATH (' + usd(x.ath) + ')'));
    });
    if (c.length) {
      var m = c.slice().sort(function (a, b) { return Math.abs(b.price_change_percentage_24h) - Math.abs(a.price_change_percentage_24h); })[0];
      var mc = m.price_change_percentage_24h || 0;
      msgs.unshift((mc >= 0 ? '🚀 ' : '⚠️ ') + bi('Top 24h mover: <b>' + m.symbol.toUpperCase() + '</b> ' + pct(mc) + ' at ' + usd(m.current_price), 'Mayor movimiento 24h: <b>' + m.symbol.toUpperCase() + '</b> ' + pct(mc) + ' a ' + usd(m.current_price)));
    }
    if (f) {
      var v = Math.max(0, Math.min(100, +f.value || 0)), cl = esc(f.value_classification);
      gauge(v, cl);
      msgs.push('🧭 ' + bi('Fear &amp; Greed: <b>' + v + '</b> · ' + cl, 'Fear &amp; Greed: <b>' + v + '</b> · ' + (FGES[cl] || cl)));
    }
    feed(msgs, hm, fedAt !== data.t);
    fedAt = data.t;
    sec.classList.add('is-loaded');
    status(data.err ? bi('Live data paused · showing last values from ' + hm, 'Datos en vivo en pausa · últimos valores de las ' + hm) : bi('Live · updated ' + hm, 'En vivo · actualizado ' + hm), data.err);
  }

  function status(h, err) {
    document.getElementById('liveUpd').innerHTML = h;
    document.getElementById('liveStatus').classList.toggle('is-err', !!err);
  }

  function tick() {
    clearTimeout(timer);
    if (document.hidden || !seen) return;
    var c = load();
    if (c && Date.now() - c.t < TTL && c.c) { if (!data || data.t !== c.t) { data = c; render(); } return plan(TTL - (Date.now() - c.t) + 500); }
    if (busy) return; busy = true;
    Promise.all([get(CG), get(FG).catch(function () { return null; })]).then(function (r) {
      data = { t: Date.now(), c: r[0], f: r[1] && r[1].data && r[1].data[0] };
      try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
      wait = TTL; render();
    }).catch(function (e) {
      wait = Math.min(wait * (e.code === 429 ? 3 : 2), 600000);
      if (c && c.c) { data = c; data.err = 1; render(); }
      else status(bi('Data temporarily unavailable — retrying soon', 'Datos no disponibles por el momento — reintentando'), 1);
    }).then(function () { busy = false; plan(wait); });
  }
  function plan(ms) { clearTimeout(timer); timer = setTimeout(tick, ms); }

  // Glow que sigue al puntero dentro de la sección (solo mouse, sin reduced-motion)
  if (!RM && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    sec.addEventListener('pointermove', function (e) {
      var r = sec.getBoundingClientRect();
      sec.style.setProperty('--gx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      sec.style.setProperty('--gy', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    }, { passive: true });
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      seen = en[0].isIntersecting;
      sec.classList.toggle('is-visible', seen); // pausa las animaciones de fondo fuera de pantalla
      if (seen) tick(); else clearTimeout(timer);
    }, { rootMargin: '300px 0px' }).observe(sec);
  } else { seen = true; sec.classList.add('is-visible'); tick(); }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) tick(); });
  // Cambio de idioma: los textos son pares EN/ES, así que no hace falta volver a animar nada.
})();
