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
it to GitHub Pages.

Two branches publish to one Pages site:

| Branch | URL | What it is |
|--------|-----|------------|
| `main` | `https://lananguyen.xyz/` | the live site |
| `preview` | `https://lananguyen.xyz/preview/` | staging: banner on every page, `noindex`, excluded in `robots.txt` |

A push to **either** branch rebuilds **both**, because a Pages deploy replaces
the entire published artifact — uploading only one would delete the other.
Pages only lets its `github-pages` environment deploy from the default branch,
so a push to `preview` is handled by `restage-preview.yml`, which asks the
deploy workflow to run on `main` and pick the preview content up from there.

Working on a change:

```bash
git checkout preview
git merge main          # start from what's live
# ...edit, commit...
git push                # visible at /preview/ in about a minute
```

When it looks right, merge it down:

```bash
git checkout main && git merge preview && git push
```

`preview` is optional. Delete the branch and the staging build simply stops
being published; production is unaffected.

## Editing pages in the browser

Add `?edit` to any preview URL — `https://lananguyen.xyz/preview/tenet.html?edit`
— and the page becomes editable in place. Click text and type. Images carry
**ALT** and **PHOTO** badges: retype the alt text, or pick (or drag in) a
replacement photo, which is resized to 2× its rendered width and encoded as
webp. **Reorder** turns the homepage cards into drag handles.

**Save** writes one commit to `preview`. The live site is untouched until you
merge. There is no editor on the live site at all: `build-site.sh` ships
`editor.js` only in the preview build.

Saving needs a GitHub token — the **Token** button explains it. Create a
fine-grained token at *Settings → Developer settings → Personal access tokens →
Fine-grained*, restricted to this one repository, with **Contents: Read and
write**. It is kept in that browser's local storage and used only to commit to
`preview`. Anyone can open `?edit` and type; without a token, nothing can be
saved, and the preview site is `noindex` and disallowed in `robots.txt`.

What the editor deliberately will not touch: layout, spacing, colors, the
generated case-study figures, and the prototypes. Those stay code. Evidence
labels (`MEASURED`, `SIMULATED`, …) are frozen as single units inside editable
text, and deleting one prompts a confirmation before it can be committed.

### How an edit finds its way back to the source

Every editable element carries `data-ed="N"`, added to the source by
`stamp-editable.mjs`. The editor fetches the file's source, finds that
attribute, and rewrites only the bytes inside that one element — the file is
never re-serialised, so a one-word change is a one-line diff. `build-site.sh`
strips `data-ed` from the production build.

Re-run the stamper after adding or removing content:

```bash
node stamp-editable.mjs           # write stamps
node stamp-editable.mjs --check   # exit 1 if anything is unstamped
```

GitHub Pages needs one manual switch the first time: **Settings → Pages →
Source: "GitHub Actions"**. Until that is set, deploy runs skip cleanly with a
notice instead of failing. Once enabled, the site is at
`https://lanchinguyen.github.io/portfolio/`.

For a custom domain, set it in Settings → Pages, point DNS at GitHub, and add a
repository variable `SITE_URL` (Settings → Secrets and variables → Actions →
Variables) so social link previews resolve absolutely.

## Contact

lanchib.nguyen@gmail.com
