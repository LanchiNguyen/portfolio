"""Run after build-site.sh; exercises draft filtering and the deployable output."""
import importlib.util
import os
from pathlib import Path
import re
import unittest
from html.parser import HTMLParser
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('prepare_site', ROOT / 'prepare-site.py')
prepare_site = importlib.util.module_from_spec(spec)
spec.loader.exec_module(prepare_site)

class Document(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.refs, self.ids, self.robots = [], set(), []
        self.feed(source)
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs: self.ids.add(attrs['id'])
        for key in ('src', 'href', 'poster', 'data-src', 'data-poster'):
            if attrs.get(key): self.refs.append(attrs[key])
        if tag == 'meta' and attrs.get('name') == 'robots':
            self.robots.append(attrs.get('content', ''))

class BuildTests(unittest.TestCase):
    def test_draft_subtrees_removed_without_losing_retrospective_context(self):
        source = '<p>Retrospective reconstruction.</p><div class="needs-input"><p>[PLACEHOLDER — VERIFY: private]</p><div>nested<img src="x"></div></div><p>Proposed, not measured.</p>'
        self.assertEqual(prepare_site.clean_html(source), '<p>Retrospective reconstruction.</p><p>Proposed, not measured.</p>')
    def test_uncontained_marker_fails_build(self):
        with self.assertRaises(ValueError): prepare_site.clean_html('<p>[PLACEHOLDER — VERIFY: claim]</p>')
    def test_preview_handles_different_head_and_meta_formats(self):
        output = prepare_site.clean_html("<html><HEAD><meta charset='utf-8'><meta name='robots' content='index'></HEAD></html>", True)
        self.assertEqual(Document(output).robots, ['noindex, nofollow'])
    def test_all_published_html_is_clean_and_links_resolve(self):
        site = ROOT / '_site'
        pages = {p: Document(p.read_text()) for p in site.rglob('*.html')}
        self.assertGreater(len(pages), 20)
        for page, doc in pages.items():
            source = page.read_text()
            self.assertNotRegex(source, r'\[(?:PLACEHOLDER|ADD)(?:\s|:)')
            if os.environ.get('PREVIEW'): self.assertIn('noindex, nofollow', doc.robots, page.name)
            for ref in doc.refs:
                url = urlsplit(ref)
                if url.scheme or url.netloc: continue
                target = (site / unquote(url.path).lstrip('/')) if url.path.startswith('/') else page.parent / unquote(url.path)
                if not url.path: target = page
                if target.is_dir(): target = target / 'index.html'
                self.assertTrue(target.exists(), f'{page.relative_to(site)} -> {ref}')
                if url.fragment and target.suffix == '.html':
                    self.assertIn(unquote(url.fragment), pages[target.resolve()].ids, f'{page.name} -> {ref}')
        for name, phrase in [('heyperiod.html', 'retrospective'), ('nhathuong.html', 'reconstructed'), ('mug.html', 'Retrospective'), ('chatter.html', 'Retrospective')]:
            self.assertIn(phrase, (site / name).read_text())
    def test_production_runtime_and_figure_payloads(self):
        site = ROOT / '_site'
        entry = (site / 'morsel-proto/index.html').read_text()
        self.assertNotRegex(entry, r'text/babel|development\.js|babel\.min')
        self.assertIn('app.bundle.js', entry)
        self.assertFalse((site / 'morsel-proto/vendor/babel.min.js').exists())
        self.assertFalse((site / 'morsel-proto/v3').exists())
        self.assertFalse(list((site / 'morsel-proto').rglob('*.jsx')))
        self.assertTrue((site / 'morsel-proto/v4/app/styles.css').exists())
        self.assertFalse((site / 'figures.js').exists())
        self.assertNotIn('base64,', (site / 'figures-fonts.css').read_text())
        for page in ('morsel', 'tenet'):
            self.assertIn(f'figures-{page}.js', (site / (page + '.html')).read_text())
        self.assertNotIn('morsel-v31-', (site / 'figures-tenet.js').read_text())
        self.assertNotIn('tenet-mon-', (site / 'figures-morsel.js').read_text())

    def test_site_metadata_helpers(self):
        page = '<html><head><meta property="og:image" content="x"></head></html>'
        once = prepare_site.add_site_metadata(page, 'https://example.test/about.html')
        self.assertIn('<link rel="canonical" href="https://example.test/about.html" />', once)
        self.assertIn('<meta property="og:url" content="https://example.test/about.html" />', once)
        self.assertEqual(prepare_site.add_site_metadata(once, 'https://example.test/other.html'), once)
        self.assertEqual(prepare_site.page_url('https://example.test', 'index.html'), 'https://example.test/')
        self.assertEqual(prepare_site.page_url('https://example.test', 'morsel-docs/wireflow.html'), 'https://example.test/morsel-docs/wireflow.html')
        self.assertIn('<loc>https://example.test/</loc>', prepare_site.sitemap_xml(['https://example.test/']))

    def test_site_metadata_in_output_follows_site_url(self):
        site = ROOT / '_site'
        base = os.environ.get('SITE_URL', '').rstrip('/')
        preview = bool(os.environ.get('PREVIEW'))
        index = (site / 'index.html').read_text()
        robots = (site / 'robots.txt').read_text()
        if base and not preview:
            self.assertIn(f'<link rel="canonical" href="{base}/" />', index)
            self.assertIn(f'<meta property="og:url" content="{base}/" />', index)
            sitemap = (site / 'sitemap.xml').read_text()
            self.assertIn(f'<loc>{base}/</loc>', sitemap)
            self.assertIn(f'<loc>{base}/mug.html</loc>', sitemap)
            self.assertNotIn('404.html', sitemap)
            self.assertNotIn('tenet-proto', sitemap)
            self.assertNotIn('tenet-new.html', sitemap)
            self.assertIn(f'Sitemap: {base}/sitemap.xml', robots)
        else:
            self.assertNotIn('rel="canonical"', index)
            self.assertFalse((site / 'sitemap.xml').exists())
            self.assertNotIn('Sitemap:', robots)

    def test_not_found_page_and_unused_vendor_bundles(self):
        site = ROOT / '_site'
        self.assertTrue((ROOT / 'tenet-proto/vendor/babel.min.js').exists())   # capture tooling keeps its copy
        self.assertFalse((site / 'tenet-proto/vendor/babel.min.js').exists())
        for page in site.glob('tenet-proto/*.html'):
            self.assertNotIn('babel', page.read_text().lower(), page.name)
        if os.environ.get('PREVIEW'):
            self.assertFalse((site / '404.html').exists())
        else:
            doc = Document((site / '404.html').read_text())
            self.assertIn('noindex', ' '.join(doc.robots))
            self.assertTrue(all(ref.startswith(('/', 'https://', 'mailto:', '#')) for ref in doc.refs), doc.refs)

    def test_published_images_have_consumers(self):
        site = ROOT / '_site'
        text = '\n'.join(p.read_text() for p in site.rglob('*')
                         if p.suffix in {'.html', '.css', '.js'})
        for image in (site / 'images').rglob('*'):
            if not image.is_file(): continue
            # Morsel constructs photo URLs from fixture IDs plus '.webp'.
            reference = image.stem if image.parent.name == 'morsel-photos' else image.name
            self.assertIn(reference, text, f'Unreferenced published asset: {image.relative_to(site)}')

if __name__ == '__main__': unittest.main()
