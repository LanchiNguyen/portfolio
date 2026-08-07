# Lana Nguyen — Portfolio

A product and UX design portfolio. Static HTML, CSS, and a little JavaScript: no
framework, no build step required to view it. Open `index.html` in a browser, or
serve the folder with `python3 -m http.server`.

Seven projects, in the order the homepage shows them:

| № | Project | What it is |
|---|---------|------------|
| 01 | **Tenet** (`tenet.html`) | Order-time behavioral guardrails for trading. Self-authored rules become reversible friction at the moment an order is sent, inside two fictional brokers (Dart mobile, Meridian desktop) that share one Record. |
| 02 | **Morsel** (`morsel.html`) | Photo-first food discovery with a three-tier dietary model, an allergy-gated order sheet, and an evidence model that abstains when it lacks data. |
| 03 | **Hey Period** (`heyperiod.html`) | Brand identity, marketing site, and app UI for a femtech startup. |
| 04 | **Nhat Huong** (`nhathuong.html`) | Brand refresh for a Vietnamese baking brand established in 1998. |
| 05 | **Mug** (`mug.html`) | Rewards concept for bringing your own cup. |
| 06 | **Matrix** (`matrix.html`) | Eleven build-ready screens in one week, inside a client's style guide. |
| 07 | **Chatter** (`chatter.html`) | Two concepts, honest feedback, one pivot. |

Plus `about.html` and `sketchbook.html` (illustration and painting).

## Two things worth knowing

**The prototypes are real.** Tenet and Morsel ship as working builds in
`tenet-proto/` and `morsel-proto/`. The "Try the prototype" section on each case
study runs the actual application in the page — you can trigger a Dart
intervention or walk Morsel's onboarding, feed, and allergy gate.

**Evidence is labeled, always.** Every claim on a case study carries a tag:
`MEASURED` for real checkable data, `RETROSPECTIVE` for reasoning documented
after the fact, `SIMULATED` for illustrative prototype data, and `PROPOSED` for
a goal or plan that was never run. Nothing simulated is presented as a result.
Tenet and Morsel are independent concept prototypes, not shipped products, and
say so.

## Layout

```
index.html, *.html        the site
styles.css, script.js     shared styles and behavior
figures.js / .css         case-study figures, rendered as live prototype DOM
tenet-proto/              the Tenet build (host, desktop, companion)
morsel-proto/             the Morsel v3 build
morsel-docs/             process documents: wireflow, explorations, DS addendum, testing plan
images/                   photography and remaining rasters
```

### Case-study figures

The screens in the case studies are not screenshots. `capture-figures.cjs` drives
the real prototypes to the state each caption describes and serialises the
rendered DOM; `build-figures.mjs` turns those captures into `figures.js` and
`figures.css`. The figures scale with a CSS transform, so they stay sharp at any
zoom or pixel ratio. Photographs stay raster and rehydrate from one shared map
rather than being duplicated into each figure.

To regenerate after changing a prototype:

```bash
node capture-figures.cjs        # drive the prototypes, write figures.json
node build-figures.mjs          # emit figures.js / figures.css
node build-live-figures-into-pages.mjs   # swap <img> for live figures in pages
```

`build-artifact.mjs` bundles the whole site into a single self-contained HTML
file with every asset inlined and no external requests.

## Deploy

`build-site.sh` assembles `_site/`, and `.github/workflows/deploy.yml` publishes
it to GitHub Pages on every push to `main`.

GitHub Pages needs one manual switch the first time: **Settings → Pages →
Source: "GitHub Actions"**. Until that is set, deploy runs skip cleanly with a
notice instead of failing. Once enabled, the site is at
`https://lanchinguyen.github.io/portfolio/`.

For a custom domain, set it in Settings → Pages, point DNS at GitHub, and add a
repository variable `SITE_URL` (Settings → Secrets and variables → Actions →
Variables) so social link previews resolve absolutely.

## Contact

lanchib.nguyen@gmail.com
