#!/usr/bin/env bash
# Assemble the deployable site into _site/.
#
# The source layout is the deployed layout, so this is a copy with no path
# rewriting. Build tooling and captures stay out of the published output.
#
# Usage:  bash build-site.sh
# Env:    SITE_URL (optional) — e.g. https://lananguyen.xyz
#           When set, og:image URLs are made absolute so link previews work in
#           Slack/LinkedIn/iMessage. The deploy workflow passes the Pages URL.
#         PREVIEW (optional) — any non-empty value builds the staging variant
#           that gets published under /preview/: a banner on every page,
#           noindex, and no CNAME (the domain belongs to the root build).
set -euo pipefail
cd "$(dirname "$0")"

rm -rf _site
mkdir -p _site

cp *.html *.css script.js figures.js favicon.png _site/
rm -f _site/capture-harness.html          # build tooling, not part of the site
cp -r images morsel-docs morsel-proto tenet-proto _site/

# absolute social-preview URLs when a domain is known
if [ -n "${SITE_URL:-}" ]; then
  base="${SITE_URL%/}"
  perl -pi -e "s|content=\"images/|content=\"${base}/images/|g" _site/*.html
fi

if [ -n "${PREVIEW:-}" ]; then
  # Staging build. Two jobs: keep it out of search results, and make it
  # impossible to mistake a preview tab for the live site. The prototype
  # builds are left alone — a banner injected into those would show up
  # inside the case-study figures.
  export BANNER_HTML='<div style="background:#241f1a;color:#f6f1e7;font:500 12px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.06em;text-transform:uppercase;padding:9px 16px;text-align:center">Preview build &middot; not the live site &middot; <a href="https://lananguyen.xyz/" style="color:#f6f1e7">lananguyen.xyz</a></div>'
  perl -pi -e 's|<body>|"<body>\n" . $ENV{BANNER_HTML}|e' _site/*.html _site/morsel-docs/*.html
  perl -pi -e 's|<meta charset="utf-8" />|<meta charset="utf-8" />\n  <meta name="robots" content="noindex, nofollow" />|' _site/*.html
  printf 'User-agent: *\nDisallow: /\n' > _site/robots.txt
else
  # the custom domain must travel with the published artifact, or Pages drops it
  if [ -f CNAME ]; then cp CNAME _site/; fi
  printf 'User-agent: *\nAllow: /\nDisallow: /preview/\n' > _site/robots.txt
fi

touch _site/.nojekyll

echo "built _site${PREVIEW:+ (preview)}: $(find _site -type f | wc -l) files, $(du -sh _site | cut -f1)"
