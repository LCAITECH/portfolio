// Configurador modular (#builder): módulos S1–S3 con interruptores, chat de Telegram simulado,
// precio con descuento por combo y botón que precompleta el formulario de contacto. Sin servidor.
(function () {
  var box = document.getElementById('bld');
  var chat = document.getElementById('bldChat');
  if (!box || !chat) return;
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lang = function () { return root.getAttribute('data-lang') === 'es' ? 'es' : 'en'; };
  var chks = Array.prototype.slice.call(box.querySelectorAll('.bld__chk'));
  var priceEl = document.getElementById('bldPrice');
  var oldEl = document.getElementById('bldOld');
  var saveEl = document.getElementById('bldSave');
  var order = document.getElementById('bldOrder');

  // Precios en USD [mín, máx]
  var PRICE = { s1: [100, 150], s2: [100, 150], s3: [120, 180] };
  var PACK = [250, 350];
  var NAME = {
    en: { s1: 'S1 Telegram FAQ bot', s2: 'S2 price alert bot', s3: 'S3 moderation bot' },
    es: { s1: 'S1 bot de preguntas frecuentes', s2: 'S2 bot de alertas de precio', s3: 'S3 bot de moderación' }
  };
  var T = {
    en: {
      empty: 'Turn on a module to see the bot in action.', chat: 'Demo chat (simulation)', bot: 'LCA Bot', typing: 'LCA Bot is typing…',
      deleted: 'Message deleted by the bot', save2: 'Combo of 2 modules: −15%', save3: 'Community Pack: ~25% off', none: 'Pick at least one module',
      need: 'I am interested in: ', est: 'Estimate shown on the site: ', more: '. About my community / project: '
    },
    es: {
      empty: 'Prendé un módulo para ver al bot en acción.', chat: 'Chat de demo (simulación)', bot: 'LCA Bot', typing: 'LCA Bot está escribiendo…',
      deleted: 'Mensaje eliminado por el bot', save2: 'Combo de 2 módulos: −15%', save3: 'Pack Comunidad: ~25% menos', none: 'Elegí al menos un módulo',
      need: 'Me interesa: ', est: 'Estimado que vi en la web: ', more: '. Sobre mi comunidad / proyecto: '
    }
  };

  // Precio BTC real si la demo en vivo (#live) ya lo cargó; si no, alerta sin número.
  function btc() {
    var el = document.querySelector('.live__coin[data-coin="bitcoin"] .live__px');
    var t = el ? el.textContent.trim() : '';
    return /\d/.test(t) ? t : '';
  }
  // Guion de cada módulo: pasos {who, text} | {typing} | {wait} | {del}
  function script(mod) {
    var es = lang() === 'es';
    if (mod === 's1') return [
      { who: 'Ana', c: 'msg--u1', text: es ? '¿cómo compro?' : 'how do I buy?' },
      { typing: 700 },
      { who: 'bot', text: es ? '¡Hola Ana! 👋 Para comprar: 1) creá tu cuenta en el exchange, 2) verificá tu identidad, 3) seguí la guía fijada con /guia. Nadie del equipo te va a pedir tu seed phrase.'
                             : 'Hi Ana! 👋 To buy: 1) create your exchange account, 2) verify your identity, 3) follow the pinned guide with /guide. Nobody on the team will ever ask for your seed phrase.' }
    ];
    if (mod === 's2') {
      var px = btc();
      return [
        { typing: 500 },
        { who: 'bot', alert: true, text: es
          ? '🔔 Alerta BTC: cruzó el nivel que configuraste' + (px ? ' · ahora ' + px + ' (dato en vivo)' : '') + '. Fuente: CoinGecko.'
          : '🔔 BTC alert: price crossed the level you set' + (px ? ' · now ' + px + ' (live data)' : '') + '. Source: CoinGecko.' }
      ];
    }
    return [
      { who: es ? 'Soporte_Oficial' : 'Official_Support', c: 'msg--u2', spam: true, text: es ? '¡Hola! Soy del soporte 🛠 Mandame tu seed phrase por privado para verificar tu wallet 🔑' : 'Hi! I am from support 🛠 DM me your seed phrase to verify your wallet 🔑' },
      { wait: 1100 },
      { del: true },
      { typing: 500 },
      { who: 'bot', warn: true, text: es ? '⚠️ Borré un mensaje que pedía una seed phrase y silencié al usuario. Nunca la compartas con nadie.' : '⚠️ I deleted a message asking for a seed phrase and muted the user. Never share it with anyone.' }
    ];
  }

  function hhmm() { var d = new Date(); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  function bubble(step, mod) {
    var li = document.createElement('li');
    var bot = step.who === 'bot';
    li.className = 'msg' + (bot ? ' msg--bot' : ' ' + (step.c || 'msg--u1')) + (step.alert ? ' msg--alert' : '') + (step.warn ? ' msg--warn' : '') + (step.spam ? ' msg--spam' : '');
    li.setAttribute('data-mod', mod);
    var ava = document.createElement('span');
    ava.className = 'msg__ava';
    ava.setAttribute('aria-hidden', 'true');
    ava.textContent = bot ? '🤖' : step.who.charAt(0);
    var b = document.createElement('div');
    b.className = 'msg__b';
    var n = document.createElement('b');
    n.className = 'msg__who';
    n.textContent = bot ? T[lang()].bot : step.who;
    var p = document.createElement('p');
    p.textContent = step.text;
    var t = document.createElement('time');
    t.textContent = hhmm();
    b.appendChild(n); b.appendChild(p); b.appendChild(t);
    li.appendChild(ava); li.appendChild(b);
    return li;
  }
  function typingRow(mod) {
    var li = document.createElement('li');
    li.className = 'msg msg--bot msg--typing';
    li.setAttribute('data-mod', mod);
    li.setAttribute('aria-label', T[lang()].typing);
    li.innerHTML = '<span class="msg__ava" aria-hidden="true">🤖</span><div class="msg__b"><span class="dots" aria-hidden="true"><i></i><i></i><i></i></span></div>';
    return li;
  }
  function deleteSpam(mod, instant) {
    var spam = chat.querySelector('.msg--spam[data-mod="' + mod + '"]');
    if (!spam) return;
    function swap() {
      spam.className = 'msg msg--deleted';
      spam.innerHTML = '';
      var p = document.createElement('p');
      p.textContent = '🗑 ' + T[lang()].deleted;
      spam.appendChild(p);
    }
    if (instant) { swap(); return; }
    spam.classList.add('is-deleting');
    later(mod, swap, 550);
  }
  function scrollDown() { chat.scrollTop = chat.scrollHeight; }
  function add(el, instant) {
    if (!instant) el.classList.add('is-new');
    chat.appendChild(el);
    if (!instant) { void el.offsetWidth; el.classList.remove('is-new'); }
    scrollDown();
  }

  var timers = { s1: [], s2: [], s3: [] };
  var active = []; // orden en que se prendieron
  function later(mod, fn, ms) { timers[mod].push(window.setTimeout(fn, ms)); }
  function cancel(mod) { timers[mod].forEach(window.clearTimeout); timers[mod] = []; }

  function play(mod, instant) {
    var steps = script(mod);
    var at = 0;
    steps.forEach(function (st) {
      if (instant) {
        if (st.text) add(bubble(st, mod), true);
        else if (st.del) deleteSpam(mod, true);
        return;
      }
      if (st.wait) { at += st.wait; return; }
      if (st.typing) {
        var row;
        later(mod, function () { row = typingRow(mod); add(row); }, at);
        at += st.typing;
        later(mod, function () { if (row && row.parentNode) row.parentNode.removeChild(row); }, at);
        return;
      }
      if (st.del) { later(mod, function () { deleteSpam(mod); }, at); at += 600; return; }
      later(mod, function () { add(bubble(st, mod)); }, at);
      at += 350;
    });
  }
  function removeMod(mod) {
    cancel(mod);
    Array.prototype.forEach.call(chat.querySelectorAll('[data-mod="' + mod + '"]'), function (li) {
      if (reduce) { li.parentNode.removeChild(li); return; }
      li.classList.add('is-gone');
      window.setTimeout(function () { if (li.parentNode) li.parentNode.removeChild(li); }, 260);
    });
  }
  function emptyState() {
    var e = chat.querySelector('.msg--empty');
    if (active.length) { if (e) e.parentNode.removeChild(e); return; }
    if (!e) { e = document.createElement('li'); e.className = 'msg msg--empty'; chat.appendChild(e); }
    e.textContent = T[lang()].empty;
  }
  function renderAll() {
    Object.keys(timers).forEach(cancel);
    chat.innerHTML = '';
    chat.setAttribute('aria-label', T[lang()].chat);
    active.forEach(function (m) { play(m, true); });
    emptyState();
  }

  // ---- Precio
  function r5(x) { return Math.round(x / 5) * 5; }
  function quote() {
    var mods = active.slice().sort();
    var sum = [0, 0];
    mods.forEach(function (m) { sum[0] += PRICE[m][0]; sum[1] += PRICE[m][1]; });
    var price = sum;
    if (mods.length === 2) price = [r5(sum[0] * 0.85), r5(sum[1] * 0.85)];
    if (mods.length === 3) price = PACK.slice();
    return { mods: mods, sum: sum, price: price };
  }
  var shown = [100, 150], anim = 0;
  function fmt(p) { return p[1] ? 'USD ' + p[0] + '–' + p[1] : 'USD 0'; }
  function setPrice(target, instant) {
    window.cancelAnimationFrame(anim);
    if (instant || reduce) { shown = target.slice(); priceEl.textContent = fmt(shown); return; }
    var from = shown.slice(), t0 = 0, dur = 480;
    priceEl.classList.remove('is-bump'); void priceEl.offsetWidth; priceEl.classList.add('is-bump');
    function tick(ts) {
      if (!t0) t0 = ts;
      var k = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      shown = [Math.round(from[0] + (target[0] - from[0]) * e), Math.round(from[1] + (target[1] - from[1]) * e)];
      priceEl.textContent = fmt(shown);
      if (k < 1) anim = window.requestAnimationFrame(tick);
    }
    anim = window.requestAnimationFrame(tick);
  }
  function updateTotals(instant) {
    var q = quote(), t = T[lang()], n = q.mods.length;
    setPrice(q.price, instant);
    oldEl.textContent = n >= 2 ? fmt(q.sum) : '';
    saveEl.textContent = n === 3 ? t.save3 : n === 2 ? t.save2 : n === 0 ? t.none : '';
    saveEl.className = 'bld__save' + (n >= 2 ? ' is-on' : '');
    order.classList.toggle('is-disabled', !n);
    if (!n) order.setAttribute('aria-disabled', 'true'); else order.removeAttribute('aria-disabled');
  }

  function sync(chk) {
    var mod = chk.value, card = chk.closest('.bld__mod');
    if (card) card.classList.toggle('is-on', chk.checked);
  }
  chks.forEach(function (chk) {
    sync(chk);
    if (chk.checked) active.push(chk.value);
    chk.addEventListener('change', function () {
      sync(chk);
      var mod = chk.value, i = active.indexOf(mod);
      if (chk.checked) { if (i < 0) active.push(mod); emptyState(); play(mod, reduce); }
      else { if (i >= 0) active.splice(i, 1); removeMod(mod); window.setTimeout(emptyState, reduce ? 0 : 270); }
      updateTotals();
    });
  });
  renderAll();
  updateTotals(true);
  new MutationObserver(function () { renderAll(); updateTotals(true); }).observe(root, { attributes: true, attributeFilter: ['data-lang'] });

  // ---- "Pedir este bot": precompleta paquete, presupuesto y mensaje en #contact
  var lastPrefill = '';
  order.addEventListener('click', function (e) {
    var q = quote();
    if (!q.mods.length) { e.preventDefault(); e.stopPropagation(); return; }
    var pkg = document.getElementById('cfPkg');
    var bud = document.getElementById('cfBudget');
    var need = document.getElementById('cfNeed');
    var t = T[lang()];
    var val = q.mods.length === 3 ? 'Pack Comunidad S1+S2+S3 (USD 250-350)'
      : q.mods.length === 2 ? 'Combo 2 modules (S1-S3, -15%)'
      : { s1: 'S1 Telegram FAQ bot', s2: 'S2 Price alert bot', s3: 'S3 Moderation bot' }[q.mods[0]];
    function setSel(sel, v) {
      if (!sel) return;
      sel.value = v;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      sel.classList.remove('is-prefilled'); void sel.offsetWidth; sel.classList.add('is-prefilled');
    }
    setSel(pkg, val);
    setSel(bud, '<500 USD');
    if (need && (!need.value.trim() || need.value === lastPrefill)) {
      var names = q.mods.map(function (m) { return NAME[lang()][m]; }).join(' + ');
      lastPrefill = t.need + names + ' (' + t.est + fmt(q.price) + ')' + t.more;
      need.value = lastPrefill;
    }
    var deck = root.classList.contains('deck');
    var form = document.getElementById('contactForm');
    if (!deck && form) {
      e.preventDefault();
      form.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      if (location.hash !== '#contact') history.replaceState(null, '', '#contact');
    }
    // En modo deck, script.js muestra #contact con el click; después llevamos el foco al mensaje.
    window.setTimeout(function () {
      if (deck && form) form.scrollIntoView({ block: 'start' });
      if (need) { try { need.focus({ preventScroll: true }); } catch (x) { need.focus(); } need.setSelectionRange(need.value.length, need.value.length); }
    }, deck ? 30 : 450);
  });
})();
