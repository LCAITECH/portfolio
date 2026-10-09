// LCA ITECH — asistente virtual del portfolio (chat widget). Vanilla JS, sin dependencias.
// Backend: https://github.com/LCAITECH/lcaitech-assistant
(function () {
  'use strict';
  const ASSISTANT_API = 'https://asistente.lcaitech.com';
  const API = (window.LCA_ASSISTANT_API || ASSISTANT_API).replace(/\/+$/, '');
  const MAX_CHARS = 800;
  const SEND_HISTORY = 12;
  const STORE = 'lca-asst-v1';
  const root = document.documentElement;

  const T = {
    es: {
      fab: 'Asistente IA', open: 'Abrir el asistente virtual', close: 'Cerrar el asistente', reset: 'Nueva conversación',
      title: 'Asistente de Leandro', sub: 'IA · servicios, proyectos y contacto', subOff: 'Sin conexión · acá tenés sus contactos',
      welcome: '¡Hola! 👋 Soy el asistente virtual de Leandro (LCA ITECH). Te cuento sobre sus servicios, proyectos y experiencia, o cómo contratarlo. ¿En qué te ayudo?',
      chips: ['¿Qué servicios ofrece Leandro?', '¿Cuánto cuesta un bot de Telegram para mi comunidad?', '¿Qué es ATH Intelligence?', '¿Cómo lo contrato?'],
      placeholder: 'Escribí tu pregunta…', label: 'Tu mensaje', send: 'Enviar', typing: 'El asistente está escribiendo…',
      disclaimer: 'IA: puede equivocarse. No es asesoramiento financiero.',
      offline: 'El asistente no está disponible en este momento. Podés contactar a Leandro directamente:',
      error: 'No me pude conectar. Probá de nuevo en un rato o escribile a Leandro:',
      tooLong: 'Tu mensaje es muy largo (máximo ' + MAX_CHARS + ' caracteres).',
      slow: 'Está tardando un poco más de lo normal…',
      cut: '(La respuesta se cortó. Si necesitás más detalle, escribile a Leandro.)',
      contacts: 'Contacto',
    },
    en: {
      fab: 'AI assistant', open: 'Open the virtual assistant', close: 'Close the assistant', reset: 'New conversation',
      title: "Leandro's assistant", sub: 'AI · services, projects and contact', subOff: 'Offline · here are his contacts',
      welcome: "Hi! 👋 I'm Leandro's virtual assistant (LCA ITECH). Ask me about his services, projects and experience, or how to hire him.",
      chips: ['What services does Leandro offer?', 'How much is a Telegram bot for my community?', 'What is ATH Intelligence?', 'How do I hire him?'],
      placeholder: 'Type your question…', label: 'Your message', send: 'Send', typing: 'The assistant is typing…',
      disclaimer: 'AI: it can make mistakes. Not financial advice.',
      offline: "The assistant isn't available right now. You can contact Leandro directly:",
      error: "I couldn't connect. Please try again later or reach Leandro:",
      tooLong: 'Your message is too long (max ' + MAX_CHARS + ' characters).',
      slow: 'This is taking a bit longer than usual…',
      cut: '(The answer was cut short. For more detail, reach Leandro.)',
      contacts: 'Contact',
    },
  };
  const CONTACTS = [
    ['Email', 'mailto:itech.lca@gmail.com'],
    ['LinkedIn', 'https://www.linkedin.com/in/leandrobuchter'],
    ['X @LCA_ITECH', 'https://x.com/LCA_ITECH'],
    ['Telegram bot', 'https://t.me/lcaitech_demo_bot'],
    ['GitHub', 'https://github.com/LCAITECH'],
  ];

  const lang = () => (root.getAttribute('data-lang') === 'es' ? 'es' : 'en');
  const t = (k) => T[lang()][k];

  // ---------- estado ----------
  let state = { msgs: [], open: false };
  try { const s = JSON.parse(sessionStorage.getItem(STORE) || 'null'); if (s && Array.isArray(s.msgs)) state = s; } catch (e) {}
  const save = () => { try { sessionStorage.setItem(STORE, JSON.stringify({ msgs: state.msgs.slice(-30), open: state.open })); } catch (e) {} };
  let busy = false;
  let online = null; // null = sin chequear
  let lastFocus = null;

  // ---------- DOM helpers ----------
  const el = (tag, attrs, kids) => {
    const n = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'text') n.textContent = attrs[k];
      else if (attrs[k] !== false && attrs[k] != null) n.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
    }
    (kids || []).forEach((c) => c && n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
    return n;
  };
  const svg = (paths) => {
    const ns = 'http://www.w3.org/2000/svg';
    const s = document.createElementNS(ns, 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor');
    s.setAttribute('stroke-width', '2'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round');
    s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false');
    paths.forEach((d) => { const p = document.createElementNS(ns, 'path'); p.setAttribute('d', d); s.appendChild(p); });
    return s;
  };
  const ICON_CHAT = ['M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12z', 'M8.5 12h.01M12 12h.01M15.5 12h.01'];
  const ICON_X = ['M18 6 6 18', 'M6 6l12 12'];
  const ICON_RESET = ['M3 12a9 9 0 1 0 3-6.7', 'M3 4v5h5'];
  const ICON_SEND = ['M22 2 11 13', 'M22 2 15 22l-4-9-9-4 20-7z'];

  // Texto seguro con **negrita**, viñetas "- ", links y emails (sin innerHTML).
  const LINK_RE = /(https?:\/\/[^\s<>()]+[^\s<>().,;:!?'"]|[\w.+-]+@[\w-]+\.[\w.-]*\w|\*\*[^*]+\*\*)/g;
  function inline(parent, text) {
    let last = 0; let m;
    LINK_RE.lastIndex = 0;
    while ((m = LINK_RE.exec(text))) {
      if (m.index > last) parent.appendChild(document.createTextNode(text.slice(last, m.index)));
      const tok = m[0];
      if (tok.startsWith('**')) parent.appendChild(el('strong', { text: tok.slice(2, -2) }));
      else if (tok.includes('@') && !tok.startsWith('http')) parent.appendChild(el('a', { href: 'mailto:' + tok, text: tok }));
      else parent.appendChild(el('a', { href: tok, target: '_blank', rel: 'noopener noreferrer', text: tok.replace(/^https?:\/\//, '') }));
      last = m.index + tok.length;
    }
    if (last < text.length) parent.appendChild(document.createTextNode(text.slice(last)));
  }
  function rich(text) {
    const frag = document.createDocumentFragment();
    let ul = null;
    text.split(/\n/).forEach((line) => {
      const li = line.match(/^\s*(?:[-•*]|\d+[.)])\s+(.*)$/);
      if (li) {
        if (!ul) { ul = el('ul'); frag.appendChild(ul); }
        const item = el('li'); inline(item, li[1]); ul.appendChild(item);
      } else if (line.trim()) {
        ul = null; const p = el('p'); inline(p, line); frag.appendChild(p);
      }
    });
    return frag;
  }

  // ---------- UI ----------
  const fabLabel = el('span', { class: 'asst-fab__label' });
  const fab = el('button', { class: 'asst-fab', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'asst-panel' },
    [svg(ICON_CHAT), fabLabel, el('span', { class: 'asst-fab__dot', 'aria-hidden': 'true' })]);
  const title = el('h2', { class: 'asst-title', id: 'asst-title' });
  const subTxt = el('span');
  const sub = el('p', { class: 'asst-sub' }, [el('i', { 'aria-hidden': 'true' }), subTxt]);
  const btnReset = el('button', { class: 'asst-icon', type: 'button' }, [svg(ICON_RESET)]);
  const btnClose = el('button', { class: 'asst-icon', type: 'button' }, [svg(ICON_X)]);
  const head = el('div', { class: 'asst-head' }, [
    el('img', { src: 'assets/lca-logo.webp', alt: '', width: '36', height: '36' }),
    el('div', { class: 'asst-head__txt' }, [title, sub]), btnReset, btnClose,
  ]);
  const log = el('div', { class: 'asst-log', role: 'log', 'aria-live': 'polite', 'aria-relevant': 'additions', tabindex: '0' });
  const inputLabel = el('label', { class: 'asst-sr', for: 'asst-input' });
  const input = el('textarea', { class: 'asst-input', id: 'asst-input', rows: '1', maxlength: String(MAX_CHARS), autocomplete: 'off', enterkeyhint: 'send' });
  const btnSend = el('button', { class: 'asst-send', type: 'submit' }, [svg(ICON_SEND)]);
  const form = el('form', { class: 'asst-form', novalidate: true }, [inputLabel, input, btnSend]);
  const disclaimer = el('span');
  const counter = el('span', { class: 'asst-count', 'aria-hidden': 'true' });
  const foot = el('div', { class: 'asst-foot' }, [disclaimer, counter]);
  const panel = el('div', { class: 'asst-panel', id: 'asst-panel', role: 'dialog', 'aria-labelledby': 'asst-title', hidden: true }, [head, log, form, foot]);
  const wrap = el('div', { class: 'asst', id: 'lca-assistant' }, [panel, fab]);
  document.body.appendChild(wrap);

  const mobileMQ = window.matchMedia('(max-width: 640px)');

  function labels() {
    fabLabel.textContent = t('fab');
    fab.setAttribute('aria-label', t('open'));
    title.textContent = t('title');
    subTxt.textContent = online === false ? t('subOff') : t('sub');
    btnReset.setAttribute('aria-label', t('reset')); btnReset.title = t('reset');
    btnClose.setAttribute('aria-label', t('close')); btnClose.title = t('close');
    inputLabel.textContent = t('label');
    input.placeholder = t('placeholder');
    btnSend.setAttribute('aria-label', t('send'));
    disclaimer.textContent = t('disclaimer');
    panel.setAttribute('aria-label', t('title'));
  }

  function contactsNode() {
    const box = el('div', { class: 'asst-contacts' });
    CONTACTS.forEach(([name, href]) => box.appendChild(el('a', href.startsWith('mailto:') ? { href } : { href, target: '_blank', rel: 'noopener noreferrer' }, [name === 'Email' ? 'itech.lca@gmail.com' : name])));
    return box;
  }
  function addBubble(role, text, extraNode) {
    const cls = role === 'user' ? 'asst-msg asst-msg--user' : role === 'note' ? 'asst-msg asst-msg--note' : 'asst-msg asst-msg--bot';
    const b = el('div', { class: cls });
    if (role === 'user') b.textContent = text; else b.appendChild(rich(text));
    if (extraNode) b.appendChild(extraNode);
    log.appendChild(b);
    log.scrollTop = log.scrollHeight;
    return b;
  }
  function render() {
    log.textContent = '';
    addBubble('bot', t('welcome'));
    if (!state.msgs.length) {
      const chips = el('div', { class: 'asst-chips' });
      t('chips').forEach((q) => {
        const c = el('button', { class: 'asst-chip', type: 'button', text: q });
        c.addEventListener('click', () => send(q));
        chips.appendChild(c);
      });
      log.appendChild(chips);
    }
    state.msgs.forEach((m) => addBubble(m.role === 'user' ? 'user' : 'bot', m.content));
    if (online === false) addBubble('note', t('offline'), contactsNode());
  }
  function setOnline(v) { online = v; wrap.classList.toggle('is-offline', v === false); labels(); }

  async function checkHealth() {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 6000);
    try {
      const r = await fetch(API + '/health', { signal: ctl.signal, cache: 'no-store' });
      const j = await r.json();
      setOnline(!!(r.ok && j && j.status === 'ok' && j.accepting !== false));
    } catch (e) { setOnline(false); }
    clearTimeout(timer);
    if (online === false) addBubble('note', t('offline'), contactsNode());
  }

  // ---------- abrir / cerrar ----------
  function trapOn() { return mobileMQ.matches && state.open; }
  function lock() { root.classList.toggle('asst-lock', trapOn()); root.classList.toggle('asst-open', !!state.open); panel.setAttribute('aria-modal', trapOn() ? 'true' : 'false'); }
  function open() {
    if (state.open) return;
    lastFocus = document.activeElement;
    state.open = true; save();
    panel.hidden = false; wrap.classList.add('is-open'); fab.setAttribute('aria-expanded', 'true');
    render(); lock();
    setTimeout(() => input.focus({ preventScroll: true }), 30);
    if (online === null) checkHealth();
  }
  function close() {
    if (!state.open) return;
    state.open = false; save();
    panel.hidden = true; wrap.classList.remove('is-open'); fab.setAttribute('aria-expanded', 'false');
    lock();
    (lastFocus && lastFocus !== document.body && document.contains(lastFocus) ? lastFocus : fab).focus({ preventScroll: true });
  }
  fab.addEventListener('click', open);
  btnClose.addEventListener('click', close);
  btnReset.addEventListener('click', () => { if (busy) return; state.msgs = []; save(); render(); input.focus(); });
  if (mobileMQ.addEventListener) mobileMQ.addEventListener('change', lock);

  // Teclado: Escape cierra; Tab queda dentro del panel en mobile; las teclas no llegan al modo "deck".
  wrap.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Escape' && state.open) { e.preventDefault(); close(); return; }
    if (e.key === 'Tab' && trapOn()) {
      const f = Array.prototype.filter.call(panel.querySelectorAll('button, a[href], textarea, [tabindex="0"]'), (n) => !n.disabled && n.offsetParent !== null);
      if (!f.length) return;
      const first = f[0]; const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // ---------- input ----------
  function grow() { input.style.height = 'auto'; input.style.height = Math.min(120, input.scrollHeight) + 'px'; }
  function count() {
    const n = input.value.length;
    counter.textContent = n > MAX_CHARS * 0.75 ? n + '/' + MAX_CHARS : '';
    counter.classList.toggle('is-near', n > MAX_CHARS * 0.9);
    btnSend.disabled = busy || !input.value.trim();
  }
  input.addEventListener('input', () => { grow(); count(); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : send(input.value); }
  });
  form.addEventListener('submit', (e) => { e.preventDefault(); send(input.value); });

  // ---------- enviar ----------
  function restore(text) { if (!input.value) { input.value = text; grow(); } } // para reintentar sin reescribir
  // Tiempos (el backend corta a los 12 s sin primer texto y responde con los contactos).
  const FIRST_EVENT_MS = 25000;  // sin ningún texto ni error en 25 s: abortar y mostrar contactos
  const TOTAL_MS = 45000;        // tope absoluto de una respuesta
  const SLOW_HINT_MS = 6000;     // aviso "está tardando" si todavía no hay texto

  // Lee un text/event-stream de fetch y llama onEvent(nombre, datos) por cada evento.
  async function readSSE(body, onEvent) {
    const reader = body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf('\n\n')) >= 0) {
        const block = buf.slice(0, i); buf = buf.slice(i + 2);
        let ev = 'message'; let data = '';
        block.split('\n').forEach((line) => {
          if (line.startsWith('event:')) ev = line.slice(6).trim();
          else if (line.startsWith('data:')) data += line.slice(5).trim();
        });
        if (data) { let d = null; try { d = JSON.parse(data); } catch (e) {} if (d) onEvent(ev, d); }
      }
    }
  }

  async function send(text) {
    text = (text || '').trim();
    if (!text || busy) return;
    if (text.length > MAX_CHARS) { addBubble('note', t('tooLong')); return; }
    const chips = log.querySelector('.asst-chips'); if (chips) chips.remove();
    busy = true; input.value = ''; grow(); count();
    state.msgs.push({ role: 'user', content: text }); save();
    addBubble('user', text);
    const typing = el('div', { class: 'asst-typing', role: 'status', 'aria-label': t('typing') }, [el('span'), el('span'), el('span')]);
    log.appendChild(typing); log.scrollTop = log.scrollHeight;
    const ctl = new AbortController();
    let gotFirst = false;
    const slowTimer = setTimeout(() => {
      if (!gotFirst && typing.isConnected) typing.appendChild(el('em', { class: 'asst-slow', text: t('slow') }));
    }, SLOW_HINT_MS);
    const firstTimer = setTimeout(() => { if (!gotFirst) ctl.abort(); }, FIRST_EVENT_MS);
    const totalTimer = setTimeout(() => ctl.abort(), TOTAL_MS);
    let reply = ''; let bubble = null; let failed = null; let frame = 0;
    const paint = () => {
      frame = 0;
      if (!bubble) return;
      bubble.textContent = ''; bubble.appendChild(rich(reply));
      log.scrollTop = log.scrollHeight;
    };
    const showText = () => {
      if (!gotFirst) { gotFirst = true; typing.remove(); }
      if (!bubble) { bubble = addBubble('bot', ''); bubble.setAttribute('aria-busy', 'true'); }
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const fail = (message) => {
      gotFirst = true; typing.remove();
      state.msgs.pop(); save();
      if (bubble && !reply.trim()) bubble.remove();
      addBubble('note', message || t('error'), contactsNode());
      restore(text);
    };
    try {
      const body = JSON.stringify({ lang: lang(), messages: state.msgs.slice(-SEND_HISTORY) });
      const streaming = typeof ReadableStream !== 'undefined' && typeof TextDecoder !== 'undefined';
      const r = await fetch(API + (streaming ? '/chat/stream' : '/chat'), {
        method: 'POST', signal: ctl.signal, headers: { 'Content-Type': 'application/json' }, body,
      });
      const isSSE = (r.headers.get('content-type') || '').indexOf('text/event-stream') === 0;
      if (r.ok && isSSE && r.body) {
        if (online !== true) setOnline(true);
        await readSSE(r.body, (ev, d) => {
          if (ev === 'delta' && typeof d.t === 'string') { reply += d.t; showText(); }
          else if (ev === 'replace' && typeof d.t === 'string') { reply = d.t; showText(); }
          else if (ev === 'error') { failed = d.message || t('error'); }
        });
      } else {
        let j = null; try { j = await r.json(); } catch (e) {}
        if (r.ok && j && typeof j.reply === 'string') {
          if (online !== true) setOnline(true);
          reply = j.reply; showText();
        } else if ((r.status === 429 || r.status === 400) && j && j.message) {
          gotFirst = true; typing.remove();
          state.msgs.pop(); save();               // no queda en el historial
          addBubble('note', j.message, r.status === 429 ? contactsNode() : null);
          restore(text);
          return;
        } else {
          failed = (j && j.message) || t('error');
        }
      }
      if (failed && !reply.trim()) fail(failed);
      else if (!reply.trim()) fail(t('error'));
      else { state.msgs.push({ role: 'assistant', content: reply }); save(); }
    } catch (e) {
      if (reply.trim()) {          // se cortó a mitad: queda lo recibido + aviso
        state.msgs.push({ role: 'assistant', content: reply }); save();
        addBubble('note', t('cut'), contactsNode());
      } else {
        fail(t('error'));
      }
    } finally {
      clearTimeout(slowTimer); clearTimeout(firstTimer); clearTimeout(totalTimer);
      if (frame) { cancelAnimationFrame(frame); paint(); }
      if (bubble) bubble.removeAttribute('aria-busy');
      typing.remove();
      busy = false; count();
      if (state.open) input.focus({ preventScroll: true });
    }
  }

  // ---------- idioma ----------
  new MutationObserver(() => { labels(); if (state.open && !busy) render(); }).observe(root, { attributes: true, attributeFilter: ['data-lang'] });

  // En modo "deck" (desktop) el footer queda fijo abajo: el botón se ubica arriba de él.
  const footer = document.querySelector('.footer');
  function place() {
    const deck = root.classList.contains('deck') && footer && !mobileMQ.matches;
    wrap.style.setProperty('--asst-bottom', deck ? (footer.offsetHeight + 14) + 'px' : '');
  }
  new MutationObserver(place).observe(root, { attributes: true, attributeFilter: ['class'] });
  window.addEventListener('resize', place, { passive: true });

  labels(); count(); place();
  state.open = false; // no reabrir solo al recargar; la conversación sí se conserva en la sesión
})();
