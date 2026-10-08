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
  function setLang(l) {
    root.setAttribute('data-lang', l);
    root.setAttribute('lang', l);
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

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var sections = Array.prototype.slice.call(document.querySelectorAll('main > section'));
  var main = document.getElementById('main');
  var idx = 0;
  var lock = false;
  var dots = document.createElement('nav');
  dots.className = 'deck-dots';
  dots.setAttribute('aria-label', 'Sections');
  sections.forEach(function (section, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.addEventListener('click', function () { show(i); });
    dots.appendChild(b);
  });
  document.body.appendChild(dots);
  function labelDots() {
    var buttons = dots.querySelectorAll('button');
    sections.forEach(function (section, i) {
      var head = section.querySelector('h1, h2');
      buttons[i].setAttribute('aria-label', head ? head.innerText.replace(/\s+/g, ' ').trim() : 'Section');
    });
  }
  function show(i) {
    if (!sections.length) return;
    idx = Math.max(0, Math.min(sections.length - 1, i));
    sections.forEach(function (section, n) { section.classList.toggle('is-on', n === idx); });
    sections[idx].scrollTop = 0;
    var id = sections[idx].id || 'top';
    var hash = '#' + id;
    if (location.hash !== hash) history.replaceState(null, '', hash);
    document.querySelectorAll('.nav__links a').forEach(function (a) {
      a.classList.toggle('is-on', a.getAttribute('href') === '#' + sections[idx].id);
    });
    dots.querySelectorAll('button').forEach(function (b, n) { b.classList.toggle('is-on', n === idx); });
    var bar = document.querySelector('.fx-bar');
    if (bar) bar.style.width = ((idx + 1) / sections.length * 100) + '%';
  }
  function atEdge(el, dir) {
    if (dir > 0) return el.scrollTop + el.clientHeight >= el.scrollHeight - 4;
    return el.scrollTop <= 0;
  }
  function step(dir) {
    if (lock) return;
    if (!atEdge(sections[idx], dir)) return;
    if (idx + dir < 0 || idx + dir >= sections.length) return;
    lock = true;
    window.setTimeout(function () { lock = false; }, 650);
    show(idx + dir);
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1) || 'top';
    var i = (id === 'top') ? 0 : sections.findIndex(function (s) { return s.id === id; });
    if (i < 0) return;
    e.preventDefault();
    show(i);
  });
  if (main) {
    main.addEventListener('wheel', function (e) {
      var dir = e.deltaY > 0 ? 1 : -1;
      if (!atEdge(sections[idx], dir)) return;
      if (idx + dir < 0 || idx + dir >= sections.length) return;
      e.preventDefault();
      step(dir);
    }, { passive: false });
    var touchY = 0;
    main.addEventListener('touchstart', function (e) { touchY = e.changedTouches[0].clientY; }, { passive: true });
    main.addEventListener('touchend', function (e) {
      var dy = e.changedTouches[0].clientY - touchY;
      if (Math.abs(dy) < 48) return;
      step(dy < 0 ? 1 : -1);
    }, { passive: true });
  }
  document.addEventListener('keydown', function (e) {
    var tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      e.preventDefault();
      if (atEdge(sections[idx], 1)) step(1);
      else sections[idx].scrollBy({ top: e.key === 'PageDown' ? sections[idx].clientHeight * 0.85 : 120 });
    }
    if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      if (atEdge(sections[idx], -1)) step(-1);
      else sections[idx].scrollBy({ top: e.key === 'PageUp' ? -sections[idx].clientHeight * 0.85 : -120 });
    }
    if (e.key === 'Home') { e.preventDefault(); show(0); }
    if (e.key === 'End') { e.preventDefault(); show(sections.length - 1); }
  });
  root.classList.add('deck');
  labelDots();
  if (toggle) toggle.addEventListener('click', function () { window.setTimeout(labelDots, 0); });
  if (!reduce) {
    var bar = document.createElement('div');
    bar.className = 'fx-bar';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    if (window.matchMedia('(pointer: fine)').matches) {
      window.addEventListener('pointermove', function (e) {
        root.style.setProperty('--mx', e.clientX + 'px');
        root.style.setProperty('--my', e.clientY + 'px');
      }, { passive: true });
    }
  }
  var start = (location.hash || '#top').slice(1);
  var startIndex = start === 'top' ? 0 : sections.findIndex(function (s) { return s.id === start; });
  show(startIndex < 0 ? 0 : startIndex);
})();
