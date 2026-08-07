import { readFileSync, writeFileSync } from 'fs';
const S = process.env.S;
const css = readFileSync('styles.css','utf8');
const js = readFileSync('script.js','utf8');
const fonts = readFileSync(S+'/fonts-inline.css','utf8');
const fraunces = readFileSync(S+'/fonts-tasting-inline.css','utf8');
const worksans = readFileSync(S+'/fonts-body-inline.css','utf8');
const protoFonts = readFileSync(S+'/proto-fonts-inline.css','utf8');
/* live prototype figures: the case-study screens are the prototypes' own markup,
   rendered as DOM instead of shipped as rasters (see build-figures.mjs) */
const figuresCss = readFileSync('figures.css','utf8');
const figuresJs  = readFileSync('figures.js','utf8');

/* ship only the typefaces the portfolio or a prototype actually references —
   drops leftovers from the earlier type-exploration phase (pure dead weight) */
function keepUsedFaces(cssText, corpus) {
  const blocks = cssText.match(/@font-face\{[^}]*\}/g) || [];
  const kept = [];
  const seen = new Set();
  for (const b of blocks) {
    const m = /font-family:\s*'([^']+)'/.exec(b);
    if (!m) continue;
    const fam = m[1];
    const wm = /font-weight:\s*(\d+)/.exec(b);
    const sm = /font-style:\s*([a-z]+)/.exec(b);
    const key = fam + '|' + (wm ? wm[1] : '400') + '|' + (sm ? sm[1] : 'normal');
    if (seen.has(key)) continue;                 // de-dup identical faces across sources
    if (!corpus.includes(fam)) continue;         // family never referenced anywhere
    if (/url\(\s*https?:/.test(b)) continue;     // remote src would be CSP-blocked; self-contained only
    seen.add(key); kept.push(b);
  }
  return kept.join('\n');
}
/* emit a script element safely: the body may contain '</script' (which would close the
   element early) but the closing tag itself must be literal, never escaped. */
const scriptBlock = (body) => '<script>' + String(body).replace(/<\/script/gi, '<\\/script') + '</' + 'script>';
const grab = (s, sel) => s.slice(s.indexOf(sel), s.indexOf('\n  </div>\n\n  <script'));
const anchorize = s => s
  .replace(/href="tenet\.html#try"/g,'href="#tenet-try"')
  .replace(/href="morsel\.html#try"/g,'href="#morsel-try"')
  .replace(/href="([a-z-]+)\.html#[a-z-]+"/g, (m, page) => page === 'index' ? m : 'href="#' + page + '"')
  .replace(/href="index\.html#home-work"/g,'href="#home-work"')
  .replace(/href="index\.html#home-about"/g,'href="#home-about"')
  .replace(/href="index\.html#home-contact"/g,'href="#home-contact"')
  .replace(/href="about\.html"/g,'href="#about"')
  .replace(/href="mug\.html"/g,'href="#mug"')
  .replace(/href="chatter\.html"/g,'href="#chatter"')
  .replace(/href="matrix\.html"/g,'href="#matrix"')
  .replace(/href="heyperiod\.html"/g,'href="#heyperiod"')
  .replace(/href="tenet\.html"/g,'href="#tenet"')
  .replace(/href="morsel\.html"/g,'href="#morsel"')
  .replace(/href="nhathuong\.html"/g,'href="#nhathuong"')
  .replace(/href="sketchbook\.html"/g,'href="#sketchbook"')
  .replace(/href="index\.html"/g,'href="#home"');

const home = anchorize(grab(readFileSync('index.html','utf8'), '<div class="page" id="home">'));
const tn = anchorize(grab(readFileSync('tenet.html','utf8'), '<div class="page" id="project">')).replace('id="project"','id="tenet"').replace(' id="case"',' id="tenet-case"').replace('id="try"','id="tenet-try"');
const morsel = anchorize(grab(readFileSync('morsel.html','utf8'), '<div class="page" id="project">')).replace('id="project"','id="morsel"').replace(' id="case"',' id="morsel-case"').replace('id="try"','id="morsel-try"');
const hp = anchorize(grab(readFileSync('heyperiod.html','utf8'), '<div class="page" id="project">')).replace('id="project"','id="heyperiod"').replace(' id="case"',' id="heyperiod-case"');
const nh = anchorize(grab(readFileSync('nhathuong.html','utf8'), '<div class="page" id="project">')).replace('id="project"','id="nhathuong"').replace(' id="case"',' id="nhathuong-case"');
const mug = anchorize(grab(readFileSync('mug.html','utf8'), '<div class="page" id="project">')).replace('id="project"','id="mug"').replace(' id="case"',' id="mug-case"');
const mx = anchorize(grab(readFileSync('matrix.html','utf8'), '<div class="page" id="project">')).replace('id="project"','id="matrix"').replace(' id="case"',' id="matrix-case"');
const ch = anchorize(grab(readFileSync('chatter.html','utf8'), '<div class="page" id="project">')).replace('id="project"','id="chatter"').replace(' id="case"',' id="chatter-case"');
const sk = anchorize(grab(readFileSync('sketchbook.html','utf8'), '<div class="page" id="sketchbook">'));
const ab = anchorize(grab(readFileSync('about.html','utf8'), '<div class="page" id="about">'));

