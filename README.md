# Leandro Buchter · LCA ITECH — Portfolio

Personal portfolio of Leandro Buchter (LCA ITECH): crypto data platforms, Telegram bots, AI agents, APIs and automation. Bilingual (English / Español).

**Live site:** https://portfolio.lcaitech.com

Projects featured: [ATH Intelligence](https://athintelligence.pro), [ARDC](https://ardc.club) and [Model Compass](https://github.com/LCAITECH/model-compass), all under LCA ITECH.

Static site (HTML, CSS and vanilla JS, no build step), hosted on GitHub Pages with a custom domain.

## Layout

```
index.html            all the content (one page)
styles.css            site styles
script.js             language toggle, mobile menu, reveal animations, "one section per screen" mode
assets/assistant.js   AI assistant chat widget (+ assistant.css)
assets/               images, favicons, certificates, social preview (og.jpg)
robots.txt, sitemap.xml, CNAME, .nojekyll
.github/              checks (script + workflows)
```

## Run it locally

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

Add `?lang=es` or `?lang=en` to force a language.

## How it works

- **Two languages in one HTML.** Every user-facing text is a pair of adjacent spans, `<span lang="en">…</span><span lang="es">…</span>`; CSS shows only the active language (`html[data-lang]`). The choice comes from `?lang=`, then `localStorage`, then the browser language. `script.js` also swaps the `<title>` and meta description (the Spanish versions live there).
- **One section per screen** only on desktop with a mouse/trackpad (≥ 1025 px, `hover: hover`, `pointer: fine`). On mobile/tablet/touch, without JS, or when printing, the page is a normal scroll with everything visible.
- **AI assistant.** `assets/assistant.js` talks to the backend in [LCAITECH/lcaitech-assistant](https://github.com/LCAITECH/lcaitech-assistant) (`https://asistente.lcaitech.com`, streaming over SSE). Set `window.LCA_ASSISTANT_API` before the script loads to point it somewhere else (for example a local backend). If the backend is down it shows contact links instead.
- **Images** below the fold use `loading="lazy"`; they need explicit `width`/`height` to avoid layout jumps.

## When you edit

- Add every new text in **both** languages, as an adjacent `en` + `es` pair.
- Keep heading levels in order (no jumping from `h2` to `h4`).
- External links that open a new tab need `rel="noopener"`.

## Checks

```sh
node .github/scripts/check.mjs
```

It runs on every push to `main` and on every pull request (`.github/workflows/checks.yml`). A second workflow (`links.yml`) checks the external links every Monday and on demand (Actions → *External links* → *Run workflow*). No dependencies. The script verifies JS syntax, unique ids, local files and anchors, `alt`/`width`/`height` on images, `rel="noopener"`, EN/ES pairing, heading order, JSON-LD, and that canonical, `CNAME`, `sitemap.xml` and `robots.txt` agree. It also warns about CSS classes nobody uses.

© LCA ITECH. All rights reserved.
