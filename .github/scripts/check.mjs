// Chequeos estáticos del sitio. Sin dependencias:  node .github/scripts/check.mjs
// SITE_ROOT=/otra/carpeta node .github/scripts/check.mjs   (para probar sobre una copia)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(process.env.SITE_ROOT || path.join(here, '..', '..'));
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const exists = (f) => fs.existsSync(path.join(root, f));

const failures = [];
const warnings = [];
const fail = (m) => failures.push(m);
const warn = (m) => warnings.push(m);

// ---- 1. Sintaxis de los JS
for (const f of ['script.js', 'assets/assistant.js']) {
  try { execFileSync(process.execPath, ['--check', path.join(root, f)], { stdio: 'pipe' }); }
  catch (e) { fail(`${f}: error de sintaxis\n${String(e.stderr || e.message).split('\n').slice(0, 4).join('\n')}`); }
}

// ---- 2. index.html
const html = read('index.html');
const tags = (name) => html.match(new RegExp(`<${name}\\b[^>]*>`, 'gi')) || [];
const attr = (tag, name) => { const m = tag.match(new RegExp(`\\s${name}=("([^"]*)"|'([^']*)')`, 'i')); return m ? (m[2] ?? m[3]) : null; };

// ids únicos
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
const seen = new Set();
ids.forEach((id) => { if (seen.has(id)) fail(`index.html: id duplicado "${id}"`); seen.add(id); });

// archivos locales referenciados (src/href) y anclas internas
for (const m of html.matchAll(/\s(?:src|href)="([^"]*)"/g)) {
  const ref = m[1].trim();
  if (!ref || /^(https?:|mailto:|tel:|data:)/i.test(ref)) continue;
  if (ref.startsWith('#')) { if (ref.length > 1 && !seen.has(ref.slice(1))) fail(`index.html: el ancla ${ref} no existe`); continue; }
  const file = ref.split(/[?#]/)[0];
  if (!exists(file)) fail(`index.html: falta el archivo "${file}"`);
}

// imágenes: alt (puede ser vacío si es decorativa) y width/height (evitan saltos de layout)
for (const t of tags('img')) {
  const src = attr(t, 'src') || '(sin src)';
  if (attr(t, 'alt') === null) fail(`index.html: <img ${src}> sin atributo alt`);
  if (!attr(t, 'width') || !attr(t, 'height')) fail(`index.html: <img ${src}> sin width/height`);
}

// links que abren pestaña nueva
for (const t of tags('a')) {
  if (attr(t, 'target') === '_blank' && !/noopener/.test(attr(t, 'rel') || '')) fail(`index.html: ${attr(t, 'href')} usa target=_blank sin rel="noopener"`);
}

// bilingüe: cada <span lang="en"> va seguido de su <span lang="es">
const langs = [...html.matchAll(/<span lang="(en|es)"/g)].map((m) => m[1]);
if (langs.length % 2 || langs.some((l, i) => l !== (i % 2 ? 'es' : 'en'))) {
  const i = langs.findIndex((l, n) => l !== (n % 2 ? 'es' : 'en'));
  fail(`index.html: los textos EN/ES no están emparejados (primer desvío en el span #${i + 1})`);
}

// títulos: un solo h1 y sin saltar niveles
const heads = [...html.matchAll(/<h([1-6])\b/g)].map((m) => +m[1]);
if (heads.filter((h) => h === 1).length !== 1) fail('index.html: tiene que haber exactamente un <h1>');
heads.forEach((h, i) => { if (i && h > heads[i - 1] + 1) fail(`index.html: el título h${h} salta desde h${heads[i - 1]} (posición ${i + 1})`); });

// JSON-LD
const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
if (!ld) warn('index.html: no hay JSON-LD');
else { try { JSON.parse(ld[1]); } catch (e) { fail(`index.html: el JSON-LD no es JSON válido (${e.message})`); } }

// ---- 3. Dominio, sitemap y robots coherentes
const canonical = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
const ogUrl = (html.match(/<meta property="og:url" content="([^"]+)"/) || [])[1];
if (!canonical) fail('index.html: falta <link rel="canonical">');
else {
  if (ogUrl !== canonical) fail(`index.html: og:url (${ogUrl}) no coincide con el canonical (${canonical})`);
  if (exists('CNAME')) {
    const host = read('CNAME').trim();
    if (new URL(canonical).host !== host) fail(`CNAME (${host}) no coincide con el host del canonical (${new URL(canonical).host})`);
  }
  if (!exists('sitemap.xml')) fail('falta sitemap.xml');
  else {
    const sm = read('sitemap.xml');
    if (!/^\s*<\?xml[\s\S]*<urlset[\s\S]*<\/urlset>\s*$/.test(sm)) fail('sitemap.xml no parece un XML de sitemap válido');
    if (!sm.includes(`<loc>${canonical}</loc>`)) fail(`sitemap.xml no lista ${canonical}`);
  }
  if (!exists('robots.txt')) fail('falta robots.txt');
  else if (!read('robots.txt').includes(`Sitemap: ${new URL('sitemap.xml', canonical).href}`)) fail('robots.txt no apunta al sitemap.xml');
}
for (const f of ['og.jpg']) if (!exists(`assets/${f}`)) fail(`falta assets/${f} (imagen para compartir)`);

// ---- 4. Aviso (no falla): clases de CSS que ya no usa nadie
const css = (read('styles.css') + read('assets/assistant.css')).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{[^}]*\}/g, '{}');
const used = html + read('script.js') + read('assets/assistant.js');
const classes = new Set([...css.matchAll(/\.([A-Za-z_][\w-]*)/g)].map((m) => m[1]));
const dead = [...classes].filter((c) => !new RegExp(`(?<![\\w-])${c.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}(?![\\w-])`).test(used));
if (dead.length) warn(`CSS: clases sin uso en HTML/JS: ${dead.sort().join(', ')}`);

// ---- Resultado
warnings.forEach((w) => console.log(`aviso: ${w}`));
if (failures.length) {
  failures.forEach((f) => console.error(`ERROR: ${f}`));
  console.error(`\n${failures.length} problema(s).`);
  process.exit(1);
}
console.log(`OK: ${ids.length} ids, ${tags('img').length} imágenes, ${langs.length / 2} pares EN/ES, ${heads.length} títulos.`);
