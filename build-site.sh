#!/usr/bin/env bash
# Assemble the deployable site into _site/.
#
# The source layout is the deployed layout, so this is a copy with no path
# rewriting. Build tooling and captures stay out of the published output.
#
# Usage:  bash build-site.sh
# Env:    SITE_URL (optional) — e.g. https://lananguyen.com
#         When set, og:image URLs are made absolute so link previews work in
#         Slack/LinkedIn/iMessage. The deploy workflow passes the Pages URL.
set -euo pipefail
cd "$(dirname "$0")"

rm -rf _site
mkdir -p _site

cp *.html *.css script.js figures.js favicon.png _site/
# the custom domain must travel with the published artifact, or Pages drops it
[ -f CNAME ] && cp CNAME _site/
cp -r images morsel-docs morsel-proto tenet-proto _site/

# absolute social-preview URLs when a domain is known
if [ -n "${SITE_URL:-}" ]; then
  base="${SITE_URL%/}"
  perl -pi -e "s|content=\"images/|content=\"${base}/images/|g" _site/*.html
fi

printf 'User-agent: *\nAllow: /\n' > _site/robots.txt
touch _site/.nojekyll

echo "built _site: $(find _site -type f | wc -l) files, $(du -sh _site | cut -f1)"
