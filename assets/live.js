/* Demo en vivo: precios (CoinGecko) + Fear & Greed (Alternative.me). Sin dependencias. */
(function () {
  var sec = document.getElementById('live'); if (!sec || !window.fetch) return;
  var CG = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana&sparkline=true&price_change_percentage=24h';
  var FG = 'https://api.alternative.me/fng/?limit=1';
  var KEY = 'lca-live', TTL = 60000, wait = TTL, timer = 0, busy = false, seen = false, data = null;
  var $ = function (s, r) { return (r || sec).querySelector(s); };
  var html = document.documentElement;
  var bi = function (en, es) { return '<span lang="en">' + en + '</span><span lang="es">' + es + '</span>'; };
  var usd = function (n) { return '$' + n.toLocaleString('en-US', { maximumFractionDigits: n < 10 ? 2 : n < 1000 ? 2 : 0, minimumFractionDigits: n < 1000 ? 2 : 0 }); };
  var pct = function (n) { return (n > 0 ? '+' : '') + n.toFixed(1) + '%'; };
  var esc = function (s) { return String(s).replace(/[<>&"]/g, ''); };
  var FGES = { 'Extreme Fear': 'Miedo extremo', Fear: 'Miedo', Neutral: 'Neutral', Greed: 'Codicia', 'Extreme Greed': 'Codicia extrema' };

  function load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }
  function get(u) { return fetch(u).then(function (r) { if (!r.ok) { var e = new Error(r.status); e.code = r.status; throw e; } return r.json(); }); }

  function spark(p) {
    var a = p.slice(-168), lo = Math.min.apply(0, a), hi = Math.max.apply(0, a), k = hi - lo || 1;
    return a.map(function (v, i) { return (i ? 'L' : 'M') + (i * 100 / (a.length - 1)).toFixed(1) + ' ' + (28 - (v - lo) / k * 26).toFixed(1); }).join('');
  }

  function render() {
    if (!data) return;
    var c = data.c || [], f = data.f, msgs = [], t = new Date(data.t);
    var hm = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    c.forEach(function (x) {
      var el = $('[data-coin="' + x.id + '"]'); if (!el) return;
      var ch = x.price_change_percentage_24h || 0, ath = x.ath_change_percentage || 0, s = x.symbol.toUpperCase();
      $('.live__px', el).textContent = usd(x.current_price);
      var cg = $('.live__chg', el); cg.textContent = pct(ch) + ' 24h'; cg.className = 'live__chg ' + (ch >= 0 ? 'up' : 'dn');
      $('.live__ath', el).textContent = 'ATH ' + pct(ath);
      var sp = x.sparkline_in_7d && x.sparkline_in_7d.price;
      if (sp && sp.length > 1) {
        var sv = $('.live__spark', el); $('path', sv).setAttribute('d', spark(sp));
        sv.setAttribute('class', 'live__spark ' + (sp[sp.length - 1] >= sp[0] ? 'up' : 'dn'));
        sv.setAttribute('aria-label', s + ' 7d ' + pct((sp[sp.length - 1] / sp[0] - 1) * 100));
      }
      msgs.push('📉 ' + bi('<b>' + s + '</b> is ' + Math.abs(ath).toFixed(1) + '% below ATH (' + usd(x.ath) + ')', '<b>' + s + '</b> está ' + Math.abs(ath).toFixed(1) + '% debajo del ATH (' + usd(x.ath) + ')'));
    });
    if (c.length) {
      var m = c.slice().sort(function (a, b) { return Math.abs(b.price_change_percentage_24h) - Math.abs(a.price_change_percentage_24h); })[0];
      var mc = m.price_change_percentage_24h || 0;
      msgs.unshift((mc >= 0 ? '🚀 ' : '⚠️ ') + bi('Top 24h mover: <b>' + m.symbol.toUpperCase() + '</b> ' + pct(mc) + ' at ' + usd(m.current_price), 'Mayor movimiento 24h: <b>' + m.symbol.toUpperCase() + '</b> ' + pct(mc) + ' a ' + usd(m.current_price)));
    }
    if (f) {
      var v = +f.value, cl = esc(f.value_classification);
      $('.live__needle').setAttribute('transform', 'rotate(' + (v * 1.8 - 90) + ' 50 50)');
      $('#liveFngTxt', document).innerHTML = '<b>' + v + '</b> ' + bi(cl, FGES[cl] || cl);
      msgs.push('🧭 ' + bi('Fear &amp; Greed: <b>' + v + '</b> · ' + cl, 'Fear &amp; Greed: <b>' + v + '</b> · ' + (FGES[cl] || cl)));
    }
    document.getElementById('liveFeed').innerHTML = msgs.map(function (s) { return '<li><p>' + s + '</p><time>' + hm + '</time></li>'; }).join('');
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
    if (c && Date.now() - c.t < TTL && c.c) { data = c; render(); return plan(TTL - (Date.now() - c.t) + 500); }
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

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { seen = en[0].isIntersecting; if (seen) tick(); else clearTimeout(timer); }, { rootMargin: '300px 0px' }).observe(sec);
  } else { seen = true; tick(); }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) tick(); });
  new MutationObserver(function () { if (data) render(); }).observe(html, { attributes: true, attributeFilter: ['data-lang'] });
})();
