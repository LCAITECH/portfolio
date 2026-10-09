// LCA ITECH portfolio — idioma, menú mobile y animaciones (sin dependencias)
(function () {
  var root = document.documentElement;
  root.classList.add('js');

  // ---- Idioma: ?lang=es|en > localStorage > idioma del navegador > en
  var KEY = 'lca-lang';
  function pick() {
    var q = new URLSearchParams(location.search).get('lang');
    if (q === 'es' || q === 'en') return q;
    try { var s = localStorage.getItem(KEY); if (s === 'es' || s === 'en') return s; } catch (e) {}
    return (navigator.language || 'en').toLowerCase().indexOf('es') === 0 ? 'es' : 'en';
  }
  // <title> y meta description: el inglés se lee del HTML; el español vive acá.
  var descMeta = document.querySelector('meta[name="description"]');
  var META = {
    en: { title: document.title, desc: descMeta ? descMeta.getAttribute('content') : '' },
    es: {
      title: 'Leandro Buchter · LCA ITECH — Cripto + IA + APIs + Automatización + Cloud',
      desc: 'Leandro Buchter (LCA ITECH): construyo plataformas de datos cripto, bots de Telegram, agentes de IA, APIs y automatizaciones — de punta a punta, desde la fuente de datos hasta el deploy. Buenos Aires, Argentina.'
    }
  };
  function setLang(l) {
    root.setAttribute('data-lang', l);
    root.setAttribute('lang', l);
    document.title = META[l].title;
    if (descMeta) descMeta.setAttribute('content', META[l].desc);
    try { localStorage.setItem(KEY, l); } catch (e) {}
  }
  setLang(pick());
  var toggle = document.getElementById('langToggle');
  if (toggle) toggle.addEventListener('click', function () {
    setLang(root.getAttribute('data-lang') === 'es' ? 'en' : 'es');
  });

  // ---- Menú mobile
  var burger = document.getElementById('burger');
  var links = document.getElementById('navLinks');
  function close() { links.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
  if (burger && links) {
    burger.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.addEventListener('click', function (e) { if (e.target.closest('a')) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  // ---- Animación al hacer scroll
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // Al imprimir, cargar ya las imágenes diferidas (loading="lazy").
  window.addEventListener('beforeprint', function () {
    document.querySelectorAll('img[loading="lazy"]').forEach(function (img) { img.loading = 'eager'; });
  });

  // ---- Modo "una sección por pantalla": solo desktop con mouse/trackpad.
  // En mobile/tablet/touch y sin JS: scroll normal con todas las secciones visibles.
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var deckMQ = window.matchMedia('(min-width: 1025px) and (hover: hover) and (pointer: fine)');
  var sections = Array.prototype.slice.call(document.querySelectorAll('main > section'));
  var main = document.getElementById('main');
  var idx = 0;
  var deck = false;
  var QUIET = 250;          // ms sin eventos de rueda = gesto nuevo
  var lastWheel = 0;
  var wheelBlocked = false; // tras un salto, bloquear hasta que la rueda quede quieta
  var gesture = { dir: 0, edge: false };
  var bar = null;

  function indexOf(id) {
    if (!id || id === 'top') return 0;
    for (var i = 0; i < sections.length; i++) if (sections[i].id === id) return i;
    return -1;
  }
  function atEdge(el, dir) {
    if (dir > 0) return el.scrollTop + el.clientHeight >= el.scrollHeight - 4;
    return el.scrollTop <= 0;
  }

  var dots = document.createElement('nav');
  dots.className = 'deck-dots';
  dots.setAttribute('aria-label', 'Sections');
  sections.forEach(function (section, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.addEventListener('click', function () { go(i); });
    dots.appendChild(b);
  });
  document.body.appendChild(dots);

  function labelDots() {
    var lang = root.getAttribute('data-lang') || 'en';
    var buttons = dots.querySelectorAll('button');
    dots.setAttribute('aria-label', lang === 'es' ? 'Secciones' : 'Sections');
    sections.forEach(function (section, i) {
      var head = section.querySelector('h1, h2');
      var text = '';
      if (head) {
        var parts = head.querySelectorAll('[lang="' + lang + '"]');
        text = parts.length ? Array.prototype.map.call(parts, function (n) { return n.textContent; }).join(' ') : head.textContent;
      }
      buttons[i].setAttribute('aria-label', text.replace(/\s+/g, ' ').trim() || (lang === 'es' ? 'Sección' : 'Section'));
    });
  }

  function mark() {
    var id = sections[idx] ? sections[idx].id : '';
    document.querySelectorAll('.nav__links a').forEach(function (a) {
      a.classList.toggle('is-on', !!id && a.getAttribute('href') === '#' + id);
    });
    dots.querySelectorAll('button').forEach(function (b, n) {
      b.classList.toggle('is-on', n === idx);
      if (n === idx) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
    });
  }

  // Muestra la sección i (solo modo deck). fromBottom: al volver hacia atrás, abrir desde abajo.
  function show(i, fromBottom) {
    if (!sections.length) return;
    idx = Math.max(0, Math.min(sections.length - 1, i));
    sections.forEach(function (section, n) { section.classList.toggle('is-on', n === idx); });
    var cur = sections[idx];
    cur.scrollTop = fromBottom ? cur.scrollHeight : 0;
    var hash = '#' + (cur.id || 'top');
    if (location.hash !== hash) history.replaceState(null, '', hash);
    mark();
    if (bar) bar.style.width = ((idx + 1) / sections.length * 100) + '%';
  }
  // Navegación explícita (menú, puntos, hash): en deck muestra; en scroll normal, scrollea.
  function go(i) {
    if (i < 0) return;
    if (deck) { show(i); return; }
    idx = i;
    var target = i === 0 ? document.getElementById('top') : sections[i];
    if (target) target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    var hash = '#' + (sections[i].id || 'top');
    if (location.hash !== hash) history.replaceState(null, '', hash);
  }
  function step(dir) {
    var n = idx + dir;
    if (n < 0 || n >= sections.length) return false;
    show(n, dir < 0);
    return true;
  }

  // Sección más cercana al tope de la ventana (para pasar de scroll normal a deck).
  function nearest() {
    var best = 0, bestD = Infinity;
    sections.forEach(function (s, i) {
      var d = Math.abs(s.getBoundingClientRect().top - 70);
      if (d < bestD) { bestD = d; best = i; }
    });
    return best;
  }

  function apply() {
    var want = deckMQ.matches;
    if (want === deck) return;
    if (want) {
      var start = location.hash ? indexOf(location.hash.slice(1)) : nearest();
      root.classList.add('deck');
      deck = true;
      window.scrollTo(0, 0);
      show(start < 0 ? 0 : start);
    } else {
      var keep = idx;
      root.classList.remove('deck');
      deck = false;
      sections.forEach(function (s) { s.scrollTop = 0; });
      if (keep > 0 && sections[keep]) sections[keep].scrollIntoView({ block: 'start' });
      progress();
    }
  }

  // Links internos (#...): en deck se manejan acá; en scroll normal, el navegador.
  document.addEventListener('click', function (e) {
    if (!deck) return;
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var i = indexOf(a.getAttribute('href').slice(1));
    if (i < 0) return;
    e.preventDefault();
    show(i);
  });
  window.addEventListener('hashchange', function () {
    var i = indexOf(location.hash.slice(1));
    if (i < 0) return;
    if (deck) { if (i !== idx) show(i); }
    else idx = i;
  });

  if (main) {
    // Rueda / trackpad: pasa de sección solo si el gesto EMPEZÓ en el borde,
    // y después de un salto exige ~250 ms de quietud (anti-inercia).
    main.addEventListener('wheel', function (e) {
      if (!deck || e.ctrlKey) return;
      var dy = e.deltaY;
      if (!dy) return;
      var now = (window.performance && performance.now()) || Date.now();
      var dir = dy > 0 ? 1 : -1;
      var quiet = now - lastWheel > QUIET;
      lastWheel = now;
      var cur = sections[idx];
      if (wheelBlocked) {
        if (!quiet) { e.preventDefault(); return; }
        wheelBlocked = false;
      }
      if (quiet || dir !== gesture.dir) gesture = { dir: dir, edge: atEdge(cur, dir) };
      if (!atEdge(cur, dir)) return;           // todavía hay contenido: scroll nativo
      e.preventDefault();
      if (!gesture.edge) return;               // llegó al borde en este gesto: frenar acá
      if (step(dir)) wheelBlocked = true;
    }, { passive: false });

    // Pantallas táctiles con puntero fino (laptops híbridas) en modo deck.
    var t0 = 0, tEdge = { up: false, down: false };
    main.addEventListener('touchstart', function (e) {
      if (!deck) return;
      t0 = e.changedTouches[0].clientY;
      var cur = sections[idx];
      tEdge = { up: atEdge(cur, -1), down: atEdge(cur, 1) };
    }, { passive: true });
    main.addEventListener('touchend', function (e) {
      if (!deck) return;
      var dy = e.changedTouches[0].clientY - t0;
      if (Math.abs(dy) < 48) return;
      if (dy < 0 && tEdge.down) step(1);
      if (dy > 0 && tEdge.up) step(-1);
    }, { passive: true });
  }

  document.addEventListener('keydown', function (e) {
    if (!deck || e.altKey || e.ctrlKey || e.metaKey) return;
    var t = e.target || {};
    var tag = t.tagName || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable) return;
    var cur = sections[idx];
    var page = cur.clientHeight * 0.85;
    var down = e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey);
    var up = e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey);
    if (e.key === ' ' && (tag === 'BUTTON' || tag === 'A' || tag === 'SUMMARY')) return;
    if (down || up) {
      var dir = down ? 1 : -1;
      e.preventDefault();
      if (atEdge(cur, dir)) { if (!e.repeat) step(dir); }
      else cur.scrollBy({ top: dir * (e.key === 'ArrowDown' || e.key === 'ArrowUp' ? 120 : page) });
    }
    if (e.key === 'Home') { e.preventDefault(); show(0); }
    if (e.key === 'End') { e.preventDefault(); show(sections.length - 1); }
  });

  // Barra de progreso: en deck = sección actual; en scroll normal = scroll de la página.
  var ticking = false;
  function progress() {
    if (!bar || deck) return;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (max > 0 ? Math.min(100, window.scrollY / max * 100) : 0) + '%';
  }
  if (!reduce) {
    bar = document.createElement('div');
    bar.className = 'fx-bar';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    window.addEventListener('scroll', function () {
      if (deck || ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () { ticking = false; progress(); });
    }, { passive: true });
    // Luz que sigue al mouse: elemento propio (no variables en :root, que recalcularían los
    // estilos de toda la página) y una sola actualización por frame.
    var glow = document.createElement('div');
    glow.className = 'fx-glow';
    glow.setAttribute('aria-hidden', 'true');
    document.body.appendChild(glow);
    if (window.matchMedia('(pointer: fine)').matches) {
      var gx = 0, gy = 0, glowTick = false;
      window.addEventListener('pointermove', function (e) {
        gx = e.clientX; gy = e.clientY;
        if (glowTick) return;
        glowTick = true;
        window.requestAnimationFrame(function () {
          glowTick = false;
          glow.style.setProperty('--mx', gx + 'px');
          glow.style.setProperty('--my', gy + 'px');
        });
      }, { passive: true });
    }
  }

  labelDots();
  if (toggle) toggle.addEventListener('click', function () { window.setTimeout(labelDots, 0); });
  var first = indexOf((location.hash || '#top').slice(1));
  idx = first < 0 ? 0 : first;
  apply();
  if (!deck) progress();
  if (deckMQ.addEventListener) deckMQ.addEventListener('change', apply);
  else if (deckMQ.addListener) deckMQ.addListener(apply);
})();
