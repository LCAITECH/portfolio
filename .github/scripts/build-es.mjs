// Genera la versión en español (es/index.html) a partir de index.html. Sin dependencias.
//   node .github/scripts/build-es.mjs          escribe es/index.html
//   node .github/scripts/build-es.mjs --check  falla si es/index.html no está al día (lo usa check.mjs)
//
// index.html sigue siendo la única fuente: cada texto va como par <span lang="en">…</span><span lang="es">…</span>.
// La página en español sale de ahí: se quitan los textos en inglés, se pasan a español <title>, metas,
// Open Graph, JSON-LD y opciones de <select>, y las rutas locales pasan a absolutas (/assets/…).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(process.env.SITE_ROOT || path.join(here, '..', '..'));
const SITE = 'https://portfolio.lcaitech.com';

// Textos del <head> en español
export const ES = {
  title: 'Automatizaciones con IA, bots de Telegram y APIs · Leandro Buchter (LCA ITECH)',
  desc: 'Automatizaciones con IA, bots de Telegram y Discord, agentes de IA y APIs a medida para negocios y proyectos cripto. Precio cerrado, para clientes de cualquier país, en español e inglés.',
  short: 'Automatizaciones con IA, bots, agentes de IA y APIs a medida, de punta a punta. Clientes de cualquier país · Español / English.',
};
// aria-label y otros textos sueltos que no van en spans
const ARIA = { Main: 'Principal', Menu: 'Menú', 'Demo alert feed': 'Feed de alertas de demo' };
// alt/title de imágenes (texto exacto de index.html → español)
const ALT = {
  'ATH Intelligence home page: Data. Intelligence. Recovery. with the live recovery tape': 'Portada de ATH Intelligence: Data. Intelligence. Recovery., con el ranking de recuperación en vivo',
  'LCA-GPT model picker: NVIDIA, Google, OpenAI and Anthropic tabs, free and paid Gemini models, RPM and RPD rate-limit counters': 'Selector de modelos de LCA-GPT: pestañas de NVIDIA, Google, OpenAI y Anthropic, modelos Gemini gratis y pagos, contadores de límites RPM y RPD',
  'LCA-GPT Arena: the same prompt answered by three models side by side, with first-token time, tokens and cost for each': 'LCA-GPT Arena: el mismo prompt respondido por tres modelos lado a lado, con tiempo al primer token, tokens y costo de cada uno',
  'Scan to open the demo bot': 'Escanea para abrir el bot demo',
};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// Quita cada <span lang="en">…</span> respetando spans anidados.
function stripLang(html, lang) {
  const open = `<span lang="${lang}"`;
  let out = '';
  let i = 0;
  for (;;) {
    const s = html.indexOf(open, i);
    if (s < 0) return out + html.slice(i);
    out += html.slice(i, s);
    const re = /<span\b[^>]*>|<\/span>/g;
    re.lastIndex = s;
    let depth = 0;
    let m;
    while ((m = re.exec(html))) {
      depth += m[0][1] === '/' ? -1 : 1;
      if (!depth) break;
    }
    if (!m) throw new Error(`span lang="${lang}" sin cerrar cerca de la posición ${s}`);
    i = re.lastIndex;
    // si quedan dos espacios/saltos seguidos donde estaba el span, no importa: es HTML
  }
}

function replaceOnce(html, from, to, what) {
  if (!html.includes(from)) throw new Error(`build-es: no encontré ${what || from}`);
  return html.replace(from, to);
}

function setMeta(html, attr, name, value) {
  const re = new RegExp(`(<meta ${attr}="${name.replace(/[:.]/g, '\\$&')}" content=")[^"]*(")`);
  if (!re.test(html)) throw new Error(`build-es: falta <meta ${attr}="${name}">`);
  return html.replace(re, `$1${esc(value)}$2`);
}

