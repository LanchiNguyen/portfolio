"""Clean deployable HTML and isolate figure payloads without changing source artifacts."""
from pathlib import Path
from html.parser import HTMLParser
import base64
import hashlib
import json
import os
import re

ROOT = Path(__file__).resolve().parent
SITE = ROOT / '_site'

class DraftSpans(HTMLParser):
    """Find complete draft subtrees while preserving all unrelated source bytes."""
    def __init__(self, source):
        super().__init__(convert_charrefs=False)
        self.source, self.stack, self.cuts = source, [], []
        self.lines = [0] + [m.end() for m in re.finditer('\n', source)]
        self.feed(source)
    def pos(self):
        row,col=self.getpos(); return self.lines[row-1]+col
    def handle_starttag(self, tag, attrs):
        attrs=dict(attrs)
        own=bool(set((attrs.get('class') or '').split()) & {'addm','needs-input'})
        hidden=own or (self.stack[-1][2] if self.stack else False)
        if tag in {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}:
            if own and not (self.stack and self.stack[-1][2]): self.cuts.append((self.pos(),self.pos()+len(self.get_starttag_text())))
        else: self.stack.append((tag,self.pos(),hidden,own and not (self.stack and self.stack[-1][2])))
    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag,attrs)
        if self.stack and self.stack[-1][1] == self.pos():
            n=self.stack.pop()
            if n[3]: self.cuts.append((n[1],self.pos()+len(self.get_starttag_text())))
    def handle_endtag(self, tag):
        for i in range(len(self.stack)-1,-1,-1):
            if self.stack[i][0]==tag:
                n=self.stack[i]
                if n[3]: self.cuts.append((n[1],self.source.index('>',self.pos())+1))
                self.stack=self.stack[:i]; break

def clean_html(source, preview=False):
    spans=DraftSpans(source)
    for start,end in sorted(spans.cuts,reverse=True): source=source[:start]+source[end:]
    source=re.sub(r'<!--(?:(?!-->).)*\[(?:ADD|PLACEHOLDER)(?:(?!-->).)*-->', '',source,flags=re.S)
    if re.search(r'\[(?:PLACEHOLDER|ADD)(?:\s|:)',source,re.I): raise ValueError('Uncontained draft marker in deployable HTML')
    if preview:
        source=re.sub(r'<meta\s+name=["\']robots["\'][^>]*>', '',source,flags=re.I)
        source=re.sub(r'<head\b[^>]*>', lambda m:m.group()+'\n<meta name="robots" content="noindex, nofollow">',source,count=1,flags=re.I)
    return source

def add_site_metadata(source, page_url):
    """Add a canonical link and og:url for one page. Idempotent; a page that already declares a canonical is left alone."""
    if re.search(r'<link\s[^>]*rel=["\']canonical["\']', source, re.I): return source
    tags=f'<link rel="canonical" href="{page_url}" />'
    if not re.search(r'<meta\s[^>]*property=["\']og:url["\']', source, re.I): tags+=f'\n<meta property="og:url" content="{page_url}" />'
    return re.sub(r'</head>', lambda m: tags+'\n'+m.group(), source, count=1, flags=re.I)

def page_url(base, relative):
    """'index.html' is the directory URL; everything else keeps its file name."""
    parts=relative.split('/')
    if parts[-1]=='index.html':
        folder='/'.join(parts[:-1])
        return base+'/'+(folder+'/' if folder else '')
    return base+'/'+'/'.join(parts)

def sitemap_pages():
    """Published pages worth listing: the site pages and the Morsel notes, never the prototype apps, redirect stubs or the 404 page."""
    out=[]
    for page in sorted(SITE.rglob('*.html')):
        rel=page.relative_to(SITE).as_posix()
        if rel.startswith(('tenet-proto/','morsel-proto/')) or page.name=='404.html': continue
        if re.search(r'http-equiv=["\']refresh["\']', page.read_text(), re.I): continue
        out.append(rel)
    return out

def sitemap_xml(urls):
    return ('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            +''.join(f'  <url><loc>{u}</loc></url>\n' for u in urls)+'</urlset>\n')

def prepare():
    preview=bool(os.environ.get('PREVIEW'))
    for page in SITE.rglob('*.html'):
        page.write_text(clean_html(page.read_text(),preview))
    site_url=os.environ.get('SITE_URL','').rstrip('/')
    robots='User-agent: *\nAllow: /\n'
    if site_url and not preview:
        pages=sitemap_pages()
        for rel in pages:
            page=SITE/rel
            page.write_text(add_site_metadata(page.read_text(), page_url(site_url, rel)))
        (SITE/'sitemap.xml').write_text(sitemap_xml([page_url(site_url, rel) for rel in pages]))
        robots+=f'Sitemap: {site_url}/sitemap.xml\n'
    # Crawlers must be able to read noindex; this is staging exclusion, not access control.
    (SITE/'robots.txt').write_text(robots)

    source=(SITE/'figures.js').read_text()
    start=source.index('window.__FIGS = ')+len('window.__FIGS = ')
    figures,end=json.JSONDecoder().raw_decode(source[start:])
    runtime=source[start+end:]
    for page in SITE.glob('*.html'):
        html=page.read_text()
        keys=set(re.findall(r'data-fig="([^"]+)"',html))
        if not keys: continue
        missing=keys-set(figures)
        if missing: raise ValueError(f'{page.name}: unknown figures {missing}')
        bundle=f'figures-{page.stem}.js'
        subset={key:figures[key] for key in sorted(keys)}
        (SITE/bundle).write_text('/* Captured illustrative states; live demos load separately. */\nwindow.__FIGS = '+json.dumps(subset,separators=(',',':'))+runtime)
        html=html.replace('src="figures.js"',f'src="{bundle}"')
        page.write_text(html)
    # Keep font declarations/weights intact; duplicate bytes share one cacheable URL.
    fonts=(SITE/'figures-fonts.css').read_text()
    directory=SITE/'fonts';directory.mkdir(exist_ok=True)
    def font_url(match):
        raw=base64.b64decode(match.group(2))
        extension='woff2' if raw[:4]==b'wOF2' else 'woff' if raw[:4]==b'wOFF' else 'ttf'
        name=hashlib.sha256(raw).hexdigest()[:16]+'.'+extension
        (directory/name).write_bytes(raw)
        return 'url("fonts/'+name+'")'
    fonts=re.sub(r'url\(["\']?data:([^;,]+);base64,([A-Za-z0-9+/=]+)["\']?\)',font_url,fonts)
    (SITE/'figures-fonts.css').write_text(fonts)
    if 'base64,' in fonts: raise ValueError('An embedded font was not externalized')
    # Generated source bundle is not needed by any published page after partitioning.
    (SITE/'figures.js').unlink()

if __name__=='__main__': prepare()
