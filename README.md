# Leandro Buchter · LCA ITECH — Portfolio

Personal portfolio of Leandro Buchter (LCA ITECH): crypto data platforms, Telegram bots, AI agents, APIs and automation. Bilingual (English / Español).

**Live site:** https://portfolio.lcaitech.com

Projects featured: [ATH Intelligence](https://athintelligence.pro) and [Model Compass](https://github.com/LCAITECH/model-compass), all under LCA ITECH.

Static site (HTML, CSS and vanilla JS, no build step), hosted on GitHub Pages with a custom domain.

## Layout

```
index.html            all the content (one page); it is the English page (/)
es/index.html         Spanish page (/es/), GENERATED from index.html — do not edit by hand
styles.css            site styles
script.js             language toggle, mobile menu, reveal animations, "one section per screen" mode
assets/assistant.js   AI assistant chat widget (+ assistant.css)
assets/armador.js     project builder (#builder): 4-step wizard (type → modules with live demo → platform & AI → summary), per-module ⓘ tooltips (what it does, how, time, price), live quantity discount (S1–S3 only), "real cases" strip per category, pre-fills the contact form; saves only the choices in localStorage (unknown ids are dropped on load)
assets/               images, favicons, certificates, social preview (og.jpg)
robots.txt, sitemap.xml, CNAME, .nojekyll
.github/              checks (script + workflows)
```

## Run it locally

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

English is at `/`, Spanish at `/es/`. Old links with `?lang=es` / `?lang=en` still work (they redirect).

## How it works

- **Two languages, one source, two URLs.** Every user-facing text in `index.html` is a pair of adjacent spans, `<span lang="en">…</span><span lang="es">…</span>`. `node .github/scripts/build-es.mjs` writes `es/index.html`: Spanish only, with its own `<title>`, description, Open Graph, canonical and JSON-LD (the Spanish head texts and image alts live in that script). Both pages carry `hreflang` en/es/x-default, so Google indexes each language separately. A small script in the `<head>` sends visitors of `/` whose browser is in Spanish (or who chose Spanish before) to `/es/`, keeping the `#anchor`; the EN/ES button is a real link between the two.
- **Contact.** The form posts to FormSubmit (AJAX, `assets/contact.js`) with the visitor's language, optional country/Telegram and time zone, and sends the visitor a confirmation email (`_autoresponse`). Next to it: email with a copy button, languages, time zone with a live Buenos Aires clock.
- **One section per screen** only on desktop with a mouse/trackpad (≥ 1025 px, `hover: hover`, `pointer: fine`). On mobile/tablet/touch, without JS, or when printing, the page is a normal scroll with everything visible.
- **AI assistant.** `assets/assistant.js` talks to the backend in [LCAITECH/lcaitech-assistant](https://github.com/LCAITECH/lcaitech-assistant) (`https://asistente.lcaitech.com`, streaming over SSE). Set `window.LCA_ASSISTANT_API` before the script loads to point it somewhere else (for example a local backend). If the backend is down it shows contact links instead.
- **Images** below the fold use `loading="lazy"`; they need explicit `width`/`height` to avoid layout jumps.

## When you edit

- Add every new text in **both** languages, as an adjacent `en` + `es` pair, then run `node .github/scripts/build-es.mjs` and commit `es/index.html` too (the checks fail if it is out of date).
- Keep heading levels in order (no jumping from `h2` to `h4`).
- External links that open a new tab need `rel="noopener"`.

## Checks

```sh
node .github/scripts/check.mjs
```

It runs on every push to `main` and on every pull request (`.github/workflows/checks.yml`). A second workflow (`links.yml`) checks the external links every Monday and on demand (Actions → *External links* → *Run workflow*). No dependencies. The script verifies JS syntax, unique ids, local files and anchors, `alt`/`width`/`height` on images, `rel="noopener"`, EN/ES pairing, heading order, JSON-LD, that canonical, `CNAME`, `sitemap.xml` and `robots.txt` agree, and that `es/index.html` is up to date with `hreflang` on both pages. It also warns about CSS classes nobody uses.

© LCA ITECH. All rights reserved.
