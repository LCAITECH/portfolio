// Formulario de contacto: validación + envío AJAX a FormSubmit (sin secretos).
(function () {
  var f = document.getElementById('contactForm');
  if (!f) return;
  var root = document.documentElement;
  var lang = function () { return root.getAttribute('data-lang') === 'es' ? 'es' : 'en'; };
  var T = {
    en: { req: 'Required.', email: 'Enter a valid email.', link: 'Enter a web, X or LinkedIn link.', need: 'Please add a bit more detail (20+ characters).', consent: 'Please accept to continue.', sending: 'Sending…', ok: 'Thanks! Your inquiry was sent. I will review it and reply by email.', err: 'Could not send right now. Please email itech.lca@gmail.com instead.', fix: 'Please check the highlighted fields.' },
    es: { req: 'Obligatorio.', email: 'Ingresá un email válido.', link: 'Ingresá un link web, de X o LinkedIn.', need: 'Contame un poco más (20+ caracteres).', consent: 'Aceptá para continuar.', sending: 'Enviando…', ok: '¡Gracias! Tu consulta se envió. La reviso y te respondo por email.', err: 'No se pudo enviar ahora. Escribime a itech.lca@gmail.com.', fix: 'Revisá los campos marcados.' }
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
    setErr(el, m);
    return !m;
  }
  var req = ['cfName', 'cfEmail', 'cfCompany', 'cfLink', 'cfNeed', 'cfConsent'].map(function (id) { return document.getElementById(id); });
  req.forEach(function (el) {
    el.addEventListener(el.type === 'checkbox' ? 'change' : 'blur', function () { if (el.value || el.type === 'checkbox' || el.hasAttribute('aria-invalid')) check(el); });
  });
  function show(kind, msg) { status.hidden = false; status.className = 'cf__status ' + kind; status.textContent = msg; }

  f.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var t = T[lang()];
    var bad = req.filter(function (el) { return !check(el); });
    if (bad.length) { show('err', t.fix); bad[0].focus(); return; }
    if (f.elements._honey.value) { show('ok', t.ok); f.reset(); return; } // bot
    var d = {};
    new FormData(f).forEach(function (v, k) { if (k !== '_honey') d[k] = String(v).trim(); });
    d._subject = 'Portfolio lead: ' + d.name + ' (' + (d.package || 'no package') + ')';
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