export function buildEs(src) {
  let h = src;
  h = replaceOnce(h, '<html lang="en" data-lang="en">', '<html lang="es" data-lang="es">', '<html lang="en" data-lang="en">');
  h = replaceOnce(h, '<head>\n', '<head>\n  <!-- Generado por .github/scripts/build-es.mjs a partir de index.html: no editar a mano. -->\n', '<head>');

  // <head>
  h = h.replace(/<title>[^<]*<\/title>/, `<title>${esc(ES.title)}</title>`);
  h = setMeta(h, 'name', 'description', ES.desc);
  for (const k of ['og:title', 'og:image:alt']) h = setMeta(h, 'property', k, ES.title);
  for (const k of ['twitter:title', 'twitter:image:alt']) h = setMeta(h, 'name', k, ES.title);
  h = setMeta(h, 'property', 'og:description', ES.short);
  h = setMeta(h, 'name', 'twitter:description', ES.short);
  h = setMeta(h, 'property', 'og:url', `${SITE}/es/`);
  h = setMeta(h, 'property', 'og:locale', 'es_LA');
  h = setMeta(h, 'property', 'og:locale:alternate', 'en_US');
  h = replaceOnce(h, `<link rel="canonical" href="${SITE}/">`, `<link rel="canonical" href="${SITE}/es/">`, 'canonical');

  // JSON-LD: la página (WebPage) pasa a español; el resto (persona, empresa, servicios) es el mismo
  h = h.replace(/(<script type="application\/ld\+json">\n)([\s\S]*?)(\n {2}<\/script>)/, (all, a, json, b) => {
    const ld = JSON.parse(json);
    const page = ld['@graph'].find((n) => n['@type'] === 'WebPage');
    if (!page) throw new Error('build-es: falta el nodo WebPage en el JSON-LD');
    Object.assign(page, { '@id': `${SITE}/es/#webpage`, url: `${SITE}/es/`, name: ES.title, description: ES.desc, inLanguage: 'es' });
    return a + JSON.stringify(ld, null, 2) + b;
  });

  // Selector de idioma: en /es/ lleva a la versión en inglés
  h = replaceOnce(h, '<a class="lang" id="langToggle" href="/es/" hreflang="es" aria-label="Ver en español / Switch to Spanish">',
    '<a class="lang" id="langToggle" href="/" hreflang="en" aria-label="Switch to English / Ver en inglés">', 'el selector de idioma');

  // Cuerpo: sin textos en inglés
  h = stripLang(h, 'en');
  // <option data-es="…">texto en inglés</option> → texto en español
  h = h.replace(/(<option\b[^>]*\sdata-es="([^"]*)"[^>]*>)[^<]*(<\/option>)/g, '$1$2$3');
  for (const [en, es] of Object.entries(ARIA)) h = h.split(`aria-label="${en}"`).join(`aria-label="${es}"`);
  for (const [en, es] of Object.entries(ALT)) {
    if (!h.includes(`="${en}"`)) throw new Error(`build-es: ya no existe el alt/title "${en.slice(0, 40)}…" (actualiza ALT)`);
    h = h.split(`alt="${en}"`).join(`alt="${esc(es)}"`).split(`title="${en}"`).join(`title="${esc(es)}"`);
  }

  // Rutas locales relativas → absolutas (la página vive en /es/)
  h = h.replace(/(\s(?:src|href|srcset|poster)=")(?!https?:|mailto:|tel:|data:|#|\/)([^"]+")/g, '$1/$2');
  return h;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const out = buildEs(fs.readFileSync(path.join(root, 'index.html'), 'utf8'));
  const dest = path.join(root, 'es', 'index.html');
  if (process.argv.includes('--check')) {
    const cur = fs.existsSync(dest) ? fs.readFileSync(dest, 'utf8') : '';
    if (cur !== out) { console.error('es/index.html no está al día: corre  node .github/scripts/build-es.mjs'); process.exit(1); }
    console.log('es/index.html al día.');
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, out);
    console.log(`Escrito ${path.relative(root, dest)} (${out.length} bytes).`);
  }
}
