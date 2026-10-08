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
})();
