// Demo de bot de Twitch (streamers.html): chat simulado, comandos, moderación automática y alertas.
// Todo corre en el navegador; no se conecta a Twitch. Sin dependencias.
(function () {
  'use strict';
  var root = document.documentElement;

  // ---- Idioma (misma clave que el portfolio)
  var KEY = 'lca-lang';
  function pick() {
    var q = new URLSearchParams(location.search).get('lang');
    if (q === 'es' || q === 'en') return q;
    try { var s = localStorage.getItem(KEY); if (s === 'es' || s === 'en') return s; } catch (e) {}
    return (navigator.language || 'es').toLowerCase().indexOf('en') === 0 ? 'en' : 'es';
  }
  var TITLE = { en: 'Twitch bot demo · LCA ITECH', es: 'Demo de bot para Twitch · LCA ITECH' };
  function lang() { return root.getAttribute('data-lang') === 'en' ? 'en' : 'es'; }
  function setLang(l) {
    root.setAttribute('data-lang', l);
    root.setAttribute('lang', l);
    document.title = TITLE[l];
    try { localStorage.setItem(KEY, l); } catch (e) {}
    renderTry();
    renderList();
    input.placeholder = T('placeholder');
  }
  function T(k, a) {
    var s = STR[lang()][k];
    return typeof s === 'function' ? s(a) : s;
  }

  var STR = {
    es: {
      placeholder: 'Escribe un mensaje… (prueba !redes)',
      you: 'invitado_demo',
      link: function (u) { return 'Mensaje de ' + u + ' borrado: no se permiten links. Timeout de 10 s.'; },
      caps: function (u) { return u + ', sin tantas mayúsculas, por favor 🙂 (mensaje borrado)'; },
      banned: function (u) { return 'Mensaje de ' + u + ' borrado por palabra prohibida. Timeout de 60 s.'; },
      repeat: function (u) { return u + ', no repitas el mismo mensaje (mensaje borrado).'; },
      unknown: function (c) { return 'No conozco ' + c + '. Escribe !comandos para ver la lista.'; },
      cmds: function (l) { return 'Comandos: ' + l; },
      dice: function (a) { return a.u + ' tiró el dado y sacó un ' + a.n + ' 🎲'; },
      so: function (u) { return '¡Pasaos por el canal de ' + u + '! twitch.tv/' + u.replace('@', '') + ' 💜'; },
      timer: '¿Te gusta el directo? Dale a seguir y activa las notificaciones 🔔 · Redes: !redes',
      welcome: '¡Hola! Soy LCABot. Prueba !redes, !discord, !horario o !dado. Pega un link o escribe EN MAYÚSCULAS para ver la moderación.',
      saved: function (c) { return 'Comando ' + c + ' guardado. Ya funciona en el chat ✅'; },
      bad: 'El comando tiene que empezar con ! y no llevar espacios.',
      a: {
        follow: ['💜', function (u) { return u + ' te sigue'; }, '¡Bienvenido a la comunidad!'],
        sub: ['⭐', function (u) { return u + ' se suscribió'; }, 'Nivel 1 · 3 meses seguidos'],
        bits: ['💎', function (u) { return u + ' envió 500 bits'; }, '«¡Vamos con todo!»'],
        raid: ['🚀', function (u) { return 'Raid de ' + u; }, 'con 87 espectadores']
      },
      thanks: {
        follow: function (u) { return '¡Gracias por el follow, ' + u + '! 💜'; },
        sub: function (u) { return '¡Gracias por la suscripción, ' + u + '! ⭐'; },
        bits: function (u) { return '¡Gracias por los 500 bits, ' + u + '! 💎'; },
        raid: function (u) { return '¡Bienvenidos los del raid de ' + u + '! 🚀'; }
      },
      replies: {
        '!redes': 'Instagram, X y TikTok: @tucanal · Todo en tucanal.com',
        '!discord': 'Únete al Discord de la comunidad: discord.gg/tucanal',
        '!horario': 'Directos de lunes a viernes a las 21:00 (hora de España) 🕘'
      },
      chatter: ['buenas!!', 'qué tal el directo de hoy?', 'jajaja', 'vamos!!!', 'primera vez por aquí 👋', 'qué juego es este?', 'GG', 'saludos desde Madrid', 'LUL', 'a qué hora termina?'],
      spam: 'seguidores gratis aqui bit.ly/free-follows',
      tries: ['!redes', '!discord', '!horario', '!dado', '!so @amigo', 'mira esto www.ejemplo.com', 'HOLA A TODOS QUE TAL']
    },
    en: {
      placeholder: 'Type a message… (try !socials)',
      you: 'guest_demo',
      link: function (u) { return u + "'s message deleted: links aren't allowed. 10 s timeout."; },
      caps: function (u) { return u + ', not so many caps please 🙂 (message deleted)'; },
      banned: function (u) { return u + "'s message deleted for a banned word. 60 s timeout."; },
      repeat: function (u) { return u + ", please don't repeat the same message (deleted)."; },
      unknown: function (c) { return "I don't know " + c + '. Type !commands to see the list.'; },
      cmds: function (l) { return 'Commands: ' + l; },
      dice: function (a) { return a.u + ' rolled the dice and got a ' + a.n + ' 🎲'; },
      so: function (u) { return 'Go check out ' + u + '! twitch.tv/' + u.replace('@', '') + ' 💜'; },
      timer: 'Enjoying the stream? Hit follow and turn on notifications 🔔 · Socials: !socials',
      welcome: "Hi! I'm LCABot. Try !socials, !discord, !schedule or !dice. Paste a link or TYPE IN CAPS to see moderation.",
      saved: function (c) { return 'Command ' + c + ' saved. It already works in the chat ✅'; },
      bad: 'The command must start with ! and have no spaces.',
      a: {
        follow: ['💜', function (u) { return u + ' followed'; }, 'Welcome to the community!'],
        sub: ['⭐', function (u) { return u + ' subscribed'; }, 'Tier 1 · 3 months in a row'],
        bits: ['💎', function (u) { return u + ' cheered 500 bits'; }, '“Let’s go!”'],
        raid: ['🚀', function (u) { return u + ' is raiding'; }, 'with 87 viewers']
      },
      thanks: {
        follow: function (u) { return 'Thanks for the follow, ' + u + '! 💜'; },
        sub: function (u) { return 'Thanks for subscribing, ' + u + '! ⭐'; },
        bits: function (u) { return 'Thanks for the 500 bits, ' + u + '! 💎'; },
        raid: function (u) { return 'Welcome, ' + u + ' raiders! 🚀'; }
      },
      replies: {
        '!socials': 'Instagram, X and TikTok: @yourchannel · Everything at yourchannel.com',
        '!discord': 'Join the community Discord: discord.gg/yourchannel',
        '!schedule': 'Live Monday to Friday at 9 PM (Spain time) 🕘'
      },
      chatter: ['hi!!', "how's the stream today?", 'lol', "let's go!!!", 'first time here 👋', 'what game is this?', 'GG', 'greetings from Madrid', 'LUL', 'when does it end?'],
      spam: 'free followers here bit.ly/free-follows',
      tries: ['!socials', '!discord', '!schedule', '!dice', '!so @friend', 'look at this www.example.com', 'HELLO EVERYONE WHATS UP']
    }
  };
  var ALIAS = { '!socials': '!redes', '!schedule': '!horario', '!commands': '!comandos', '!dice': '!dado' };
  var NAMES = ['NachoGG', 'luciaplays', 'elpibe_92', 'MarGamer', 'tito_irl', 'Sofi_Stream', 'kevo77', 'ana_rx'];
  var COLORS = ['#ff7f50', '#1e90ff', '#9acd32', '#ff69b4', '#daa520', '#00ced1', '#ba55d3', '#ff4500'];
  var BANNED = /\b(seguidores gratis|free followers|estafa|scam)\b/i;
  var LINK = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|ly|gg|io|es|tv)\b)/i;

  var log = document.getElementById('stLog');
  var form = document.getElementById('stForm');
  var input = document.getElementById('stInput');
  var tryBox = document.getElementById('stTry');
  var alertBox = document.getElementById('stAlert');
  var viewers = document.getElementById('stViewers');
  var sound = document.getElementById('stSound');
  var listEl = document.getElementById('stList');
  var custom = {};
  try { custom = JSON.parse(localStorage.getItem('lca-st-cmds') || '{}') || {}; } catch (e) { custom = {}; }
  var lastByUser = {};

  function color(u) { var h = 0; for (var i = 0; i < u.length; i++) h = (h * 31 + u.charCodeAt(i)) | 0; return COLORS[Math.abs(h) % COLORS.length]; }
  function rnd(a) { return a[Math.floor(Math.random() * a.length)]; }

  function line(user, text, cls) {
    var li = document.createElement('li');
    if (cls) li.className = cls;
    if (user) {
      var b = document.createElement('b');
      b.textContent = user;
      b.style.color = cls === 'is-bot' ? 'var(--tw2)' : color(user);
      li.appendChild(b);
      li.appendChild(document.createTextNode(': '));
    }
    var span = document.createElement('span');
    span.textContent = text;
    li.appendChild(span);
    log.appendChild(li);
    while (log.children.length > 80) log.removeChild(log.firstChild);
    log.scrollTop = log.scrollHeight;
    return li;
  }
  function bot(text, delay) { setTimeout(function () { line('LCABot', text, 'is-bot'); }, delay == null ? 450 : delay); }

  function allCommands() {
    var l = lang();
    var base = l === 'en' ? ['!socials', '!discord', '!schedule', '!dice', '!so', '!commands'] : ['!redes', '!discord', '!horario', '!dado', '!so', '!comandos'];
    return base.concat(Object.keys(custom));
  }

  function moderate(user, text, li) {
    var letters = text.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ]/g, '');
    var upper = letters.replace(/[^A-ZÁÉÍÓÚÑ]/g, '').length;
    var why = null;
    if (BANNED.test(text)) why = 'banned';
    else if (LINK.test(text)) why = 'link';
    else if (letters.length >= 8 && upper / letters.length > 0.7) why = 'caps';
    else if (lastByUser[user] && lastByUser[user] === text.toLowerCase() && text.charAt(0) !== '!') why = 'repeat';
    lastByUser[user] = text.toLowerCase();
    if (!why) return false;
    setTimeout(function () {
      li.classList.add('is-gone');
      li.querySelector('span').textContent = lang() === 'en' ? '<message deleted>' : '<mensaje borrado>';
      line(null, T(why, user), 'is-mod');
    }, 500);
    return true;
  }

  function command(user, text) {
    var parts = text.trim().split(/\s+/);
    var c = parts[0].toLowerCase();
    if (c.charAt(0) !== '!') return;
    if (custom[c]) return bot(custom[c]);
    var k = ALIAS[c] || c;
    var rep = STR[lang()].replies;
    var key = lang() === 'en' ? Object.keys(ALIAS).filter(function (a) { return ALIAS[a] === k; })[0] || k : k;
    if (rep[key]) return bot(rep[key]);
    if (k === '!comandos') return bot(T('cmds', allCommands().join(' ')));
    if (k === '!dado') return bot(T('dice', { u: user, n: 1 + Math.floor(Math.random() * 6) }));
    if (k === '!so') return bot(T('so', parts[1] && parts[1].charAt(0) === '@' ? parts[1] : '@' + rnd(NAMES)));
    bot(T('unknown', c));
  }

  function say(user, text) {
    var li = line(user, text);
    if (moderate(user, text, li)) return;
    command(user, text);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var t = input.value.trim();
    if (!t) return;
    say(T('you'), t);
    input.value = '';
  });

  function renderTry() {
    tryBox.textContent = '';
    STR[lang()].tries.forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = t;
      b.addEventListener('click', function () { say(T('you'), t); });
      tryBox.appendChild(b);
    });
  }

  // ---- Alertas (cola: una por vez)
  var queue = [], showing = false, audio = null;
  function beep() {
    if (!sound.checked) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      [660, 880, 1320].forEach(function (f, i) {
        var o = audio.createOscillator(), g = audio.createGain(), t0 = audio.currentTime + i * 0.12;
        o.frequency.value = f; o.type = 'triangle';
        g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.15, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.25);
        o.connect(g); g.connect(audio.destination); o.start(t0); o.stop(t0 + 0.3);
      });
    } catch (e) {}
  }
  function next() {
    if (showing || !queue.length) return;
    showing = true;
    var kind = queue.shift(), user = rnd(NAMES), a = STR[lang()].a[kind];
    alertBox.textContent = '';
    [['st-alert__icon', a[0]], ['st-alert__title', a[1](user)], ['st-alert__sub', a[2]]].forEach(function (p) {
      var s = document.createElement('span'); s.className = p[0]; s.textContent = p[1]; alertBox.appendChild(s);
    });
    alertBox.classList.add('is-on');
    beep();
    bot(STR[lang()].thanks[kind](user), 700);
    if (kind === 'raid') bumpViewers(87);
    setTimeout(function () { alertBox.classList.remove('is-on'); setTimeout(function () { showing = false; next(); }, 450); }, 3600);
  }
  document.querySelectorAll('[data-alert]').forEach(function (b) {
    b.addEventListener('click', function () { queue.push(b.getAttribute('data-alert')); next(); });
  });

  var count = 128;
  function bumpViewers(n) { count = Math.max(40, count + n); viewers.textContent = count; }

  // ---- Panel: comandos propios
  var newForm = document.getElementById('stNew');
  var newName = document.getElementById('stNewName');
  var newText = document.getElementById('stNewText');
  function renderList() {
    listEl.textContent = '';
    allCommands().forEach(function (c) {
      var li = document.createElement('li');
      li.textContent = c;
      if (custom[c]) li.className = 'is-new';
      listEl.appendChild(li);
    });
  }
  newForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = newName.value.trim().toLowerCase();
    var text = newText.value.trim();
    if (!/^![a-z0-9áéíóúñ_]{1,19}$/.test(name)) { bot(T('bad'), 0); return; }
    custom[name] = text;
    try { localStorage.setItem('lca-st-cmds', JSON.stringify(custom)); } catch (err) {}
    renderList();
    bot(T('saved', name), 0);
    newName.value = ''; newText.value = '';
  });

  // ---- Arranque y "vida" del chat
  var toggle = document.getElementById('langToggle');
  if (toggle) toggle.addEventListener('click', function () { setLang(lang() === 'es' ? 'en' : 'es'); });
  setLang(pick());
  bot(T('welcome'), 300);

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ticks = 0;
  function life() {
    if (document.hidden) return schedule();
    ticks++;
    if (ticks % 9 === 0) say('free_f0llows99', STR[lang()].spam);
    else say(rnd(NAMES), rnd(STR[lang()].chatter));
    if (ticks % 7 === 0) bot(T('timer'), 900);
    if (ticks % 5 === 0) bumpViewers(Math.round(Math.random() * 10 - 4));
    schedule();
  }
  function schedule() { setTimeout(life, (reduce ? 9000 : 4200) + Math.random() * 3000); }
  schedule();
})();