/* ---------------- prototype theater payloads (canonical source, verbatim) ---------------- */
const stripFontLinks = t => t.replace(/<link[^>]*fonts\.g(?:oogleapis|static)\.com[^>]*>\s*/g, '');
const bodyBg = t => { const m = /body\s*\{[^}]*background:\s*([^;}]+)/.exec(t); return m ? m[1].trim() : '#111'; };
const tenetPages = {};
for (const key of ['host','desktop','companion']) {
  const raw = stripFontLinks(readFileSync('tenet-proto/'+key+'.html','utf8'));
  tenetPages[key] = { raw, bg: bodyBg(raw) };
}
const supportJs = readFileSync('tenet-proto/support.js','utf8');
const morselIndex = readFileSync('morsel-proto/index.html','utf8');
const morselPageCss = (/<style>([\s\S]*?)<\/style>/.exec(morselIndex)||[,''])[1];
const PROTO = {
  support: supportJs,
  tenet: { host: tenetPages.host.raw, desktop: tenetPages.desktop.raw, companion: tenetPages.companion.raw },
  tenetBg: { host: tenetPages.host.bg, desktop: tenetPages.desktop.bg, companion: tenetPages.companion.bg },
  morselBundle: readFileSync(S+'/morsel-bundle.js','utf8'),
  morselCss: readFileSync('morsel-proto/v3/app/styles.css','utf8'),
  morselPageCss, morselBg: '#EDE6D8'
};

/* canonical Morsel photos, vendored from the live prototype's own sources and
   keyed by their canonical IDs; u() resolves from this map instead of a remote host */
