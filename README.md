# Lana Nguyen — Portfolio

A product and UX design portfolio. Static HTML, CSS, and a little JavaScript: no
framework, no build step required to view it. Open `index.html` in a browser, or
serve the folder with `python3 -m http.server`.

Selected work leads with **Tenet**, **Morsel**, then **Hey Period**. Matrix and
Nhat Huong are supporting cases; Mug and Chatter remain available as earlier
concepts linked from About. The IKEA title and April 2025 start are owner-confirmed. Full employment scope,
a current résumé and a professional profile link remain owner-supplied updates.

Plus `about.html` and `sketchbook.html` (illustration and painting).

## Two things worth knowing

**The prototypes are real.** Tenet and Morsel ship as working builds in
`tenet-proto/` and `morsel-proto/`. The "Try the prototype" section on each case
study runs the actual application in the page — you can trigger a Dart
intervention or walk Morsel's visual menu: nearby dishes, the restaurant picker, a menu
with photos and "No photo yet" rows, a dish page with labeled photo sources, and a
compare shortlist.

**Evidence has limits.** Concept data is simulated, new validation plans are
proposed, and reasoning reconstructed later stays visibly retrospective.
Unsupported participant counts, quotations and rollout claims are removed.
Tenet and Morsel are working concept prototypes, not shipped products or
completed user studies. Build-time filtering removes entire working-note
subtrees and rejects uncontained draft markers; `?draft` cannot reveal them.

## Layout

```
index.html, *.html        the site
styles.css, script.js     shared styles and behavior
figures.js / .css         captured illustrative DOM states, not interactive demos
tenet-proto/              the Tenet build (host, desktop, companion)
morsel-proto/             the current Morsel visual-menu build (index.html + v4/app)
morsel-docs/             process documents: wireflow, explorations, DS addendum, testing plan
images/                   photography and remaining rasters
```

### Case-study figures

The lower case-study figures are fixed snapshots of rendered DOM. They do not
respond to clicks; the separate top demo embeds run the actual apps. `capture-figures.cjs` drives
the real prototypes to the state each caption describes and serialises the
rendered DOM; `build-figures.mjs` turns those captures into `figures.js` and
`figures.css`. The figures scale with a CSS transform, so they stay sharp at any
zoom or pixel ratio. Photographs stay raster and rehydrate from one shared map
rather than being duplicated into each figure.

To regenerate after changing a prototype:

```bash
node capture-figures.cjs        # drive the prototypes, write figures.json
node build-figures.mjs          # emit figures.js / figures.css
node build-live-figures-into-pages.mjs   # replace lower illustrations with DOM snapshots
```

The Morsel recipes drive the v4 visual-menu prototype through `window.morselDebug`;
`ONLY=morsel` re-captures Morsel while keeping the previous Tenet captures, and
`KEEP_MORSEL` in `capture-figures.cjs` lists the one earlier-exploration capture (the
nearby-dish feed) carried over from a previous figures.json because the prototype no
longer has that screen. The capture harness loads `morsel-bundle.js` from the repo
root: the sentinel bundle `build-morsel-bundle.cjs` writes, in which photos travel as
ids. `tests/morsel.test.cjs` boots `data.js` and `app.jsx` with the vendored Babel and
checks the fixture contract, menu order, photo sources, ingredient lines, the
three-dish shortlist and defensive state loading without a browser.

The supported review and publishing path is `build-site.sh`. The obsolete
Morsel v3 source, superseded raster assets, and old one-file exporter have been
removed from the current tree; Git history preserves them. Current capture
recipes and their figure data remain because they document inspectable states,
including the earlier-feed figure explicitly discussed in the Morsel case.

Compatibility redirects remain intentionally: old Tenet links should open the
current case or prototype rather than break. They contain no older application.
The preview branch is also intentional: it supports the staging editor and is
excluded from search indexing.

## Deploy

`build-site.sh` assembles `_site/` using Node.js and Python 3. It precompiles
Morsel JSX with the checked-in Babel version and serves production React,
partitions figure data per case and externalizes duplicated fonts. No dependency
download is needed. Run `node build-figures.mjs` after editing `figures.json`.

`tenet.html` is the canonical case study. `tenet-new.html` and the old prototype
URLs redirect to the reviewed case and matching `*-new.html` live builds while
preserving query strings and anchors.

Verify before publishing:

```bash
node stamp-editable.mjs --check
node --test tests/*.test.cjs
bash build-site.sh
python3 tests/site-build.test.py
PREVIEW=1 bash build-site.sh
PREVIEW=1 python3 tests/site-build.test.py
```

The generated `_site/` directory is not committed. The workflow in `.github/workflows/deploy.yml` publishes
it to GitHub Pages.

Two branches publish to one Pages site:

| Branch | URL | What it is |
|--------|-----|------------|
| `main` | `https://lananguyen.xyz/` | the live site |
| `preview` | `https://lananguyen.xyz/preview/` | staging: page banner and `noindex` on every HTML document |

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
saved, and preview HTML carries `noindex`. Crawling remains allowed so search engines
can read that directive; staging is public, not access-controlled.

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
