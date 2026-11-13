// Armador de proyectos (#builder): asistente de 4 pasos (qué querés → módulos → plataforma y cerebro → resumen).
// Sin servidor. Guarda SOLO las elecciones del armador en localStorage (nada personal).
// Regla de precios: solo muestran número los módulos con precio publicado en el sitio (S1–S3 y P0–P8 "desde");
// todo lo demás es "a cotizar".
(function () {
  var arm = document.getElementById('arm');
  if (!arm) return;
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var KEY = 'lca-armador';
  var L = function () { return root.getAttribute('data-lang') === 'es' ? 'es' : 'en'; };
  var tx = function (o) { return o ? o[L()] : ''; };
  var $ = function (id) { return document.getElementById(id); };
  var nojs = document.querySelector('.arm__nojs');
  if (nojs) nojs.hidden = true;
  arm.hidden = false;

  // ---------- Datos ----------
  var CATS = [
    { id: 'community', ico: '💬', skin: 'phone', pk: 'S1–S3 · P3',
      n: { en: 'Bot for your community', es: 'Bot para tu comunidad' },
      d: { en: 'Telegram or Discord: FAQ, price alerts, moderation, onboarding and VIP access.', es: 'Telegram o Discord: preguntas frecuentes, alertas, moderación, onboarding y accesos VIP.' },
      head: { en: 'LCA Demo Community', es: 'LCA Demo Community' }, sub: { en: 'group · bot online', es: 'grupo · bot online' },
      plat: ['telegram'], brain: 'fixed' },
    { id: 'business', ico: '⚙️', skin: 'screen', pk: 'P0 · P6',
      n: { en: 'Automate your business', es: 'Automatizar tu negocio' },
      d: { en: 'Emails, Google Sheets, automatic reports and WhatsApp answers, without manual work.', es: 'Mails, Google Sheets, reportes automáticos y respuestas por WhatsApp, sin trabajo manual.' },
      head: { en: 'Your business panel', es: 'Panel de tu negocio' }, plat: ['telegram'], brain: 'basic' },
    { id: 'assistant', ico: '🧠', skin: 'phone', pk: 'P4 · P7',
      n: { en: 'AI assistant', es: 'Asistente con IA' },
      d: { en: 'Answers from your documents, remembers context and works on several channels.', es: 'Responde desde tus documentos, recuerda el contexto y funciona en varios canales.' },
      head: { en: 'AI Assistant', es: 'Asistente IA' }, sub: { en: 'bot · online', es: 'bot · online' },
      plat: ['telegram', 'discord'], brain: 'basic' },
    { id: 'dashboard', ico: '📈', skin: 'screen', pk: 'P2 · S2 · P8',
      n: { en: 'Crypto dashboard', es: 'Dashboard cripto' },
      d: { en: 'Market data, wallets you follow and alerts to Telegram, on your own web dashboard.', es: 'Datos de mercado, wallets que seguís y alertas a Telegram, en tu propio dashboard web.' },
      head: { en: 'Crypto dashboard', es: 'Dashboard cripto' }, plat: ['web', 'telegram'], brain: 'fixed' }
  ];
  // t: s = S1–S3 (rango y combo) · p = paquete "desde" · auto = automatización (1 → P0, 2–3 → P6) · q = a cotizar
  var D = function (a, b) { return [a, b]; };
  var MODS = {
    community: [
      { id: 's1', tag: 'S1', ico: '?', t: 's', pr: [100, 150], days: D(3, 5), n: { en: 'FAQ bot', es: 'Preguntas frecuentes' }, d: { en: 'Answers how to buy, links, rules', es: 'Responde cómo comprar, links, reglas' } },
      { id: 's2', tag: 'S2', ico: '₿', t: 's', pr: [100, 150], days: D(2, 4), n: { en: 'Price alerts', es: 'Alertas de precio' }, d: { en: 'Crypto alerts at your levels', es: 'Alertas cripto en tus niveles' } },
      { id: 's3', tag: 'S3', ico: '⛨', t: 's', pr: [120, 180], days: D(4, 6), n: { en: 'Moderation', es: 'Moderación' }, d: { en: 'Deletes spam and seed-phrase scams', es: 'Borra spam y estafas de seed phrase' } },
      { id: 'onb', tag: 'P3', ico: '➜', t: 'p', from: 1200, days: D(14, 21), cf: 'P3 Onboarding & Referral', n: { en: 'Onboarding & referrals', es: 'Onboarding y referidos' }, d: { en: 'Welcome flow, referral links, UID checks', es: 'Bienvenida, links de referido, verificación de UID' } },
      { id: 'pay', tag: '+', ico: '★', t: 'q', n: { en: 'Payments & VIP access', es: 'Pagos y accesos VIP' }, d: { en: 'Access to private channels after payment', es: 'Acceso a canales privados después del pago' } }
    ],
    business: [
      { id: 'gmail', tag: 'Gmail', ico: '✉', t: 'auto', n: { en: 'Gmail: emails sorted by AI', es: 'Gmail: mails clasificados con IA' }, d: { en: 'Each email tagged and routed', es: 'Cada mail etiquetado y derivado' } },
      { id: 'sheets', tag: 'Sheets', ico: '▦', t: 'auto', n: { en: 'Google Sheets automation', es: 'Automatización de Google Sheets' }, d: { en: 'Forms and orders into your sheet', es: 'Formularios y pedidos a tu planilla' } },
      { id: 'reports', tag: '+', ico: '▤', t: 'auto', n: { en: 'Automatic reports', es: 'Reportes automáticos' }, d: { en: 'Weekly summary by email', es: 'Resumen semanal por mail' } },
      { id: 'wa', tag: '+', ico: '☏', t: 'q', n: { en: 'WhatsApp FAQ', es: 'Preguntas frecuentes por WhatsApp' }, d: { en: 'Automatic answers to common questions', es: 'Respuestas automáticas a consultas comunes' } }
    ],
    assistant: [
      { id: 'kb', tag: 'P4', ico: '📄', t: 'p', from: 1500, days: D(14, 28), cf: 'P4 AI Support Agent', n: { en: 'Knowledge base', es: 'Base de conocimiento' }, d: { en: 'Answers from your docs, with sources', es: 'Responde desde tus docs, con fuente' } },
      { id: 'mem', tag: '+', ico: '◎', t: 'q', n: { en: 'Memory', es: 'Memoria' }, d: { en: 'Remembers each user\u2019s context', es: 'Recuerda el contexto de cada usuario' } },
      { id: 'multi', tag: '+', ico: '⇄', t: 'q', n: { en: 'Multi-channel', es: 'Multicanal' }, d: { en: 'Same assistant on several channels', es: 'El mismo asistente en varios canales' } },
      { id: 'inner', tag: 'P7', ico: '⚖', t: 'p', from: 2000, days: D(14, 28), cf: 'P7 AI assistant & model strategy', n: { en: 'Internal assistant + model routing', es: 'Asistente interno + ruteo de modelos' }, d: { en: 'Cheapest model that does the job', es: 'El modelo más barato que lo resuelve' } }
    ],
    dashboard: [
      { id: 'prices', tag: 'P2', ico: '▲', t: 'p', from: 2500, days: D(21, 35), cf: 'P2 Market Data API + Dashboard', n: { en: 'Market data API + dashboard', es: 'API de datos de mercado + dashboard' }, d: { en: 'Prices and history from your sources', es: 'Precios e historial de tus fuentes' } },
      { id: 'wallets', tag: '+', ico: '◈', t: 'q', n: { en: 'Wallet tracking', es: 'Seguimiento de wallets' }, d: { en: 'Wallets you follow, with movements', es: 'Wallets que seguís, con movimientos' } },
      { id: 'alerts', tag: 'S2', ico: '🔔', t: 's', pr: [100, 150], days: D(2, 4), n: { en: 'Alerts to Telegram', es: 'Alertas a Telegram' }, d: { en: 'Price alerts at your levels', es: 'Alertas de precio en tus niveles' } },
      { id: 'signals', tag: 'P8', ico: '∿', t: 'q', dev: true, cf: 'P8 interest (in development)', n: { en: 'AI trading signals', es: 'Señales de trading con IA' }, d: { en: 'In development · paper trading', es: 'En desarrollo · paper trading' } }
    ]
  };
  var PLATS = [
    { id: 'telegram', n: 'Telegram' }, { id: 'discord', n: 'Discord' }, { id: 'whatsapp', n: 'WhatsApp' }, { id: 'web', n: 'Web' }
  ];
  var BRAINS = [
    { id: 'fixed', n: { en: 'Fixed answers', es: 'Respuestas fijas' }, d: { en: 'Commands and texts you define', es: 'Comandos y textos que vos definís' } },
    { id: 'basic', n: { en: 'Basic AI', es: 'IA básica' }, d: { en: 'Understands free-form questions', es: 'Entiende preguntas escritas libremente' } },
    { id: 'advanced', n: { en: 'Advanced AI with memory', es: 'IA avanzada con memoria' }, d: { en: 'Context, memory and tools', es: 'Contexto, memoria y herramientas' } }
  ];
  var BRAIN_RANK = { fixed: 0, basic: 1, advanced: 2 };
  var T = {
    en: { quote: 'quote', aquote: 'to be quoted', from: 'from', incl: 'included', days: 'days', weeks: 'weeks', approx: '≈',
      empty: 'Turn on a module to see it working.', bot: 'LCA Bot', typing: 'LCA Bot is typing…', deleted: 'Message deleted by the bot',
      auto1: '1 = P0 from USD 250 · 2–3 = P6 from USD 800', dev: 'in development', combo2: 'Combo of 2 modules (S1–S3): −15%', combo3: 'Community Pack S1 + S2 + S3: ~25% off',
      total: 'Estimated total', time: 'Estimated time', mods: 'Modules', plat: 'Platform', brain: 'Intelligence', plus: ' + to be quoted', tbd: ' + to be defined',
      adv: '50% upfront to start. Scope and final price agreed in writing before we begin.', note: '"From" prices in USD, as published in Services. "To be quoted": I send you the price in writing.',
      order: 'Order this project', edit: 'Edit', pick: 'Pick an option to continue', pickMod: 'Turn on at least one module', step: 'Step', of: 'of', drop: 'Drop here to turn it on',
      msg: 'Project builder', about: 'About my project: ', est: 'Estimate shown on the site: ', cat: 'Type' },
    es: { quote: 'a cotizar', aquote: 'a cotizar', from: 'desde', incl: 'incluido', days: 'días', weeks: 'semanas', approx: '≈',
      empty: 'Prendé un módulo para verlo funcionar.', bot: 'LCA Bot', typing: 'LCA Bot está escribiendo…', deleted: 'Mensaje eliminado por el bot',
      auto1: '1 = P0 desde USD 250 · 2–3 = P6 desde USD 800', dev: 'en desarrollo', combo2: 'Combo de 2 módulos (S1–S3): −15%', combo3: 'Pack Comunidad S1 + S2 + S3: ~25% menos',
      total: 'Total estimado', time: 'Tiempo estimado', mods: 'Módulos', plat: 'Plataforma', brain: 'Inteligencia', plus: ' + a cotizar', tbd: ' + a definir',
      adv: '50% de anticipo para empezar. Alcance y precio final por escrito antes de arrancar.', note: 'Precios "desde" en USD, los mismos de Servicios. "A cotizar": te paso el precio por escrito.',
      order: 'Pedir este proyecto', edit: 'Editar', pick: 'Elegí una opción para seguir', pickMod: 'Prendé al menos un módulo', step: 'Paso', of: 'de', drop: 'Soltalo acá para prenderlo',
      msg: 'Armador de proyectos', about: 'Sobre mi proyecto: ', est: 'Estimado que vi en la web: ', cat: 'Tipo' }
  };

  // ---------- Estado (solo elecciones del armador) ----------
  var S = { step: 0, cat: null, mods: { community: ['s1'], business: [], assistant: [], dashboard: [] }, plat: {}, brain: {} };
  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && saved.v === 1) {
      if (CATS.some(function (c) { return c.id === saved.cat; })) S.cat = saved.cat;
      Object.keys(S.mods).forEach(function (k) {
        if (saved.mods && Array.isArray(saved.mods[k])) S.mods[k] = saved.mods[k].filter(function (id) { return MODS[k].some(function (m) { return m.id === id; }); });
      });
      if (saved.plat && typeof saved.plat === 'object') Object.keys(saved.plat).forEach(function (k) { if (Array.isArray(saved.plat[k])) S.plat[k] = saved.plat[k].filter(function (p) { return PLATS.some(function (x) { return x.id === p; }); }); });
      if (saved.brain && typeof saved.brain === 'object') Object.keys(saved.brain).forEach(function (k) { if (BRAIN_RANK[saved.brain[k]] != null) S.brain[k] = saved.brain[k]; });
      S.step = Math.max(0, Math.min(3, saved.step | 0));
    }
  } catch (e) {}
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ v: 1, step: S.step, cat: S.cat, mods: S.mods, plat: S.plat, brain: S.brain })); } catch (e) {}
  }
  function cat() { for (var i = 0; i < CATS.length; i++) if (CATS[i].id === S.cat) return CATS[i]; return null; }
  function mod(id) { var c = S.cat; for (var i = 0; c && i < MODS[c].length; i++) if (MODS[c][i].id === id) return MODS[c][i]; return null; }
  function active() { return S.cat ? S.mods[S.cat] : []; }
  function plats() { var c = cat(); if (!c) return []; if (!S.plat[c.id] || !S.plat[c.id].length) S.plat[c.id] = c.plat.slice(); return S.plat[c.id]; }
  function brain() { var c = cat(); if (!c) return 'fixed'; return S.brain[c.id] || c.brain; }
  function platIncl(p) { var c = cat(); return !!c && c.plat.indexOf(p) >= 0; }
  function brainIncl(b) { var c = cat(); return !!c && BRAIN_RANK[b] <= BRAIN_RANK[c.brain]; }

  // ---------- Precios ----------
  function num(n) { return n.toLocaleString(L() === 'es' ? 'es-AR' : 'en-US'); }
  function r5(x) { return Math.round(x / 5) * 5; }
  function quote() {
    var ids = active(), q = { lines: [], lo: 0, hi: 0, from: false, quote: false, dlo: 0, dhi: 0, combo: '' };
    var s = [], autos = [];
    ids.forEach(function (id) {
      var m = mod(id); if (!m) return;
      if (m.t === 's') s.push(m);
      else if (m.t === 'auto') autos.push(m);
      else if (m.t === 'p') { q.lo += m.from; q.hi += m.from; q.from = true; q.dlo += m.days[0]; q.dhi += m.days[1]; q.lines.push({ m: m, txt: T[L()].from + ' USD ' + num(m.from) }); }
      else { q.quote = true; q.lines.push({ m: m, txt: (m.dev ? T[L()].dev + ' · ' : '') + T[L()].aquote, q: true }); }
    });
    if (s.length) {
      var sum = [0, 0];
      s.forEach(function (m) { sum[0] += m.pr[0]; sum[1] += m.pr[1]; q.dlo += m.days[0]; q.dhi += m.days[1]; });
      var pr = sum;
      if (s.length === 2) { pr = [r5(sum[0] * 0.85), r5(sum[1] * 0.85)]; q.combo = T[L()].combo2; }
      if (s.length === 3) { pr = [250, 350]; q.combo = T[L()].combo3; }
      q.lo += pr[0]; q.hi += pr[1]; q.sOld = s.length > 1 ? sum : null; q.sPr = pr;
      s.forEach(function (m) { q.lines.push({ m: m, txt: 'USD ' + m.pr[0] + '–' + m.pr[1] }); });
    }
    if (autos.length) {
      var p0 = autos.length === 1;
      var base = p0 ? 250 : 800;
      q.lo += base; q.hi += base; q.from = true; q.dlo += p0 ? 7 : 7; q.dhi += p0 ? 7 : 21;
      q.autoPkg = p0 ? 'P0 Starter (USD 250)' : 'P6 AI automation consulting';
      autos.forEach(function (m, i) { q.lines.push({ m: m, txt: i ? T[L()].incl + ' (P6)' : (p0 ? 'P0 · ' : 'P6 · ') + T[L()].from + ' USD ' + num(base) }); });
    }
    var order = ids.slice();
    q.lines.sort(function (a, b) { return order.indexOf(a.m.id) - order.indexOf(b.m.id); });
    plats().forEach(function (p) { if (!platIncl(p)) q.quote = true; });
    if (!brainIncl(brain())) q.quote = true;
    q.priced = q.lo > 0;
    return q;
  }
  function totalText(q) {
    var t = T[L()];
    if (!q.priced) return t.aquote.charAt(0).toUpperCase() + t.aquote.slice(1);
    if (q.quote) return t.from + ' USD ' + num(q.lo) + t.plus;
    if (q.from) return t.from + ' USD ' + num(q.lo);
    return 'USD ' + num(q.lo) + '–' + num(q.hi);
  }
  function daysText(q) {
    var t = T[L()];
    if (!q.dhi) return t.aquote;
    var s = q.dhi > 21 ? Math.round(q.dlo / 7) + '–' + Math.round(q.dhi / 7) + ' ' + t.weeks : (q.dlo === q.dhi ? q.dlo : q.dlo + '–' + q.dhi) + ' ' + t.days;
    return t.approx + ' ' + s + (q.quote ? t.tbd : '');
  }

  // ---------- Paso 1 ----------
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function renderCats() {
    var box = $('armCats'); box.innerHTML = '';
    CATS.forEach(function (c, i) {
      var lab = el('label', 'arm__cat' + (S.cat === c.id ? ' is-on' : ''));
      lab.style.setProperty('--i', i);
      var inp = el('input'); inp.type = 'radio'; inp.name = 'armCat'; inp.value = c.id; inp.checked = S.cat === c.id;
      inp.addEventListener('change', function () {
        S.cat = c.id; save(); renderCats(); updateNav();
        window.setTimeout(function () { go(1); }, reduce ? 0 : 320);
      });
      lab.appendChild(inp);
      lab.appendChild(el('span', 'arm__cico', c.ico)).setAttribute('aria-hidden', 'true');
      lab.appendChild(el('span', 'arm__cname', tx(c.n)));
      lab.appendChild(el('span', 'arm__cdesc', tx(c.d)));
      lab.appendChild(el('span', 'arm__cpk', c.pk));
      box.appendChild(lab);
    });
  }

  // ---------- Paso 2: módulos ----------
  function priceLabel(m) {
    var t = T[L()];
    if (m.t === 's') return 'USD ' + m.pr[0] + '–' + m.pr[1] + ' · ' + m.days[0] + '–' + m.days[1] + ' ' + t.days;
    if (m.t === 'p') return m.tag + ' · ' + t.from + ' USD ' + num(m.from);
    if (m.t === 'auto') return t.auto1;
    return (m.dev ? t.dev + ' · ' : '') + t.aquote;
  }
  function renderMods() {
    var box = $('armMods'); box.innerHTML = '';
    if (!S.cat) return;
    MODS[S.cat].forEach(function (m) {
      var on = active().indexOf(m.id) >= 0;
      var lab = el('label', 'bld__mod' + (on ? ' is-on' : ''));
      lab.setAttribute('data-mod', m.id);
      lab.draggable = true;
      var inp = el('input', 'bld__chk'); inp.type = 'checkbox'; inp.setAttribute('role', 'switch'); inp.value = m.id; inp.checked = on;
      inp.addEventListener('change', function () { toggle(m.id, inp.checked); });
      lab.addEventListener('dragstart', function (e) { try { e.dataTransfer.setData('text/plain', m.id); e.dataTransfer.effectAllowed = 'copy'; } catch (x) {} lab.classList.add('is-drag'); });
      lab.addEventListener('dragend', function () { lab.classList.remove('is-drag'); });
      lab.appendChild(inp);
      lab.appendChild(el('span', 'bld__ico', m.ico)).setAttribute('aria-hidden', 'true');
      var info = el('span', 'bld__info');
      info.appendChild(el('span', 'bld__name', (m.tag !== '+' ? m.tag + ' · ' : '') + tx(m.n)));
      info.appendChild(el('span', 'bld__desc', tx(m.d)));
      info.appendChild(el('span', 'bld__px' + (m.t === 'q' ? ' is-quote' : ''), priceLabel(m)));
      lab.appendChild(info);
      lab.appendChild(el('span', 'bld__sw')).setAttribute('aria-hidden', 'true');
      box.appendChild(lab);
    });
  }
  function toggle(id, on) {
    var a = active(), i = a.indexOf(id);
    if (on && i < 0) a.push(id);
    if (!on && i >= 0) a.splice(i, 1);
    save();
    var card = $('armMods').querySelector('[data-mod="' + id + '"]');
    if (card) { card.classList.toggle('is-on', on); var c = card.querySelector('input'); if (c) c.checked = on; }
    if (on) { emptyState(); play(id, reduce); } else { removeMod(id); window.setTimeout(emptyState, reduce ? 0 : 270); }
    updateNav();
  }
  var drop = $('armDrop');
  drop.addEventListener('dragover', function (e) { e.preventDefault(); drop.classList.add('is-over'); });
  drop.addEventListener('dragleave', function () { drop.classList.remove('is-over'); });
  drop.addEventListener('drop', function (e) {
    e.preventDefault(); drop.classList.remove('is-over');
    var id = ''; try { id = e.dataTransfer.getData('text/plain'); } catch (x) {}
    if (mod(id) && active().indexOf(id) < 0) toggle(id, true);
  });

  // ---------- Vista previa ----------
  var pv = $('armPv'), list = null, skin = '';
  var timers = {};
  function later(id, fn, ms) { (timers[id] = timers[id] || []).push(window.setTimeout(fn, ms)); }
  function cancel(id) { (timers[id] || []).forEach(window.clearTimeout); timers[id] = []; }
  function cancelAll() { Object.keys(timers).forEach(cancel); }
  function livePx(coin) {
    var e = document.querySelector('.live__coin[data-coin="' + coin + '"] .live__px');
    var t = e ? e.textContent.trim() : '';
    return /\d/.test(t) ? t : '';
  }
  function buildShell() {
    var c = cat(); pv.innerHTML = ''; skin = c ? c.skin : 'phone';
    if (skin === 'phone') {
      var ph = el('div', 'phone');
      var bar = el('div', 'phone__bar');
      bar.appendChild(el('span', 'phone__ava', c && c.id === 'assistant' ? 'AI' : 'LCA')).setAttribute('aria-hidden', 'true');
      var who = el('span', 'phone__who'); who.appendChild(el('b', null, c ? tx(c.head) : '')); who.appendChild(el('small', null, c ? tx(c.sub) : ''));
      bar.appendChild(who); bar.appendChild(el('span', 'live__tag', 'DEMO'));
      list = el('ol', 'phone__chat'); list.setAttribute('aria-live', 'polite');
      var inp = el('div', 'phone__input'); inp.setAttribute('aria-hidden', 'true'); inp.appendChild(el('span', null, L() === 'es' ? 'Mensaje' : 'Message')); inp.appendChild(el('i'));
      ph.appendChild(bar); ph.appendChild(list); ph.appendChild(inp); pv.appendChild(ph);
    } else {
      var sc = el('div', 'scr');
      var top = el('div', 'scr__bar');
      top.innerHTML = '<i></i><i></i><i></i>';
      top.appendChild(el('span', 'scr__ttl', c ? tx(c.head) : ''));
      top.appendChild(el('span', 'live__tag', 'DEMO'));
      list = el('ol', 'scr__body'); list.setAttribute('aria-live', 'polite');
      sc.appendChild(top); sc.appendChild(list); pv.appendChild(sc);
    }
    list.setAttribute('aria-label', L() === 'es' ? 'Vista previa (simulación)' : 'Preview (simulation)');
  }
  function hhmm() { var d = new Date(); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  function scrollDown() { if (list) list.scrollTop = list.scrollHeight; }
  function add(node, instant) {
    if (!instant) node.classList.add('is-new');
    list.appendChild(node);
    if (!instant) { void node.offsetWidth; node.classList.remove('is-new'); }
    scrollDown();
  }
  function bubble(st, id) {
    var bot = st.who === 'bot';
    var li = el('li', 'msg' + (bot ? ' msg--bot' : ' ' + (st.c || 'msg--u1')) + (st.alert ? ' msg--alert' : '') + (st.warn ? ' msg--warn' : '') + (st.spam ? ' msg--spam' : ''));
    li.setAttribute('data-mod', id);
    li.appendChild(el('span', 'msg__ava', bot ? '🤖' : st.who.charAt(0))).setAttribute('aria-hidden', 'true');
    var b = el('div', 'msg__b');
    b.appendChild(el('b', 'msg__who', bot ? T[L()].bot : st.who));
    b.appendChild(el('p', null, st.text));
    if (st.btns) { var r = el('span', 'msg__btns'); st.btns.forEach(function (x) { r.appendChild(el('span', null, x)); }); b.appendChild(r); }
    b.appendChild(el('time', null, hhmm()));
    li.appendChild(b);
    return li;
  }
  function sys(st, id) { var li = el('li', 'msg msg--deleted'); li.setAttribute('data-mod', id); li.appendChild(el('p', null, st.sys)); return li; }
  function typingRow(id) {
    var li = el('li', 'msg msg--bot msg--typing'); li.setAttribute('data-mod', id); li.setAttribute('aria-label', T[L()].typing);
    li.innerHTML = '<span class="msg__ava" aria-hidden="true">🤖</span><div class="msg__b"><span class="dots" aria-hidden="true"><i></i><i></i><i></i></span></div>';
    return li;
  }
  function card(st, id) {
    var li = el('li', 'scard' + (st.k ? ' ' + st.k : ''));
    li.setAttribute('data-mod', id);
    var h = el('p', 'scard__h'); h.appendChild(el('span', 'scard__ico', st.ico)).setAttribute('aria-hidden', 'true'); h.appendChild(el('b', null, st.h)); li.appendChild(h);
    var body = el('div', 'scard__rows');
    (st.rows || []).forEach(function (r, i) { var row = el('p', 'scard__row', r); row.style.setProperty('--d', (i * 0.35 + 0.2) + 's'); body.appendChild(row); });
    if (st.tiles) { var g = el('div', 'scard__tiles'); st.tiles.forEach(function (tl, i) { var x = el('span', 'scard__tile'); x.style.setProperty('--d', (i * 0.2 + 0.2) + 's'); x.appendChild(el('b', null, tl[0])); x.appendChild(el('span', null, tl[1])); g.appendChild(x); }); body.appendChild(g); }
    if (st.bar) { var pb = el('span', 'scard__prog'); pb.appendChild(el('i')); body.appendChild(pb); }
    li.appendChild(body);
    return li;
  }
  function script(id) {
    var es = L() === 'es';
    var px = livePx('bitcoin');
    switch (id) {
      case 's1': return [
        { who: 'Ana', c: 'msg--u1', text: es ? '¿cómo compro?' : 'how do I buy?' }, { typing: 700 },
        { who: 'bot', text: es ? '¡Hola Ana! 👋 Para comprar: 1) creá tu cuenta en el exchange, 2) verificá tu identidad, 3) seguí la guía fijada con /guia. Nadie del equipo te va a pedir tu seed phrase.' : 'Hi Ana! 👋 To buy: 1) create your exchange account, 2) verify your identity, 3) follow the pinned guide with /guide. Nobody on the team will ever ask for your seed phrase.' }];
      case 's2': return [{ typing: 500 },
        { who: 'bot', alert: true, text: es ? '🔔 Alerta BTC: cruzó el nivel que configuraste' + (px ? ' · ahora ' + px + ' (dato en vivo)' : '') + '. Fuente: CoinGecko.' : '🔔 BTC alert: price crossed the level you set' + (px ? ' · now ' + px + ' (live data)' : '') + '. Source: CoinGecko.' }];
      case 's3': return [
        { who: es ? 'Soporte_Oficial' : 'Official_Support', c: 'msg--u2', spam: true, text: es ? '¡Hola! Soy del soporte 🛠 Mandame tu seed phrase por privado para verificar tu wallet 🔑' : 'Hi! I am from support 🛠 DM me your seed phrase to verify your wallet 🔑' },
        { wait: 1100 }, { del: true }, { typing: 500 },
        { who: 'bot', warn: true, text: es ? '⚠️ Borré un mensaje que pedía una seed phrase y silencié al usuario. Nunca la compartas con nadie.' : '⚠️ I deleted a message asking for a seed phrase and muted the user. Never share it with anyone.' }];
      case 'onb': return [
        { sys: es ? '👋 Leo se unió al grupo' : '👋 Leo joined the group' }, { typing: 600 },
        { who: 'bot', text: es ? '¡Bienvenido Leo! Elegí cómo empezar:' : 'Welcome Leo! Choose how to start:', btns: es ? ['📘 Guía', '🔗 Mi link de referido', '✅ Verificar UID'] : ['📘 Guide', '🔗 My referral link', '✅ Verify UID'] }];
      case 'pay': return [
        { who: 'Leo', c: 'msg--u1', text: es ? 'quiero entrar al canal VIP' : 'I want to join the VIP channel' }, { typing: 600 },
        { who: 'bot', text: es ? '⭐ Pago confirmado. Te habilité el acceso al canal VIP (demo).' : '⭐ Payment confirmed. VIP channel access granted (demo).', btns: es ? ['Entrar al VIP'] : ['Open VIP'] }];
      case 'kb': return [
        { who: 'Marta', c: 'msg--u1', text: es ? '¿Cuál es la política de devoluciones?' : 'What is the return policy?' }, { typing: 800 },
        { who: 'bot', text: es ? 'Tenés 30 días para devolver el producto sin uso, con el comprobante. 📄 Fuente: politicas.pdf, sección 4.' : 'You have 30 days to return an unused product with the receipt. 📄 Source: policies.pdf, section 4.' }];
      case 'mem': return [
        { who: 'Marta', c: 'msg--u1', text: es ? 'Hola de nuevo' : 'Hi again' }, { typing: 700 },
        { who: 'bot', text: es ? '¡Hola Marta! La última vez me consultaste por un cambio de talle. ¿Seguimos con eso? 🧠' : 'Hi Marta! Last time you asked about a size exchange. Shall we continue? 🧠' }];
      case 'multi': return [
        { sys: es ? '⇄ Misma conversación desde Telegram, WhatsApp y la web' : '⇄ Same conversation from Telegram, WhatsApp and the web' }, { typing: 500 },
        { who: 'bot', text: es ? 'Vi que empezaste por la web: sigo acá con tu consulta, sin repetir nada.' : 'You started on the web: I continue here with your question, no need to repeat.' }];
      case 'inner': return [
        { who: es ? 'Equipo' : 'Team', c: 'msg--u2', text: es ? 'Resumime este contrato en 5 puntos' : 'Summarize this contract in 5 points' }, { typing: 800 },
        { who: 'bot', text: es ? '⚖ Mandé la consulta al modelo más barato que la resuelve bien. Acá van los 5 puntos…' : '⚖ I sent this to the cheapest model that handles it well. Here are the 5 points…' }];
      case 'gmail': return [{ card: { ico: '✉', h: 'Gmail', rows: es ? ['Nuevo mail: "Quiero un presupuesto"', '→ clasificado con IA: Ventas ✓', '→ derivado a ventas@ y respondido con plantilla'] : ['New email: "I want a quote"', '→ sorted by AI: Sales ✓', '→ routed to sales@ and answered with a template'] } }];
      case 'sheets': return [{ card: { ico: '▦', h: 'Google Sheets', k: 'scard--sheet', rows: es ? ['+ fila: Cliente A · Pedido web · Nuevo', '+ fila: Cliente B · Formulario · En curso', '+ fila: Cliente C · Mail · Respondido'] : ['+ row: Client A · Web order · New', '+ row: Client B · Form · In progress', '+ row: Client C · Email · Answered'] } }];
      case 'reports': return [{ card: { ico: '▤', h: es ? 'Reporte semanal' : 'Weekly report', bar: true, rows: es ? ['Generando el resumen de la semana…', '✓ Enviado por mail los lunes a las 9:00'] : ['Building the weekly summary…', '✓ Emailed every Monday at 9:00'] } }];
      case 'wa': return [{ card: { ico: '☏', h: 'WhatsApp', k: 'scard--chat', rows: es ? ['Cliente: "¿Hasta qué hora atienden?"', 'Bot: "De lunes a viernes de 9 a 18. ¿Te ayudo con algo más?"'] : ['Customer: "What are your opening hours?"', 'Bot: "Monday to Friday, 9 to 18. Anything else?"'] } }];
      case 'prices': return [{ card: { ico: '▲', h: es ? 'Mercado' : 'Market', tiles: [['BTC', livePx('bitcoin') || (es ? 'en vivo' : 'live')], ['ETH', livePx('ethereum') || (es ? 'en vivo' : 'live')], ['SOL', livePx('solana') || (es ? 'en vivo' : 'live')]], rows: [es ? 'Fuente: CoinGecko · API REST propia' : 'Source: CoinGecko · your own REST API'] } }];
      case 'wallets': return [{ card: { ico: '◈', h: es ? 'Wallets' : 'Wallets', rows: es ? ['0x7a3…f19 · vigilada', '→ movimiento detectado: salida a un exchange'] : ['0x7a3…f19 · watched', '→ movement detected: transfer to an exchange'] } }];
      case 'alerts': return [{ card: { ico: '🔔', h: es ? 'Alerta enviada a Telegram' : 'Alert sent to Telegram', k: 'scard--alert', rows: [es ? 'BTC cruzó el nivel que configuraste' + (px ? ' · ' + px : '') : 'BTC crossed the level you set' + (px ? ' · ' + px : '')] } }];
      case 'signals': return [{ card: { ico: '∿', h: es ? 'Señal (en desarrollo)' : 'Signal (in development)', k: 'scard--dev', rows: es ? ['Paper trading: entrada, stop y take profit', 'con la justificación de la IA. La ejecución la decidís vos.'] : ['Paper trading: entry, stop and take profit', 'with the AI reasoning. You decide on execution.'] } }];
    }
    return [];
  }
  function deleteSpam(id, instant) {
    var spam = list.querySelector('.msg--spam[data-mod="' + id + '"]');
    if (!spam) return;
    function swap() { spam.className = 'msg msg--deleted'; spam.innerHTML = ''; spam.appendChild(el('p', null, '🗑 ' + T[L()].deleted)); }
    if (instant) { swap(); return; }
    spam.classList.add('is-deleting');
    later(id, swap, 550);
  }
  function play(id, instant) {
    if (!list) return;
    var at = 0;
    script(id).forEach(function (st) {
      var make = st.card ? function () { return card(st.card, id); } : st.sys ? function () { return sys(st, id); } : st.text ? function () { return bubble(st, id); } : null;
      if (instant) {
        if (make) add(make(), true); else if (st.del) deleteSpam(id, true);
        return;
      }
      if (st.wait) { at += st.wait; return; }
      if (st.typing) {
        var row;
        later(id, function () { row = typingRow(id); add(row); }, at);
        at += st.typing;
        later(id, function () { if (row && row.parentNode) row.parentNode.removeChild(row); }, at);
        return;
      }
      if (st.del) { later(id, function () { deleteSpam(id); }, at); at += 600; return; }
      if (make) { later(id, function () { add(make()); }, at); at += 350; }
    });
    if (instant) Array.prototype.forEach.call(list.querySelectorAll('[data-mod="' + id + '"]'), function (n) { n.classList.add('is-static'); });
  }
  function removeMod(id) {
    cancel(id);
    if (!list) return;
    Array.prototype.forEach.call(list.querySelectorAll('[data-mod="' + id + '"]'), function (li) {
      if (reduce) { li.parentNode.removeChild(li); return; }
      li.classList.add('is-gone');
      window.setTimeout(function () { if (li.parentNode) li.parentNode.removeChild(li); }, 260);
    });
  }
  function emptyState() {
    if (!list) return;
    var e = list.querySelector('.msg--empty');
    if (active().length) { if (e) e.parentNode.removeChild(e); return; }
    if (!e) { e = el('li', 'msg msg--empty'); list.appendChild(e); }
    e.textContent = T[L()].empty;
  }
  function renderPreview() {
    cancelAll(); buildShell();
    active().forEach(function (id) { play(id, true); });
    emptyState();
  }

  // ---------- Paso 3 ----------
  function tagIncl(on) { return on ? T[L()].incl : T[L()].quote; }
  function renderPlat() {
    var box = $('armPlat'); box.innerHTML = '';
    PLATS.forEach(function (p) {
      var on = plats().indexOf(p.id) >= 0;
      var lab = el('label', 'arm__chip' + (on ? ' is-on' : ''));
      var inp = el('input'); inp.type = 'checkbox'; inp.value = p.id; inp.checked = on;
      inp.addEventListener('change', function () {
        var a = plats(), i = a.indexOf(p.id);
        if (inp.checked && i < 0) a.push(p.id);
        if (!inp.checked && i >= 0) { if (a.length === 1) { inp.checked = true; return; } a.splice(i, 1); }
        lab.classList.toggle('is-on', inp.checked); save(); updateNav();
      });
      lab.appendChild(inp);
      lab.appendChild(el('b', null, p.n));
      lab.appendChild(el('small', platIncl(p.id) ? 'is-incl' : 'is-quote', tagIncl(platIncl(p.id))));
      box.appendChild(lab);
    });
    var bb = $('armBrain'); bb.innerHTML = '';
    BRAINS.forEach(function (b, i) {
      var on = brain() === b.id;
      var lab = el('label', 'arm__brain' + (on ? ' is-on' : ''));
      lab.style.setProperty('--lvl', i + 1);
      var inp = el('input'); inp.type = 'radio'; inp.name = 'armBrain'; inp.value = b.id; inp.checked = on;
      inp.addEventListener('change', function () {
        S.brain[S.cat] = b.id; save();
        Array.prototype.forEach.call(bb.children, function (c) { c.classList.toggle('is-on', c.querySelector('input').checked); });
        updateNav();
      });
      lab.appendChild(inp);
      var meter = el('span', 'arm__meter'); meter.setAttribute('aria-hidden', 'true'); meter.innerHTML = '<i></i><i></i><i></i>';
      lab.appendChild(meter);
      lab.appendChild(el('b', null, tx(b.n)));
      lab.appendChild(el('span', 'arm__bdesc', tx(b.d)));
      lab.appendChild(el('small', brainIncl(b.id) ? 'is-incl' : 'is-quote', tagIncl(brainIncl(b.id))));
      bb.appendChild(lab);
    });
  }

  // ---------- Paso 4 ----------
  var shownLo = 0, anim = 0;
  function renderSum() {
    var box = $('armSum'); box.innerHTML = '';
    var c = cat(); if (!c) return;
    var q = quote(), t = T[L()];
    var wrap = el('div', 'arm__sumgrid');
    var left = el('div', 'arm__sumlist');
    function row(k, v, cls, go) {
      var r = el('div', 'arm__row' + (cls ? ' ' + cls : ''));
      r.appendChild(el('span', 'arm__k', k)); r.appendChild(el('span', 'arm__v', v));
      if (go != null) { var e = el('button', 'arm__edit', t.edit); e.type = 'button'; e.addEventListener('click', function () { go_(go); }); r.appendChild(e); }
      left.appendChild(r);
    }
    row(t.cat, c.ico + ' ' + tx(c.n), '', 0);
    q.lines.forEach(function (ln, i) { row(i ? '' : t.mods, ln.m.tag + (ln.m.tag !== '+' ? ' · ' : ' ') + tx(ln.m.n) + ' — ' + ln.txt, ln.q ? 'is-quote' : '', i ? null : 1); });
    row(t.plat, plats().map(function (p) { var n = PLATS.filter(function (x) { return x.id === p; })[0].n; return n + ' (' + tagIncl(platIncl(p)) + ')'; }).join(' · '), '', 2);
    var b = BRAINS.filter(function (x) { return x.id === brain(); })[0];
    row(t.brain, tx(b.n) + ' (' + tagIncl(brainIncl(b.id)) + ')', '', 2);
    var right = el('div', 'arm__total');
    right.appendChild(el('p', 'bld__title', t.total));
    var sum = el('p', 'bld__sum');
    if (q.sOld && !q.from && !q.quote) sum.appendChild(el('s', 'bld__old', 'USD ' + q.sOld[0] + '–' + q.sOld[1]));
    var price = el('b', 'bld__price', totalText(q)); sum.appendChild(price); right.appendChild(sum);
    if (q.combo) right.appendChild(el('p', 'bld__save is-on', q.combo));
    right.appendChild(el('p', 'arm__days', t.time + ': ' + daysText(q)));
    right.appendChild(el('p', 'arm__adv', '💳 ' + t.adv));
    right.appendChild(el('p', 'bld__hint', t.note));
    var a = el('a', 'btn btn--primary arm__order', t.order); a.href = '#contact'; a.id = 'armOrder';
    a.addEventListener('click', order);
    right.appendChild(a);
    wrap.appendChild(left); wrap.appendChild(right); box.appendChild(wrap);
    // contador animado del número principal
    if (!reduce && q.priced) {
      var target = q.lo, from = Math.min(shownLo, target), t0 = 0, label = totalText(q), first = String(num(q.lo));
      window.cancelAnimationFrame(anim);
      price.classList.add('is-bump');
      (function tick(ts) {
        anim = window.requestAnimationFrame(function (now) {
          if (!t0) t0 = now;
          var k = Math.min(1, (now - t0) / 600), e = 1 - Math.pow(1 - k, 3);
          price.textContent = label.replace(first, num(Math.round(from + (target - from) * e)));
          if (k < 1) tick(); else price.textContent = label;
        });
      })();
    }
    shownLo = q.lo;
  }

  // ---------- Pedido → formulario de contacto ----------
  var lastPrefill = '';
  function order(e) {
    var q = quote(), t = T[L()], c = cat();
    var ids = active();
    var sOnly = ids.length && ids.every(function (id) { return mod(id).t === 's'; }) && S.cat === 'community';
    var pkgVal = 'Custom project (project builder)';
    if (sOnly) pkgVal = ids.length === 3 ? 'Pack Comunidad S1+S2+S3 (USD 250-350)' : ids.length === 2 ? 'Combo 2 modules (S1-S3, -15%)' : { s1: 'S1 Telegram FAQ bot', s2: 'S2 Price alert bot', s3: 'S3 Moderation bot' }[ids[0]];
    else if (!q.quote) {
      var pk = ids.map(function (id) { return mod(id).cf || (mod(id).t === 'auto' ? q.autoPkg : null); }).filter(Boolean);
      var uniq = pk.filter(function (v, i) { return pk.indexOf(v) === i; });
      if (uniq.length === 1 && pk.length === ids.length) pkgVal = uniq[0];
    }
    var bud = !q.priced ? 'Not sure' : q.lo < 500 ? '<500 USD' : q.lo < 1500 ? '500-1500 USD' : q.lo < 3000 ? '1500-3000 USD' : '3000+ USD';
    function setSel(id, v) {
      var sel = $(id); if (!sel) return;
      sel.value = v; sel.dispatchEvent(new Event('change', { bubbles: true }));
      sel.classList.remove('is-prefilled'); void sel.offsetWidth; sel.classList.add('is-prefilled');
    }
    setSel('cfPkg', pkgVal); setSel('cfBudget', bud);
    var need = $('cfNeed');
    if (need && (!need.value.trim() || need.value === lastPrefill)) {
      var b = BRAINS.filter(function (x) { return x.id === brain(); })[0];
      lastPrefill = t.msg + ' · ' + tx(c.n) + '\n'
        + t.mods + ': ' + q.lines.map(function (ln) { return (ln.m.tag !== '+' ? ln.m.tag + ' ' : '') + tx(ln.m.n) + ' (' + ln.txt + ')'; }).join(', ') + '\n'
        + t.plat + ': ' + plats().map(function (p) { return PLATS.filter(function (x) { return x.id === p; })[0].n; }).join(', ') + '\n'
        + t.brain + ': ' + tx(b.n) + '\n'
        + t.est + totalText(q) + ' · ' + daysText(q) + '\n'
        + t.about;
      need.value = lastPrefill;
    }
    var deck = root.classList.contains('deck');
    var form = $('contactForm');
    if (!deck && form) {
      e.preventDefault();
      form.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      if (location.hash !== '#contact') history.replaceState(null, '', '#contact');
    }
    window.setTimeout(function () {
      if (deck && form) form.scrollIntoView({ block: 'start' });
      if (need) { try { need.focus({ preventScroll: true }); } catch (x) { need.focus(); } need.setSelectionRange(need.value.length, need.value.length); }
    }, deck ? 30 : 450);
  }

  // ---------- Navegación entre pasos ----------
  var steps = Array.prototype.slice.call(arm.querySelectorAll('.arm__step'));
  var pbtn = Array.prototype.slice.call(arm.querySelectorAll('.arm__pstep'));
  function maxStep() { return !S.cat ? 0 : !active().length ? 1 : 3; }
  function updateNav() {
    var t = T[L()], mx = maxStep();
    $('armBack').hidden = S.step === 0;
    var next = $('armNext');
    next.hidden = S.step === 3;
    var ok = S.step < mx;
    next.disabled = !ok;
    next.title = ok ? '' : S.step === 0 ? t.pick : t.pickMod;
    pbtn.forEach(function (b, i) {
      b.disabled = i > mx;
      b.classList.toggle('is-on', i === S.step);
      b.classList.toggle('is-done', i < S.step);
      if (i === S.step) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    $('armBar').style.width = ((S.step + 1) / 4 * 100) + '%';
  }
  function enter(i) {
    if (i === 0) renderCats();
    if (i === 1) { renderMods(); renderPreview(); }
    if (i === 2) renderPlat();
    if (i === 3) renderSum();
  }
  function go_(i) {
    i = Math.max(0, Math.min(maxStep(), i));
    var dir = i >= S.step ? 1 : -1;
    S.step = i; save();
    steps.forEach(function (s, n) {
      var on = n === i;
      s.hidden = !on;
      s.classList.remove('is-in', 'is-back');
      if (on && !reduce) { void s.offsetWidth; s.classList.add(dir > 0 ? 'is-in' : 'is-back'); }
    });
    enter(i);
    updateNav();
    $('armLive').textContent = T[L()].step + ' ' + (i + 1) + ' ' + T[L()].of + ' 4';
    var r = arm.getBoundingClientRect();
    if (r.top < 0) arm.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }
  var go = go_;
  $('armNext').addEventListener('click', function () { go(S.step + 1); });
  $('armBack').addEventListener('click', function () { go(S.step - 1); });
  pbtn.forEach(function (b) { b.addEventListener('click', function () { go(+b.getAttribute('data-go')); }); });
  $('armReset').addEventListener('click', function () {
    try { localStorage.removeItem(KEY); } catch (e) {}
    S = { step: 0, cat: null, mods: { community: ['s1'], business: [], assistant: [], dashboard: [] }, plat: {}, brain: {} };
    go(0);
  });

  // Estado inicial (retoma lo guardado) y cambio de idioma
  S.step = Math.min(S.step, maxStep());
  steps.forEach(function (s, n) { s.hidden = n !== S.step; });
  enter(S.step);
  updateNav();
  new MutationObserver(function () { enter(S.step); updateNav(); }).observe(root, { attributes: true, attributeFilter: ['data-lang'] });
})();