import { readdirSync } from 'fs';
const morselPhotos = {};
for (const f of readdirSync('images/morsel-photos')) {
  morselPhotos[f.replace(/\.webp$/,'')] = 'data:image/webp;base64,' + readFileSync('images/morsel-photos/' + f).toString('base64');
}
PROTO.morselPhotos = morselPhotos;
const protoJson = JSON.stringify(PROTO).replace(/<\//g, '<\\/');
const reactJs = readFileSync('tenet-proto/vendor/react.production.min.js','utf8');
const reactDomJs = readFileSync('tenet-proto/vendor/react-dom.production.min.js','utf8');

/* launcher markup that replaces each #try stage in the artifact */
const tenetLauncher = `
        <div class="pt-stage rv" data-proj="tenet">
          <div class="demo-head">
            <div class="demo-tabs" role="tablist" aria-label="Prototype surface">
              <button class="demo-tab pt-tab" role="tab" aria-selected="true" data-key="host">DART &middot; MOBILE</button>
              <button class="demo-tab pt-tab" role="tab" aria-selected="false" data-key="desktop">MERIDIAN &middot; DESKTOP</button>
              <button class="demo-tab pt-tab" role="tab" aria-selected="false" data-key="companion">COMPANION</button>
            </div>
          </div>
          <div class="pt-frame">
            <img class="pt-poster" src="../images/tenet/stage-dart.webp" alt="The Dart host prototype stage — scenario tabs, the dark Dart phone with a staged 12-contract order, and the try-this instructions" width="1600" height="1000" />
            <button class="pt-launch">&#9654;&ensp;LAUNCH THE REAL PROTOTYPE &mdash; RUNS IN THIS PAGE</button>
          </div>
          <p class="demo-note-txt" style="margin-top:9px">THE ACTUAL BUILD, EXECUTED IN THIS DOCUMENT &middot; OPENS FULL-SCREEN, CLOSE RETURNS HERE &middot; DART &amp; MERIDIAN ARE FICTIONAL &middot; SIMULATED DATA</p>
        </div>`;
const morselLauncher = `
        <div class="pt-stage rv" data-proj="morsel">
          <div class="demo-head">
            <span class="demo-kicker">MORSEL V3 &middot; FULL FLOW</span>
          </div>
          <div class="pt-frame is-phone">
            <img class="pt-poster" src="../images/morsel/stage-morsel.webp" alt="The Morsel v3 prototype welcome screen — 'Eat with your eyes' over a dish photo grid" width="430" height="900" />
            <button class="pt-launch">&#9654;&ensp;LAUNCH THE REAL PROTOTYPE &mdash; RUNS IN THIS PAGE</button>
          </div>
          <p class="demo-note-txt" style="margin-top:9px">THE ACTUAL V3 BUILD, EXECUTED IN THIS DOCUMENT &middot; OPENS FULL-SCREEN, CLOSE RETURNS HERE &middot; ILLUSTRATIVE DATA &middot; ALLERGY-AWARE, NEVER &ldquo;ALLERGY-SAFE&rdquo;</p>
        </div>`;

const theaterCss = `
/* prototype theater (artifact) */
.pt-frame { position: relative; border-radius: 18px; overflow: hidden; border: 1px solid rgba(74,59,44,0.2); box-shadow: 0 22px 44px rgba(30,18,8,0.16); }
.pt-frame.is-phone { max-width: 380px; margin: 0 auto; border-radius: 26px; }
.pt-poster { display: block; width: 100%; height: auto; }
.pt-launch { position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); font: 600 12px/1.4 "IBM Plex Mono",monospace; letter-spacing: .1em; padding: 14px 20px; border-radius: 999px; border: 1.5px solid rgba(255,255,255,.55); background: rgba(16,19,24,.85); color: #F2EDE2; cursor: pointer; max-width: 86%; }
.pt-launch:hover { background: rgba(16,19,24,.97); }
.pt-launch:focus-visible, .pt-tab:focus-visible, .pt-close:focus-visible { outline: 2.5px solid #8F535C; outline-offset: 2px; }
.pt-overlay { position: fixed; inset: 0; z-index: 999; display: flex; flex-direction: column; background: #101318; }
.pt-bar { flex: none; display: flex; align-items: center; gap: 12px; padding: 10px 16px; background: #16120E; color: #EFE9DC; flex-wrap: wrap; }
.pt-bar .t { font: 600 11px "IBM Plex Mono",monospace; letter-spacing: .16em; }
.pt-bar .d { font: 500 9.5px "IBM Plex Mono",monospace; letter-spacing: .08em; color: #B9AE9C; }
.pt-bar .pt-tab { border-color: rgba(239,233,220,.4); color: #EFE9DC; }
.pt-bar .pt-tab[aria-selected="true"] { background: #EFE9DC; color: #16120E; border-color: #EFE9DC; }
.pt-close { margin-left: auto; font: 600 11px "IBM Plex Mono",monospace; letter-spacing: .1em; padding: 9px 16px; border-radius: 999px; border: 1.5px solid rgba(239,233,220,.55); background: transparent; color: #EFE9DC; cursor: pointer; }
.pt-close:hover { background: rgba(239,233,220,.14); }
.pt-slot { flex: 1; overflow: auto; -webkit-overflow-scrolling: touch; }
.pt-boot { padding: 40px; font: 600 11px "IBM Plex Mono",monospace; letter-spacing: .14em; color: #B9AE9C; }
@media (max-width: 700px) { .pt-bar { padding: 8px 10px; } .pt-bar .d { display: none; } }
`;

const theaterJs = `
(function () {
  var P = window.__PROTO; if (!P) return;
  var TITLES = { host: "TENET \\u2014 DART HOST \\u00b7 REAL PROTOTYPE", desktop: "TENET \\u2014 MERIDIAN DESKTOP \\u00b7 REAL PROTOTYPE", companion: "TENET \\u2014 COMPANION \\u00b7 REAL PROTOTYPE", morsel: "MORSEL V3 \\u00b7 REAL PROTOTYPE" };
  var DISC = { host: "SIMULATED DATA \\u00b7 FICTIONAL BROKER \\u00b7 NOT SHIPPED", desktop: "SIMULATED DATA \\u00b7 FICTIONAL BROKER \\u00b7 NOT SHIPPED", companion: "SIMULATED DATA \\u00b7 NOT SHIPPED", morsel: "ILLUSTRATIVE DATA \\u00b7 ALLERGY-AWARE, NEVER \\u201cALLERGY-SAFE\\u201d \\u00b7 NOT SHIPPED" };
  var marks = null, hidden = [], restoreFocus = null, savedScroll = 0, overlay = null;

  function snapshot() { return { head: Array.prototype.slice.call(document.head.children), body: Array.prototype.slice.call(document.body.children) }; }
  function cleanup() {
    if (!marks) return;
    Array.prototype.slice.call(document.head.children).forEach(function (n) { if (marks.head.indexOf(n) < 0) n.remove(); });
    Array.prototype.slice.call(document.body.children).forEach(function (n) { if (marks.body.indexOf(n) < 0) n.remove(); });
    overlay = null;
  }
  function close() {
    cleanup(); marks = null;
    hidden.forEach(function (h) { h.el.style.display = h.d; }); hidden = [];
    document.documentElement.style.overflow = "";
    window.scrollTo(0, savedScroll);
    if (restoreFocus) { try { restoreFocus.focus(); } catch (e) {} restoreFocus = null; }
  }
  function guardLinks(root) {
    root.addEventListener("click", function (e) {
      var a = e.target && e.target.closest ? e.target.closest("a") : null;
      if (!a) return;
      var h = a.getAttribute("href") || "";
      if (/\\.html(\\?|#|$)/.test(h) || /^https?:/.test(h)) e.preventDefault();
    }, true);
  }
  function buildOverlay(proj, key) {
    overlay = document.createElement("div");
    overlay.className = "pt-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", TITLES[key] || TITLES[proj]);
    var bar = document.createElement("div"); bar.className = "pt-bar";
    var closeBtn = document.createElement("button"); closeBtn.className = "pt-close"; closeBtn.textContent = "CLOSE \\u2715 \\u2014 BACK TO CASE STUDY";
    closeBtn.addEventListener("click", close);
    var t = document.createElement("span"); t.className = "t"; t.textContent = "\\u25c6 " + (TITLES[key] || TITLES[proj]);
    var d = document.createElement("span"); d.className = "d"; d.textContent = DISC[key] || DISC[proj];
    bar.appendChild(t);
    if (proj === "tenet") {
      ["host", "desktop", "companion"].forEach(function (k) {
        var b = document.createElement("button");
        b.className = "demo-tab pt-tab"; b.setAttribute("role", "tab");
        b.setAttribute("aria-selected", k === key ? "true" : "false");
        b.textContent = k === "host" ? "DART" : k === "desktop" ? "MERIDIAN" : "COMPANION";
        b.addEventListener("click", function () { switchTo(proj, k, b.textContent); });
        bar.appendChild(b);
      });
    }
    bar.appendChild(d); bar.appendChild(closeBtn);
    var slot = document.createElement("div"); slot.className = "pt-slot";
    slot.innerHTML = '<div class="pt-boot">BOOTING THE REAL PROTOTYPE\\u2026</div>';
    overlay.appendChild(bar); overlay.appendChild(slot);
    guardLinks(overlay);
    document.body.appendChild(overlay);
    return { slot: slot, closeBtn: closeBtn };
  }
  function addStyle(cssText) { var st = document.createElement("style"); st.textContent = cssText; document.head.appendChild(st); }
  function mountInto(proj, key, slot, ui) {
    try {
      if (proj === "tenet") {
        slot.style.background = P.tenetBg[key] || "#DEE6EB";
        var doc = new DOMParser().parseFromString(P.tenet[key], "text/html");
        var xdc = doc.querySelector("x-dc");
        var dcScript = doc.querySelector("script[data-dc-script]");
        xdc.querySelectorAll("helmet style").forEach(function (st) { addStyle(st.textContent); });
        slot.innerHTML = "";
        slot.appendChild(document.importNode(xdc, true));
        var sc = document.createElement("script");
        sc.type = "text/x-dc"; sc.setAttribute("data-dc-script", "");
        var dp = dcScript.getAttribute("data-props"); if (dp) sc.setAttribute("data-props", dp);
        sc.textContent = dcScript.textContent;
        slot.appendChild(sc);
        window.__resources = window.__resources || {};
        new Function(P.support)();           /* the real dc runtime, verbatim */
      } else {
        slot.style.background = P.morselBg;
        addStyle(P.morselCss);
        addStyle(P.morselPageCss.replace(/html,\\s*body/g, ".pt-slot"));
        slot.innerHTML = '<div id="root"></div>';
        window.__MORSEL_PHOTOS = P.morselPhotos;\n        new Function("React", "ReactDOM", P.morselBundle)(window.React, window.ReactDOM);  /* canonical v3 app, precompiled; photos vendored */
      }
    } catch (err) {
      slot.innerHTML = '<div class="pt-boot">PROTOTYPE FAILED TO BOOT \\u2014 ' + String(err).slice(0, 120) + "</div>";
    }
  }
  function switchTo(proj, key, focusLabel) {
    cleanup();
    var ui = buildOverlay(proj, key);
    mountInto(proj, key, ui.slot, ui);
    var sel = Array.prototype.filter.call(overlay.querySelectorAll(".pt-tab"), function (b) { return b.textContent === focusLabel; })[0];
    (sel || ui.closeBtn).focus();
  }
  function open(proj, key, launchBtn) {
    restoreFocus = launchBtn;
    savedScroll = window.scrollY;
    marks = snapshot();
    hidden = [];
    Array.prototype.slice.call(document.body.children).forEach(function (el) {
      hidden.push({ el: el, d: el.style.display });
      el.style.display = "none";
    });
    document.documentElement.style.overflow = "hidden";
    var ui = buildOverlay(proj, key);
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      mountInto(proj, key, ui.slot, ui);
      ui.closeBtn.focus();
    }); });
  }

  document.querySelectorAll(".pt-stage").forEach(function (stage) {
    var proj = stage.getAttribute("data-proj");
    var tabs = stage.querySelectorAll(".pt-tab");
    var selKey = function () {
      var t = stage.querySelector('.pt-tab[aria-selected="true"]');
      return t ? t.getAttribute("data-key") : "morsel";
    };
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) { t.setAttribute("aria-selected", t === tab ? "true" : "false"); });
      });
    });
    var btn = stage.querySelector(".pt-launch");
    if (btn) btn.addEventListener("click", function () { open(proj, proj === "tenet" ? selKey() : "morsel", btn); });
  });
})();
`;

let out =
  '<title>Lana Nguyen — Portfolio v2 · Live Prototypes</title>\n' +
  '<style>\n' + keepUsedFaces(fonts + fraunces + worksans + protoFonts, css + theaterCss + figuresCss + figuresJs + home + tn + morsel + hp + nh + mug + mx + ch + sk + ab + PROTO.morselCss + PROTO.morselPageCss + PROTO.tenet.host + PROTO.tenet.desktop + PROTO.tenet.companion) + '\n' + css + '\n' + theaterCss + '\n' + figuresCss + '\n</style>\n' +
  '<a class="skip-link" href="#home-work">Skip to work</a>\n' +
  '<div class="desk">\n' + home + '\n' + tn + '\n' + morsel + '\n' + hp + '\n' + nh + '\n' + mug + '\n' + mx + '\n' + ch + '\n' + sk + '\n' + ab + '\n' + '\n</div>\n' +
  '<button id="draftToggle" style="position:fixed;right:16px;bottom:16px;z-index:99;font:600 10.5px/1 IBM Plex Mono,monospace;letter-spacing:.1em;padding:9px 13px;border-radius:999px;border:1.5px dashed rgba(94,69,38,.55);background:rgba(239,217,160,.92);color:#5E4526;cursor:pointer">SHOW [ADD] PUNCH LIST</button>\n' +
  '<script>\n' + js + '\ndocument.getElementById("draftToggle").addEventListener("click",function(){var on=document.documentElement.classList.toggle("draft");this.textContent=on?"HIDE [ADD] PUNCH LIST":"SHOW [ADD] PUNCH LIST";});\n</script>\n';

/* swap each #try stage's demo apparatus for the theater launcher (artifact only) */
out = out.replace(/(<section class="proj-sec" id="tenet-try" aria-label="Try the Tenet prototype">\n        <div class="rule"><\/div>\n        <div class="sechead">[\s\S]*?<\/div>)\n[\s\S]*?\n      <\/section>/,
  '$1\n' + tenetLauncher + '\n      </section>');
out = out.replace(/(<section class="proj-sec" id="morsel-try" aria-label="Try the Morsel prototype">\n        <div class="rule"><\/div>\n        <div class="sechead">[\s\S]*?<\/div>)\n[\s\S]*?\n      <\/section>/,
  '$1\n' + morselLauncher + '\n      </section>');

/* inline images */
const imgMap = {};
out = out.replace(/((?:src|poster)=")(?:\.\.\/)?(images\/(mug|chatter|matrix|heyperiod|nhathuong|morsel|tenet|sketch)\/([a-z0-9-]+)\.(webp|webm))(")/g, (m, p1, path, dir, name, ext, p6) => {
  const key = dir + '-' + name;
  if (!imgMap[key]) {
    const file = ext === 'webp' ? `${S}/display2/${dir}/${name}.webp` : path;
    imgMap[key] = { mime: ext === 'webp' ? 'image/webp' : 'video/webm', file };
  }
  return p1.replace(/(src|poster)="$/, '$1="') + 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==' + p6 + ' data-asset="' + key + '"';
});
out = out.replace(/<a class="doc-link" href="tenet-proto\/[^"]+">([^<]+) &rarr;<\/a>/g, '<span class="doc-link" style="border-bottom:none">$1 — the same build runs from the TRY THE PROTOTYPE stage above<\/span>');
out = out.replace(/<a class="doc-link" href="morsel-docs\/[^"]+">open the full artifact &rarr;<\/a>/g, '<span class="doc-link" style="border-bottom:none">full artifact ships with the site (v2\/morsel-docs\/)<\/span>');

/* real runtimes + canonical payloads + theater */
out += '\n' + scriptBlock(reactJs) + '\n' + scriptBlock(reactDomJs) + '\n';
out += scriptBlock('window.__PROTO=' + protoJson + ';') + '\n';
out += scriptBlock(theaterJs) + '\n';
/* figures read photos from the same canonical map the theater uses — one copy, not two */
out += scriptBlock('window.__MORSEL_PHOTOS=window.__PROTO.morselPhotos;\n' + figuresJs) + '\n';

const NAVNET = `(function(){
  function goto(el){ el.scrollIntoView({behavior:'smooth'}); }
  /* any residual page.html / page.html#frag link resolves in-document instead of navigating */
  document.addEventListener('click',function(e){
    var a=e.target&&e.target.closest?e.target.closest('a'):null; if(!a) return;
    var h=a.getAttribute('href')||''; var m=h.match(/^([a-z-]+)\\.html(?:#([a-z-]+))?$/); if(!m) return;
    e.preventDefault();
    var ids=[m[1]+'-'+(m[2]||''), m[2]||'', m[1]];
    for(var i=0;i<ids.length;i++){ var el=ids[i]&&document.getElementById(ids[i]); if(el){ goto(el); return; } }
  });
  /* in-document anchors keep native hash + back behavior; re-correct once late media
     above the target settles and shifts layout (mobile especially) */
  document.addEventListener('click',function(e){
    var a=e.target&&e.target.closest?e.target.closest('a'):null; if(!a) return;
    var h=a.getAttribute('href')||''; if(h.charAt(0)!=='#'||h.length<2) return;
    var el=document.getElementById(h.slice(1)); if(!el) return;
    [700,1400,2400].forEach(function(t){ setTimeout(function(){
      var top=el.getBoundingClientRect().top;
      if(top<-40||top>Math.max(160,window.innerHeight*0.5)){
        window.scrollTo({top:el.getBoundingClientRect().top+window.scrollY-8,behavior:'auto'});
      }
    },t); });
  });
})();`;
out += '\n' + scriptBlock(NAVNET) + '\n';
let assetJs = 'const __A={';
for (const [k, v] of Object.entries(imgMap)) assetJs += JSON.stringify(k) + ':"data:' + v.mime + ';base64,' + readFileSync(v.file).toString('base64') + '",';
assetJs += '};document.querySelectorAll("[data-asset]").forEach(function(n){var u=__A[n.getAttribute("data-asset")];if(!u)return;if(n.tagName==="IMG"){n.src=u;}else{n.poster=u;}});';
out += '\n' + scriptBlock(assetJs);
writeFileSync(S+'/portfolio-v2-artifact.html', out);
const leftover = (out.match(/\.\.\/images\//g)||[]).length;
const vids = (out.match(/data:video\/webm/g)||[]).length;
console.log('bytes:', (out.length/1024/1024).toFixed(2)+'MB | external:', (out.match(/src="http|href="http/g)||[]).length, '| leftover ../images:', leftover, '| webm data uris:', vids);
