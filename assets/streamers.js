// Demo inmersiva de bot de Twitch (streamers.html): escena animada, chat con avatares e insignias,
// comandos, moderación configurable, alertas con confeti, meta de subs y panel. Sin dependencias.
// Todo corre en el navegador; no se conecta a Twitch.
(function () {
  'use strict';
  var root = document.documentElement;
  var $ = function (id) { return document.getElementById(id); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ------------------------------------------------------------------ idioma
  var KEY = 'lca-lang';
  function pick() {
    var q = new URLSearchParams(location.search).get('lang');
    if (q === 'es' || q === 'en') return q;
    try { var s = localStorage.getItem(KEY); if (s === 'es' || s === 'en') return s; } catch (e) {}
    return (navigator.language || 'es').toLowerCase().indexOf('en') === 0 ? 'en' : 'es';
  }
  var TITLE = { en: 'Twitch bot demo · LCA ITECH', es: 'Demo de bot para Twitch · LCA ITECH' };
  function lang() { return root.getAttribute('data-lang') === 'en' ? 'en' : 'es'; }
  function T(k, a) { var s = STR[lang()][k]; return typeof s === 'function' ? s(a) : s; }

  var STR = {
    es: {
      placeholder: 'Envía un mensaje… (prueba !redes)',
      you: 'invitado_demo',
      pin: 'Bienvenidos al directo 💜 Usad !comandos para ver todo lo que hace el bot.',
      link: function (u) { return 'LCABot borró el mensaje de ' + u + ': no se permiten links (timeout 10 s).'; },
      caps: function (u) { return 'LCABot borró el mensaje de ' + u + ': demasiadas mayúsculas.'; },
      banned: function (u) { return 'LCABot borró el mensaje de ' + u + ' por palabra prohibida (timeout 60 s).'; },
      repeat: function (u) { return 'LCABot borró el mensaje repetido de ' + u + '.'; },
      gone: 'mensaje borrado por un moderador',
      unknown: function (c) { return 'No conozco ' + c + '. Escribe !comandos para ver la lista.'; },
      cmds: function (l) { return 'Comandos: ' + l; },
      dice: function (a) { return a.u + ' tiró el dado y sacó un ' + a.n + ' 🎲'; },
      so: function (u) { return '¡Pasaos por el canal de ' + u + '! Se lo merece 💜'; },
      timer: '¿Te está gustando el directo? Dale a Seguir y activa las notificaciones 🔔',
      welcome: '¡Hola! Soy LCABot 🤖 Prueba !redes, !discord o !dado. Pega un link o escribe EN MAYÚSCULAS y verás la moderación.',
      saved: function (c) { return 'Comando ' + c + ' guardado desde el panel. Ya funciona ✅'; },
      bad: 'El comando tiene que empezar con ! y no llevar espacios.',
      following: 'Siguiendo',
      a: {
        follow: ['💜', function (u) { return '<em>' + u + '</em> te sigue'; }, '¡Bienvenido a la comunidad!'],
        sub: ['⭐', function (u) { return '<em>' + u + '</em> se suscribió'; }, 'Nivel 1 · 3 meses seguidos'],
        gift: ['🎁', function (u) { return '<em>' + u + '</em> regaló 5 subs'; }, '¡Gracias por tanto!'],
        bits: ['💎', function (u) { return '<em>' + u + '</em> envió 500 bits'; }, '«¡Vamos con todo, Madrid!»'],
        raid: ['🚀', function (u) { return 'Raid de <em>' + u + '</em>'; }, 'llegan 87 espectadores']
      },
      ev: {
        follow: function (u) { return '💜 ' + u + ' acaba de seguir el canal'; },
        sub: function (u) { return '⭐ ' + u + ' se suscribió · 3 meses'; },
        gift: function (u) { return '🎁 ' + u + ' regaló 5 suscripciones a la comunidad'; },
        bits: function (u) { return '💎 ' + u + ' envió 500 bits'; },
        raid: function (u) { return '🚀 ¡' + u + ' hace raid con 87 espectadores!'; }
      },
      thanks: {
        follow: function (u) { return '¡Gracias por el follow, @' + u + '! 💜'; },
        sub: function (u) { return '¡Gracias por la suscripción, @' + u + '! Bienvenido al club ⭐'; },
        gift: function (u) { return '¡@' + u + ' es una leyenda! Gracias por los 5 subs 🎁'; },
        bits: function (u) { return '¡Gracias por los 500 bits, @' + u + '! 💎'; },
        raid: function (u) { return '¡Bienvenidos los del raid de @' + u + '! Saludad en el chat 👋'; }
      },
      replies: {
        '!redes': 'Instagram, X y TikTok: @tucanal · Todo en tucanal.com',
        '!discord': 'Únete al Discord de la comunidad: discord.gg/tucanal 🎮',
        '!horario': 'Directos de lunes a viernes a las 21:00 (hora de España) 🕘'
      },
      chatter: ['buenas!! 👋', 'qué bonito se ve Madrid de noche 🌆', 'jajajaja 😂', 'vamos!!! 🔥', 'primera vez por aquí, saludos', 'por qué calle vas?', 'GG', 'saludos desde Valencia', 'te sigo desde hace años 💜', 'a qué hora termina?', 'esa música está buenísima 🎶', 'hype hype hype 🔥🔥'],
      spam: 'seguidores gratis aqui bit.ly/free-follows',
      tries: ['!redes', '!discord', '!dado', '!so @amigo', 'mira www.ejemplo.com', 'HOLA A TODOS QUE TAL']
    },
    en: {
      placeholder: 'Send a message… (try !socials)',
      you: 'guest_demo',
      pin: 'Welcome to the stream 💜 Type !commands to see everything the bot does.',
      link: function (u) { return "LCABot deleted " + u + "'s message: links aren't allowed (10 s timeout)."; },
      caps: function (u) { return "LCABot deleted " + u + "'s message: too many caps."; },
      banned: function (u) { return "LCABot deleted " + u + "'s message for a banned word (60 s timeout)."; },
      repeat: function (u) { return "LCABot deleted " + u + "'s repeated message."; },
      gone: 'message deleted by a moderator',
      unknown: function (c) { return "I don't know " + c + '. Type !commands to see the list.'; },
      cmds: function (l) { return 'Commands: ' + l; },
      dice: function (a) { return a.u + ' rolled the dice and got a ' + a.n + ' 🎲'; },
      so: function (u) { return 'Go check out ' + u + "'s channel! Well deserved 💜"; },
      timer: 'Enjoying the stream? Hit Follow and turn on notifications 🔔',
      welcome: "Hi! I'm LCABot 🤖 Try !socials, !discord or !dice. Paste a link or TYPE IN CAPS to see moderation.",
      saved: function (c) { return 'Command ' + c + ' saved from the panel. It works now ✅'; },
      bad: 'The command must start with ! and have no spaces.',
      following: 'Following',
      a: {
        follow: ['💜', function (u) { return '<em>' + u + '</em> followed'; }, 'Welcome to the community!'],
        sub: ['⭐', function (u) { return '<em>' + u + '</em> subscribed'; }, 'Tier 1 · 3 months in a row'],
        gift: ['🎁', function (u) { return '<em>' + u + '</em> gifted 5 subs'; }, 'Thank you so much!'],
        bits: ['💎', function (u) { return '<em>' + u + '</em> cheered 500 bits'; }, '“Let’s go, Madrid!”'],
        raid: ['🚀', function (u) { return '<em>' + u + '</em> is raiding'; }, 'with 87 viewers']
      },
      ev: {
        follow: function (u) { return '💜 ' + u + ' just followed'; },
        sub: function (u) { return '⭐ ' + u + ' subscribed · 3 months'; },
        gift: function (u) { return '🎁 ' + u + ' gifted 5 subs to the community'; },
        bits: function (u) { return '💎 ' + u + ' cheered 500 bits'; },
        raid: function (u) { return '🚀 ' + u + ' is raiding with 87 viewers!'; }
      },
      thanks: {
        follow: function (u) { return 'Thanks for the follow, @' + u + '! 💜'; },
        sub: function (u) { return 'Thanks for subscribing, @' + u + '! Welcome to the club ⭐'; },
        gift: function (u) { return '@' + u + ' is a legend! Thanks for the 5 subs 🎁'; },
        bits: function (u) { return 'Thanks for the 500 bits, @' + u + '! 💎'; },
        raid: function (u) { return 'Welcome, @' + u + ' raiders! Say hi in chat 👋'; }
      },
      replies: {
        '!socials': 'Instagram, X and TikTok: @yourchannel · Everything at yourchannel.com',
        '!discord': 'Join the community Discord: discord.gg/yourchannel 🎮',
        '!schedule': 'Live Monday to Friday at 9 PM (Spain time) 🕘'
      },
      chatter: ['hi!! 👋', 'Madrid looks amazing at night 🌆', 'lmao 😂', "let's go!!! 🔥", 'first time here, hello', 'which street is this?', 'GG', 'greetings from Valencia', 'been following for years 💜', 'when does it end?', 'this music slaps 🎶', 'hype hype hype 🔥🔥'],
      spam: 'free followers here bit.ly/free-follows',
      tries: ['!socials', '!discord', '!dice', '!so @friend', 'look www.example.com', 'HELLO EVERYONE WHATS UP']
    }
  };
  var ALIAS = { '!socials': '!redes', '!schedule': '!horario', '!commands': '!comandos', '!dice': '!dado' };
  // viewers: name -> badges
  var PEOPLE = {
    NachoGG: ['sub'], luciaplays: ['vip'], elpibe_92: [], MarGamer: ['sub'], tito_irl: ['mod'],
    Sofi_Stream: ['sub', 'vip'], kevo77: [], ana_rx: ['sub'], pablo_mad: [], Irene_GG: ['mod', 'sub']
  };
  var NAMES = Object.keys(PEOPLE);
  var COLORS = ['#ff7f50', '#1e90ff', '#9acd32', '#ff69b4', '#daa520', '#00ced1', '#ba55d3', '#ff4500', '#2e8b57', '#5f9ea0'];
  var BADGE = { mod: ['mod', '⚔'], sub: ['sub', '★'], vip: ['vip', '◆'], bot: ['bot', '⚙'], you: ['you', '●'] };
  var BANNED = /\b(seguidores gratis|free followers|estafa|scam)\b/i;
  var LINK = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|ly|gg|io|es|tv)\b)/i;
  var EMOJI = /(\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*)/u;

  var log = $('stLog'), input = $('stInput'), tryBox = $('stTry'), alertBox = $('stAlert'), sound = $('stSound'), listEl = $('stList');
  var custom = {};
  try { custom = JSON.parse(localStorage.getItem('lca-st-cmds') || '{}') || {}; } catch (e) { custom = {}; }
  var lastByUser = {};
  function rnd(a) { return a[Math.floor(Math.random() * a.length)]; }
  function hash(u) { var h = 0; for (var i = 0; i < u.length; i++) h = (h * 31 + u.charCodeAt(i)) | 0; return Math.abs(h); }
  function color(u) { return COLORS[hash(u) % COLORS.length]; }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }

  function richText(parent, text) {  // texto + emojis grandes, sin innerHTML
    text.split(EMOJI).forEach(function (part, i) {
      if (!part) return;
      parent.appendChild(i % 2 ? el('span', 'st-emote', part) : document.createTextNode(part));
    });
  }

  function trim() { while (log.children.length > 90) log.removeChild(log.firstChild); log.scrollTop = log.scrollHeight; }

  function line(user, text, opts) {
    opts = opts || {};
    var li = el('li', opts.cls || '');
    if (user) {
      var c = opts.bot ? '#bf94ff' : opts.you ? '#60a5fa' : color(user);
      var av = el('span', 'st-av', user.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || '?');
      av.style.background = opts.bot ? 'linear-gradient(135deg,#9146ff,#22d3ee)' : c;
      li.appendChild(av);
      var msg = el('span', 'st-msg');
      (opts.badges || []).forEach(function (b) {
        var bd = BADGE[b]; var s = el('span', 'st-badge st-badge--' + bd[0], bd[1]); s.setAttribute('aria-hidden', 'true'); msg.appendChild(s);
      });
      var name = el('span', 'st-user', user); name.style.color = c; msg.appendChild(name);
      msg.appendChild(document.createTextNode(': '));
      var t = el('span', 'st-text'); richText(t, text); msg.appendChild(t);
      li.appendChild(msg);
    } else {
      richText(li, text);
    }
    log.appendChild(li);
    trim();
    return li;
  }
  function bot(text, delay) { setTimeout(function () { line('LCABot', text, { cls: 'is-bot', bot: true, badges: ['bot', 'mod'] }); }, delay == null ? 450 : delay); }

  function allCommands() {
    var base = lang() === 'en' ? ['!socials', '!discord', '!schedule', '!dice', '!so', '!commands'] : ['!redes', '!discord', '!horario', '!dado', '!so', '!comandos'];
    return base.concat(Object.keys(custom));
  }

  // ------------------------------------------------------------------ moderación (configurable en el panel)
  function on(id) { var n = $(id); return !n || n.checked; }
  function moderate(user, text, li) {
    var letters = text.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ]/g, '');
    var upper = letters.replace(/[^A-ZÁÉÍÓÚÑ]/g, '').length;
    var why = null;
    if (on('modWords') && BANNED.test(text)) why = 'banned';
    else if (on('modLinks') && LINK.test(text)) why = 'link';
    else if (on('modCaps') && letters.length >= 8 && upper / letters.length > 0.7) why = 'caps';
    else if (on('modRepeat') && lastByUser[user] === text.toLowerCase() && text.charAt(0) !== '!') why = 'repeat';
    lastByUser[user] = text.toLowerCase();
    if (!why) return false;
    setTimeout(function () {
      li.classList.add('is-gone');
      var t = li.querySelector('.st-text'); if (t) t.textContent = '<' + T('gone') + '>';
      line(null, T(why, user), { cls: 'is-mod' });
    }, 550);
    return true;
  }

  function command(user, text) {
    var parts = text.trim().split(/\s+/);
    var c = parts[0].toLowerCase();
    if (c.charAt(0) !== '!') return;
    if (custom[c]) return bot(custom[c]);
    var k = ALIAS[c] || c;
    var rep = STR[lang()].replies;
    var key = lang() === 'en' ? (Object.keys(ALIAS).filter(function (a) { return ALIAS[a] === k; })[0] || k) : k;
    if (rep[key]) return bot(rep[key]);
    if (k === '!comandos') return bot(T('cmds', allCommands().join(' ')));
    if (k === '!dado') return bot(T('dice', { u: user, n: 1 + Math.floor(Math.random() * 6) }));
    if (k === '!so') return bot(T('so', parts[1] && parts[1].charAt(0) === '@' ? parts[1] : '@' + rnd(NAMES)));
    bot(T('unknown', c));
  }

  function say(user, text, opts) {
    var li = line(user, text, opts);
    if (moderate(user, text, li)) return;
    command(user, text);
  }
  function sayYou(text) { say(T('you'), text, { you: true, badges: ['you'] }); }

  $('stForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var t = input.value.trim();
    if (!t) return;
    sayYou(t);
    input.value = '';
  });

  function renderTry() {
    tryBox.textContent = '';
    STR[lang()].tries.forEach(function (t) {
      var b = el('button', '', t); b.type = 'button';
      b.addEventListener('click', function () { sayYou(t); });
      tryBox.appendChild(b);
    });
  }

  // ------------------------------------------------------------------ escena (canvas): Madrid de noche, IRL
  var scene = $('stScene'), sctx = scene.getContext('2d'), fx = $('stFx'), fctx = fx.getContext('2d');
  var W = 0, H = 0, DPR = 1, city = [], bokeh = [], cars = [], stars = [];
  function seedScene() {
    city = []; bokeh = []; cars = []; stars = [];
    for (var layer = 0; layer < 3; layer++) {
      var x = -20;
      while (x < W + 20) {
        var bw = (30 + Math.random() * 70) * (1 + layer * 0.25) * (W / 900);
        var bh = H * (0.18 + Math.random() * 0.32 + layer * 0.08);
        var wins = [];
        for (var wy = 10; wy < bh - 12; wy += 12 * (W / 900) + 4) for (var wx = 6; wx < bw - 8; wx += 10 * (W / 900) + 3) if (Math.random() < 0.55) wins.push([wx, wy, Math.random()]);
        city.push({ l: layer, x: x, w: bw, h: bh, wins: wins, antenna: Math.random() < 0.15 });
        x += bw + 2 + Math.random() * 6;
      }
    }
    for (var i = 0; i < 26; i++) bokeh.push({ x: Math.random() * W, y: H * (0.55 + Math.random() * 0.4), r: (8 + Math.random() * 28) * (W / 900), hue: rnd([280, 190, 30, 330, 50]), v: (Math.random() - 0.5) * 0.15, a: 0.08 + Math.random() * 0.18 });
    for (var j = 0; j < 8; j++) cars.push({ x: Math.random() * W, lane: j % 2, v: (0.6 + Math.random() * 1.2) * (W / 900) * (j % 2 ? -1 : 1) });
    for (var k = 0; k < 60; k++) stars.push([Math.random() * W, Math.random() * H * 0.45, Math.random()]);
  }
  function resize() {
    var r = scene.getBoundingClientRect();
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(320, r.width); H = Math.max(180, r.height);
    [scene, fx].forEach(function (c) { c.width = W * DPR; c.height = H * DPR; });
    sctx.setTransform(DPR, 0, 0, DPR, 0, 0); fctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    seedScene(); drawScene(0);
  }
  var hueShift = 0;
  function drawScene(t) {
    var g = sctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0b0620'); g.addColorStop(0.5, '#2a1150'); g.addColorStop(0.78, '#5b1f6e'); g.addColorStop(1, '#14081f');
    sctx.fillStyle = g; sctx.fillRect(0, 0, W, H);
    // estrellas y luna
    stars.forEach(function (s) { sctx.fillStyle = 'rgba(255,255,255,' + (0.25 + 0.5 * Math.abs(Math.sin(t / 900 + s[2] * 9))) + ')'; sctx.fillRect(s[0], s[1], 1.4, 1.4); });
    var mx = W * 0.78, my = H * 0.2, mr = H * 0.07;
    var mg = sctx.createRadialGradient(mx, my, mr * 0.2, mx, my, mr * 4);
    mg.addColorStop(0, 'rgba(255,230,255,.45)'); mg.addColorStop(1, 'rgba(255,230,255,0)');
    sctx.fillStyle = mg; sctx.fillRect(mx - mr * 4, my - mr * 4, mr * 8, mr * 8);
    sctx.fillStyle = '#f6e9ff'; sctx.beginPath(); sctx.arc(mx, my, mr, 0, Math.PI * 2); sctx.fill();
    // edificios
    var base = H * 0.82;
    city.forEach(function (b) {
      var par = (b.l + 1) * 0.04 * Math.sin(t / 6000);
      var x = b.x + par * 40, top = base - b.h;
      var shade = ['#1a0f33', '#140b29', '#0c0719'][b.l];
      sctx.fillStyle = shade; sctx.fillRect(x, top, b.w, b.h);
      if (b.antenna) { sctx.fillRect(x + b.w / 2 - 1, top - 14, 2, 14); sctx.fillStyle = Math.sin(t / 300) > 0 ? '#ff3b3b' : '#5a1010'; sctx.fillRect(x + b.w / 2 - 2, top - 16, 4, 4); }
      var ws = 5 * (W / 900) + 2;
      b.wins.forEach(function (w) {
        var flick = (Math.sin(t / 1400 + w[2] * 40) + 1) / 2;
        var a = b.l === 2 ? 0.75 : 0.45;
        sctx.fillStyle = w[2] > 0.8 ? 'rgba(130,220,255,' + a * (0.4 + flick * 0.6) + ')' : 'rgba(255,196,110,' + a * (0.5 + flick * 0.5) + ')';
        sctx.fillRect(x + w[0], top + w[1], ws, ws * 1.2);
      });
    });
    // calle y coches (estelas de luz)
    var rg = sctx.createLinearGradient(0, base, 0, H);
    rg.addColorStop(0, '#120a20'); rg.addColorStop(1, '#05030a');
    sctx.fillStyle = rg; sctx.fillRect(0, base, W, H - base);
    cars.forEach(function (c) {
      c.x += c.v; if (c.x > W + 80) c.x = -80; if (c.x < -80) c.x = W + 80;
      var y = base + (H - base) * (c.lane ? 0.35 : 0.68);
      var tail = c.v > 0 ? -60 : 60;
      var lg = sctx.createLinearGradient(c.x + tail, y, c.x, y);
      var col = c.v > 0 ? '255,60,90' : '255,240,200';
      lg.addColorStop(0, 'rgba(' + col + ',0)'); lg.addColorStop(1, 'rgba(' + col + ',.9)');
      sctx.fillStyle = lg; sctx.fillRect(Math.min(c.x, c.x + tail), y - 1.5, Math.abs(tail), 3);
    });
    // bokeh
    sctx.globalCompositeOperation = 'lighter';
    bokeh.forEach(function (b) {
      b.x += b.v; if (b.x < -40) b.x = W + 40; if (b.x > W + 40) b.x = -40;
      var bg = sctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
      bg.addColorStop(0, 'hsla(' + ((b.hue + hueShift) % 360) + ',90%,65%,' + b.a + ')'); bg.addColorStop(1, 'hsla(' + b.hue + ',90%,65%,0)');
      sctx.fillStyle = bg; sctx.beginPath(); sctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); sctx.fill();
    });
    sctx.globalCompositeOperation = 'source-over';
    // viñeta
    var vg = sctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)');
    sctx.fillStyle = vg; sctx.fillRect(0, 0, W, H);
  }

  // ------------------------------------------------------------------ confeti
  var parts = [];
  function burst(kind) {
    var n = reduce ? 0 : kind === 'raid' || kind === 'gift' ? 160 : 90;
    var cols = ['#9146ff', '#bf94ff', '#22d3ee', '#ffd166', '#ff6bcb', '#ffffff'];
    for (var i = 0; i < n; i++) {
      var ang = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 6;
      parts.push({ x: W / 2, y: H * 0.45, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 3, r: 2 + Math.random() * 4, c: rnd(cols), life: 1, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3 });
    }
  }
  function drawFx() {
    fctx.clearRect(0, 0, W, H);
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.vy += 0.12; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= 0.008;
      if (p.life <= 0 || p.y > H + 20) { parts.splice(i, 1); continue; }
      fctx.save(); fctx.globalAlpha = Math.min(1, p.life * 1.5); fctx.translate(p.x, p.y); fctx.rotate(p.rot);
      fctx.fillStyle = p.c; fctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); fctx.restore();
    }
  }

  var running = true;
  function frame(t) {
    if (!document.hidden && running) { drawScene(t); drawFx(); }
    requestAnimationFrame(frame);
  }

  // ------------------------------------------------------------------ sonido
  // Efectos por alerta en assets/sounds/ (hechos con ElevenLabs). Se bajan recién cuando el visitante
  // activa el sonido; hasta que cargan, o si alguno falla, suena un beep sintetizado. Cada alerta elige
  // al azar entre sus versiones. Si la música está activada, baja de volumen mientras suena la alerta.
  var SND = 'assets/sounds/';
  var SFX = { follow: ['follow'], sub: ['sub'], gift: ['gift'], bits: ['bits'], raid: ['raid'] };
  var FX_VOL = 0.85, MUSIC_VOL = 0.3, DUCK = 0.35;
  var audio = null, fxOut = null, bufs = {}, fxAsked = false, hello = 0;
  var musicSw = $('stMusic'), mus = { out: null, src: null, old: null, buf: null, edge: null, asked: false };

  function quiet(p) { if (p && p.catch) p.catch(function () {}); }
  function ctx() {  // un solo AudioContext, creado en el primer gesto del visitante
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!audio) {
      try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}  // suena aunque el iPhone esté en silencio
      try { audio = new AC(); } catch (e) { return null; }
      fxOut = audio.createGain(); fxOut.gain.value = FX_VOL; fxOut.connect(audio.destination);
      var s = audio.createBufferSource(); s.buffer = audio.createBuffer(1, 1, 22050); s.connect(audio.destination); s.start();  // destraba iOS
    }
    if (audio.state === 'suspended') quiet(audio.resume());
    return audio;
  }
  function load(name, done) {
    if (!window.fetch) return;
    fetch(SND + name + '.mp3')
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then(function (data) { quiet(audio.decodeAudioData(data, done, function () {})); })
      .catch(function () {});
  }
  function loadFx() {
    if (fxAsked) return;
    fxAsked = true;
    Object.keys(SFX).forEach(function (kind) {
      SFX[kind].forEach(function (name) {
        load(name, function (buf) {
          (bufs[kind] = bufs[kind] || []).push(buf);
          if (kind === 'follow' && hello && Date.now() - hello < 4000 && sound.checked) playFx('follow');
          if (kind === 'follow') hello = 0;
        });
      });
    });
  }
  function duck(secs) {  // baja la música mientras suena la alerta y después la vuelve a subir
    if (!mus.src) return;
    var g = mus.out.gain, t = audio.currentTime;
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(MUSIC_VOL * DUCK, t + 0.15);
    g.setValueAtTime(MUSIC_VOL * DUCK, t + 0.15 + secs);
    g.linearRampToValueAtTime(MUSIC_VOL, t + 1.2 + secs);
  }
  function playFx(kind) {
    var list = bufs[kind];
    if (!list || !list.length) return false;
    var buf = rnd(list), src = audio.createBufferSource();
    src.buffer = buf; src.connect(fxOut); src.start();
    duck(buf.duration);
    return true;
  }
  function beep(kind) {  // respaldo sintetizado
    var notes = kind === 'raid' ? [392, 523, 659, 784, 1047] : kind === 'gift' ? [523, 659, 784, 1047, 1319] : [660, 880, 1320];
    notes.forEach(function (f, i) {
      var o = audio.createOscillator(), g = audio.createGain(), t0 = audio.currentTime + i * 0.1;
      o.frequency.value = f; o.type = 'triangle';
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.19, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.3);
      o.connect(g); g.connect(fxOut); o.start(t0); o.stop(t0 + 0.35);
    });
    duck(0.6);
  }
  function sfx(kind) {  // sonido de una alerta
    if (!sound.checked || !ctx()) return;
    try { if (!playFx(kind)) beep(kind); } catch (e) {}
  }
  function edges(buf) {  // el MP3 puede traer relleno mudo al principio y al final: el loop lo salta
    var d = buf.getChannelData(0), n = d.length, a = 0, b = n - 1, lim = Math.min(n >> 1, 8192);
    while (a < lim && Math.abs(d[a]) < 1e-4) a++;
    while (b > n - lim && Math.abs(d[b]) < 1e-4) b--;
    return [a / buf.sampleRate, (b + 1) / buf.sampleRate];
  }
  function musicOn() {
    if (!ctx()) return;
    if (!mus.out) { mus.out = audio.createGain(); mus.out.gain.value = 0.0001; mus.out.connect(audio.destination); }
    if (!mus.buf) {
      if (!mus.asked) { mus.asked = true; load('music', function (buf) { mus.buf = buf; mus.edge = edges(buf); if (musicSw.checked) musicOn(); }); }
      return;
    }
    if (mus.src) return;
    if (mus.old) { try { mus.old.stop(); } catch (e) {} mus.old = null; }
    var src = mus.src = audio.createBufferSource(), g = mus.out.gain, t = audio.currentTime;
    src.buffer = mus.buf; src.loop = true; src.loopStart = mus.edge[0]; src.loopEnd = mus.edge[1];
    src.connect(mus.out); src.start(t, mus.edge[0]);
    g.cancelScheduledValues(t); g.setValueAtTime(0.0001, t); g.linearRampToValueAtTime(MUSIC_VOL, t + 1.5);
  }
  function musicOff() {
    if (!mus.src) return;
    var src = mus.old = mus.src, g = mus.out.gain, t = audio.currentTime;
    mus.src = null;
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(0.0001, t + 0.5);
    src.stop(t + 0.55);
  }
  function rest() {  // con todo apagado, el audio se suspende para no gastar batería
    setTimeout(function () {
      if (audio && !sound.checked && !(musicSw && musicSw.checked)) quiet(audio.suspend());
    }, 900);
  }
  sound.addEventListener('change', function () {
    if (!sound.checked) return rest();
    if (!ctx()) return;
    loadFx();
    try { if (!playFx('follow')) hello = Date.now(); } catch (e) {}  // un chime confirma que el sonido anda
  });
  if (musicSw) musicSw.addEventListener('change', function () {
    if (musicSw.checked) musicOn(); else { musicOff(); rest(); }
  });
  document.addEventListener('visibilitychange', function () {
    if (!audio) return;
    if (document.hidden) quiet(audio.suspend());
    else if (sound.checked || (musicSw && musicSw.checked)) quiet(audio.resume());
  });

  // ------------------------------------------------------------------ alertas
  var queue = [], showing = false, goal = 37, GOAL = 50;
  var ticker = { follow: 'luciaplays', sub: 'NachoGG', bits: 'MarGamer' };
  function setGoal(n) {
    goal = Math.min(GOAL, n);
    $('stGoalNum').textContent = goal + ' / ' + GOAL;
    $('stGoalBar').style.width = (goal / GOAL * 100) + '%';
    var g = $('stGoal'); g.classList.remove('is-bump'); void g.offsetWidth; g.classList.add('is-bump');
  }
  function renderTicker() {
    $('stTicker').textContent = '💜 ' + ticker.follow + ' · ⭐ ' + ticker.sub + ' · 💎 ' + ticker.bits + ' ×500';
  }
  function trigger(kind, user) { queue.push([kind, user || rnd(NAMES)]); next(); }
  function next() {
    if (showing || !queue.length) return;
    showing = true;
    var item = queue.shift(), kind = item[0], user = item[1], a = STR[lang()].a[kind];
    alertBox.textContent = '';
    alertBox.appendChild(el('span', 'st-alert__icon', a[0]));
    var title = el('span', 'st-alert__title');
    a[1]('\u0000').split('\u0000').forEach(function (chunk, i) {  // nombre resaltado sin innerHTML
      if (i) title.appendChild(el('em', '', user));
      title.appendChild(document.createTextNode(chunk.replace(/<\/?em>/g, '')));
    });
    alertBox.appendChild(title);
    alertBox.appendChild(el('span', 'st-alert__sub', a[2]));
    alertBox.classList.add('is-on');
    burst(kind); sfx(kind); hueShift += 40;
    line(null, STR[lang()].ev[kind](user), { cls: 'is-event' });
    bot(STR[lang()].thanks[kind](user), 900);
    if (kind === 'follow') ticker.follow = user;
    if (kind === 'sub') { ticker.sub = user; setGoal(goal + 1); }
    if (kind === 'gift') setGoal(goal + 5);
    if (kind === 'bits') ticker.bits = user;
    if (kind === 'raid') { bumpViewers(87); setTimeout(function () { for (var i = 0; i < 4; i++) setTimeout(function () { say(rnd(NAMES), rnd(['👋👋👋', 'RAID 🚀', 'hola desde el raid!', 'raid hype 🔥'])); }, i * 450); }, 1200); }
    renderTicker();
    setTimeout(function () { alertBox.classList.remove('is-on'); setTimeout(function () { showing = false; next(); }, 500); }, 3800);
  }
  document.querySelectorAll('[data-alert]').forEach(function (b) {
    b.addEventListener('click', function () { trigger(b.getAttribute('data-alert')); });
  });
  var follow = $('stFollow');
  follow.addEventListener('click', function () {
    if (follow.classList.contains('is-on')) return;
    follow.classList.add('is-on');
    follow.querySelector('.st-follow__t').textContent = T('following');
    trigger('follow', T('you'));
  });

  var count = 1284;
  function bumpViewers(n) { count = Math.max(900, count + n); $('stViewers').textContent = count.toLocaleString(lang() === 'en' ? 'en-US' : 'es-ES'); }
  var up = 1 * 3600 + 24 * 60 + 7;
  setInterval(function () {
    up++; var h = Math.floor(up / 3600), m = Math.floor(up / 60) % 60, s = up % 60;
    $('stUptime').textContent = h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }, 1000);

  // ------------------------------------------------------------------ panel
  document.querySelectorAll('[data-tab]').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('[data-tab]').forEach(function (x) { x.classList.toggle('is-on', x === b); });
      document.querySelectorAll('[data-pane]').forEach(function (p) { p.hidden = p.getAttribute('data-pane') !== b.getAttribute('data-tab'); });
    });
  });
  function renderList() {
    listEl.textContent = '';
    allCommands().forEach(function (c) { var li = el('li', custom[c] ? 'is-new' : '', c); listEl.appendChild(li); });
  }
  $('stNew').addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('stNewName').value.trim().toLowerCase(), text = $('stNewText').value.trim();
    if (!/^![a-z0-9áéíóúñ_]{1,19}$/.test(name)) { bot(T('bad'), 0); return; }
    custom[name] = text;
    try { localStorage.setItem('lca-st-cmds', JSON.stringify(custom)); } catch (err) {}
    renderList();
    bot(T('saved', name), 0);
    $('stNewName').value = ''; $('stNewText').value = '';
  });
  $('timerNow').addEventListener('click', function () { bot(T('timer'), 0); });

  // ------------------------------------------------------------------ arranque
  function setLang(l) {
    root.setAttribute('data-lang', l); root.setAttribute('lang', l);
    document.title = TITLE[l];
    try { localStorage.setItem(KEY, l); } catch (e) {}
    input.placeholder = T('placeholder');
    $('stPin').textContent = T('pin');
    if (follow.classList.contains('is-on')) follow.querySelector('.st-follow__t').textContent = T('following');
    renderTry(); renderList(); bumpViewers(0);
  }
  var toggle = $('langToggle');
  if (toggle) toggle.addEventListener('click', function () { setLang(lang() === 'es' ? 'en' : 'es'); });
  setLang(pick());

  // chat inicial para que la demo arranque "viva"
  [['Irene_GG', 0], ['NachoGG', 1], ['luciaplays', 2], ['pablo_mad', 3]].forEach(function (p) {
    line(p[0], STR[lang()].chatter[p[1] + 4], { badges: PEOPLE[p[0]] });
  });
  line(null, STR[lang()].ev.sub('ana_rx'), { cls: 'is-event' });
  bot(T('welcome'), 200);

  resize();
  window.addEventListener('resize', function () { clearTimeout(resize.t); resize.t = setTimeout(resize, 150); });
  if (!reduce) requestAnimationFrame(frame);
  else setInterval(function () { drawFx(); }, 50);

  var ticks = 0;
  function life() {
    if (!document.hidden) {
      ticks++;
      if (ticks % 9 === 0) say('free_f0llows99', STR[lang()].spam, { badges: [] });
      else { var u = rnd(NAMES); say(u, rnd(STR[lang()].chatter), { badges: PEOPLE[u] }); }
      if (ticks % 8 === 0 && on('timerOn')) bot(T('timer'), 900);
      if (ticks % 4 === 0) bumpViewers(Math.round(Math.random() * 14 - 5));
      if (ticks % 13 === 0) trigger(rnd(['follow', 'follow', 'sub', 'bits']));
    }
    setTimeout(life, (reduce ? 8000 : 2600) + Math.random() * 2600);
  }
  setTimeout(life, 1800);
})();
