// Formulario de contacto: validación + envío AJAX a FormSubmit (sin secretos).
(function () {
  var f = document.getElementById('contactForm');
  if (!f) return;
  var root = document.documentElement;
  var lang = function () { return root.getAttribute('data-lang') === 'es' ? 'es' : 'en'; };
  var T = {
    en: { tg: 'Telegram usernames look like @name (5+ letters, numbers or _).', copied: 'Copied', copy: 'Copy', now: 'Now {t} in Buenos Aires', yours: ' · {t} for you', subject: 'Portfolio lead', auto: 'Thanks for writing! I got your inquiry and will reply in writing, in English or Spanish. — Leandro Buchter · LCA ITECH (Buenos Aires, UTC−3) · https://portfolio.lcaitech.com', req: 'Required.', email: 'Enter a valid email.', link: 'Enter a web, X or LinkedIn link.', need: 'Please add a bit more detail (20+ characters).', consent: 'Please accept to continue.', sending: 'Sending…', ok: 'Thanks! Your inquiry was sent. I will review it and reply by email.', err: 'Could not send right now. Please email itech.lca@gmail.com or message t.me/leandroLCA on Telegram.', fix: 'Please check the highlighted fields.' },
    es: { tg: 'Un usuario de Telegram se ve así: @nombre (5+ letras, números o _).', copied: 'Copiado', copy: 'Copiar', now: 'Ahora son las {t} en Buenos Aires', yours: ' · {t} para ti', subject: 'Consulta desde el portfolio', auto: '¡Gracias por escribir! Recibí tu consulta y te respondo por escrito, en español o en inglés. — Leandro Buchter · LCA ITECH (Buenos Aires, UTC−3) · https://portfolio.lcaitech.com/es/', req: 'Obligatorio.', email: 'Ingresa un email válido.', link: 'Ingresa un link web, de X o LinkedIn.', need: 'Cuéntame un poco más (20+ caracteres).', consent: 'Acepta para continuar.', sending: 'Enviando…', ok: '¡Gracias! Tu consulta se envió. La reviso y te respondo por email.', err: 'No se pudo enviar ahora. Escríbeme a itech.lca@gmail.com o por Telegram a t.me/leandroLCA.', fix: 'Revisa los campos marcados.' }
  };
  // Opciones de <select> bilingües (data-en / data-es)
  function syncOptions() {
    var l = lang();
    f.querySelectorAll('option[data-' + l + ']').forEach(function (o) { o.textContent = o.getAttribute('data-' + l); });
    var cl = document.getElementById('cfLang');
    if (cl && !cl.dataset.touched) cl.value = l === 'es' ? 'Español' : 'English';
  }
  syncOptions();
  new MutationObserver(syncOptions).observe(root, { attributes: true, attributeFilter: ['data-lang'] });
  document.getElementById('cfLang').addEventListener('change', function () { this.dataset.touched = '1'; });

  // Zona horaria del visitante (viaja oculta en el formulario) y reloj de Buenos Aires.
  var tz = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
  var tzIn = document.getElementById('cfTz');
  if (tzIn) tzIn.value = tz;
  var clock = document.getElementById('cxClock');
  function hhmm(zone) {
    try { return new Intl.DateTimeFormat(lang() === 'es' ? 'es' : 'en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: zone }).format(new Date()); }
    catch (e) { return ''; }
  }
  function tick() {
    if (!clock) return;
    var t = T[lang()], ba = hhmm('America/Argentina/Buenos_Aires');
    if (!ba) return;
    var mine = tz && hhmm(tz);
    clock.textContent = t.now.replace('{t}', ba) + (mine && mine !== ba ? t.yours.replace('{t}', mine) : '');
    clock.hidden = false;
  }
  tick();
  setInterval(tick, 30000);

  // Botón "Copiar" del email
  document.querySelectorAll('.cx__copy').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = b.getAttribute('data-copy');
      var done = function () {
        var t = T[lang()];
        b.classList.add('is-ok'); b.textContent = t.copied;
        setTimeout(function () { b.classList.remove('is-ok'); b.textContent = t.copy; }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(v).then(done, function () {});
    });
  });

  // En la versión en español, el mailto lleva el asunto en español
  var mail = f.querySelector('.cf__mail[data-subject-es]');
  if (mail && lang() === 'es') mail.href = mail.href.replace(/subject=[^&]*/, 'subject=' + mail.getAttribute('data-subject-es'));

  var status = document.getElementById('cfStatus');
  var btn = document.getElementById('cfSubmit');
  function setErr(el, msg) {
    var e = document.getElementById(el.id + 'Err');
    if (msg) { el.setAttribute('aria-invalid', 'true'); if (e) { e.textContent = msg; el.setAttribute('aria-describedby', e.id); } }
    else { el.removeAttribute('aria-invalid'); if (e) e.textContent = ''; }
  }
  function check(el) {
    var t = T[lang()], v = (el.value || '').trim(), m = '';
    if (el.type === 'checkbox') m = el.checked ? '' : t.consent;
    else if (!v) m = t.req;
    else if (el.id === 'cfEmail' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) m = t.email;
    else if (el.id === 'cfLink' && !/^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$|^@\w{1,30}$/i.test(v)) m = t.link;
    else if (el.id === 'cfNeed' && v.length < 20) m = t.need;
    else if (el.id === 'cfTg' && !/^@?[A-Za-z0-9_]{5,32}$/.test(v.replace(/^https?:\/\/t\.me\//i, ''))) m = t.tg;
    setErr(el, m);
    return !m;
  }
  var req = ['cfName', 'cfEmail', 'cfCompany', 'cfLink', 'cfNeed', 'cfConsent'].map(function (id) { return document.getElementById(id); });
  var tgIn = document.getElementById('cfTg');
  // Telegram es opcional: solo se valida si se completó
  if (tgIn) tgIn.addEventListener('blur', function () { if (tgIn.value.trim()) check(tgIn); else setErr(tgIn, ''); });
  req.forEach(function (el) {
    el.addEventListener(el.type === 'checkbox' ? 'change' : 'blur', function () { if (el.value || el.type === 'checkbox' || el.hasAttribute('aria-invalid')) check(el); });
  });
  function show(kind, msg) { status.hidden = false; status.className = 'cf__status ' + kind; status.textContent = msg; }

  f.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var t = T[lang()];
    var bad = req.filter(function (el) { return !check(el); });
    if (tgIn && tgIn.value.trim() && !check(tgIn)) bad.push(tgIn);
    if (bad.length) { show('err', t.fix); bad[0].focus(); return; }
    if (f.elements._honey.value) { show('ok', t.ok); f.reset(); return; } // bot
    var d = {};
    new FormData(f).forEach(function (v, k) { if (k !== '_honey') d[k] = String(v).trim(); });
    d._subject = t.subject + ': ' + d.name + (d.country ? ' · ' + d.country : '') + ' (' + (d.package || (lang() === 'es' ? 'sin paquete' : 'no package')) + ')';
    d._autoresponse = t.auto;
    d._replyto = d.email;
    d._template = 'table';
    d._captcha = 'false';
    d.page_language = lang();
    btn.disabled = true; show('', t.sending);
    fetch('https://formsubmit.co/ajax/itech.lca@gmail.com', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(d)
    }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (x) {
        if (x.ok && String(x.j.success) === 'true') { show('ok', t.ok); f.reset(); syncOptions(); }
        else throw new Error(x.j && x.j.message);
      })
      .catch(function () { show('err', t.err); })
      .then(function () { btn.disabled = false; });
  });
})();
