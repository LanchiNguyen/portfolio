/* In-page editor for the preview build. Open any preview page with ?edit.
 *
 * Edit text where it sits, retype alt text, drop in a replacement photo, drag
 * the homepage cards into a new order — then Save, which writes one commit to
 * the `preview` branch through the GitHub API. Production is never touched:
 * build-site.sh only ships this file in the preview build, and the editor only
 * ever writes to `preview`.
 *
 * How edits find their way home: every editable element carries data-ed="N",
 * stamped into the source by stamp-editable.mjs. On save the editor fetches the
 * file's source text, finds that attribute, and rewrites only the bytes inside
 * that one element. Nothing is re-serialised, so a one-word change produces a
 * one-line diff and the rest of the file is untouched, comments and all.
 */
(function () {
  'use strict';
  if (!/[?&]edit\b/.test(location.search)) return;

  var OWNER = 'LanchiNguyen', REPO = 'portfolio', BRANCH = 'preview';
  var API = 'https://api.github.com';
  var TOKEN_KEY = 'lana.portfolio.ghToken';

  /* The page is served from /preview/<file>; the source lives at repo root. */
  var FILE = (location.pathname.split('/').pop() || 'index.html');
  if (!/\.html$/.test(FILE)) FILE = 'index.html';

  /* ---------------------------------------------------------------- state */
  var edits = {};      // id -> new innerHTML
  var attrs = {};      // id -> { alt: value }
  var photos = {};     // id -> { path, base64, w, h }
  var orders = {};     // container id -> [child ids in new order]
  var origin = {};     // id -> original innerHTML, for revert and for diffing
  var dirty = false;

  function count() {
    return Object.keys(edits).length + Object.keys(attrs).length +
           Object.keys(photos).length + Object.keys(orders).length;
  }
  function touch() {
    dirty = count() > 0;
    var n = count();
    saveBtn.textContent = n ? 'Save ' + n + ' change' + (n === 1 ? '' : 's') : 'Save';
    saveBtn.disabled = !n;
    discardBtn.disabled = !n;
  }

  /* ------------------------------------------------- source manipulation */
  /* Quote-aware scan for the end of the tag that starts at `lt`. */
  function tagEnd(src, lt) {
    var i = lt + 1, q = null;
    while (i < src.length) {
      var c = src[i];
      if (q) { if (c === q) q = null; }
      else if (c === '"' || c === "'") q = c;
      else if (c === '>') return i + 1;
      i++;
    }
    return -1;
  }

  var VOID = { img: 1, br: 1, hr: 1, input: 1, meta: 1, link: 1, source: 1, area: 1, col: 1 };

  /* Locate the element stamped data-ed="id" inside raw source text. */
  function locate(src, id) {
    var needle = 'data-ed="' + id + '"';
    var at = src.indexOf(needle);
    if (at === -1) throw new Error('data-ed="' + id + '" not found in ' + FILE +
      ' — the source moved on. Reload the page and redo this edit.');
    if (src.indexOf(needle, at + 1) !== -1) throw new Error('data-ed="' + id + '" appears twice; refusing to guess.');
    var lt = src.lastIndexOf('<', at);
    var te = tagEnd(src, lt);
    var name = /^<([a-zA-Z][a-zA-Z0-9-]*)/.exec(src.slice(lt, te))[1].toLowerCase();
    var r = { tagStart: lt, tagEnd: te, name: name };
    if (VOID[name] || /\/>$/.test(src.slice(lt, te))) { r.outerEnd = te; return r; }
    // walk forward to the matching close tag, counting nesting
    var depth = 1, i = te;
    while (i < src.length) {
      var lt2 = src.indexOf('<', i);
      if (lt2 === -1) break;
      if (src.startsWith('<!--', lt2)) { i = src.indexOf('-->', lt2) + 3; continue; }
      var te2 = tagEnd(src, lt2);
      var m = /^<(\/?)([a-zA-Z][a-zA-Z0-9-]*)/.exec(src.slice(lt2, te2));
      if (m && m[2].toLowerCase() === name && !VOID[name]) {
        if (m[1] === '/') { depth--; if (!depth) { r.innerStart = te; r.innerEnd = lt2; r.outerEnd = te2; return r; } }
        else if (!/\/>$/.test(src.slice(lt2, te2))) depth++;
      }
      i = te2;
    }
    throw new Error('no closing </' + name + '> for data-ed="' + id + '"');
  }

  function replaceInner(src, id, html) {
    var r = locate(src, id);
    if (r.innerStart == null) throw new Error('data-ed="' + id + '" is a void element; cannot set text');
    return src.slice(0, r.innerStart) + html + src.slice(r.innerEnd);
  }

  function setAttr(src, id, name, value) {
    var r = locate(src, id);
    var tag = src.slice(r.tagStart, r.tagEnd);
    var esc = String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    var re = new RegExp('(\\s' + name + '\\s*=\\s*")[^"]*(")');
    if (re.test(tag)) tag = tag.replace(re, '$1' + esc.replace(/\$/g, '$$$$') + '$2');
    else {
      var selfClose = /\/>$/.test(tag);
      var head = tag.slice(0, tag.length - (selfClose ? 2 : 1)).replace(/\s+$/, '');
      tag = head + ' ' + name + '="' + esc + '"' + (selfClose ? ' />' : '>');
    }
    return src.slice(0, r.tagStart) + tag + src.slice(r.tagEnd);
  }

  /* Reorder a container's children. Each child carries the whitespace and the
     HTML comment that preceded it, so "<!-- flagship 2: Morsel -->" travels
     with Morsel instead of ending up over whatever lands in slot two. */
  function reorder(src, containerId, childIds) {
    var c = locate(src, containerId);
    var parts = childIds.map(function (id) { return { id: id, r: locate(src, id) }; })
      .sort(function (a, b) { return a.r.tagStart - b.r.tagStart; });
    var cursor = c.innerStart, blocks = {};
    parts.forEach(function (p) {
      blocks[p.id] = src.slice(cursor, p.r.outerEnd);   // lead + element
      cursor = p.r.outerEnd;
    });
    var tail = src.slice(cursor, c.innerEnd);
    var rebuilt = childIds.map(function (id) {
      if (!blocks[id]) throw new Error('reorder: unknown child ' + id);
      return blocks[id];
    }).join('');
    return src.slice(0, c.innerStart) + rebuilt + tail + src.slice(c.innerEnd);
  }

  /* --------------------------------------------------------------- github */
  function token() { return localStorage.getItem(TOKEN_KEY) || ''; }

  function gh(path, opts) {
    opts = opts || {};
    opts.headers = Object.assign({
      'Authorization': 'Bearer ' + token(),
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }, opts.headers || {});
    if (opts.body && typeof opts.body !== 'string') opts.body = JSON.stringify(opts.body);
    return fetch(API + path, opts).then(function (r) {
      return r.text().then(function (t) {
        var j = null; try { j = t ? JSON.parse(t) : null; } catch (e) {}
        if (!r.ok) {
          var msg = (j && j.message) || r.statusText;
          if (r.status === 401) msg = 'GitHub rejected the token (401). It may be expired or missing Contents write access.';
          if (r.status === 403) msg = 'GitHub refused (403): ' + msg;
          if (r.status === 404) msg = 'Not found (404) — check the token has access to ' + OWNER + '/' + REPO + '.';
          throw new Error(msg);
        }
        return j;
      });
    });
  }

  function decodeB64(b64) {
    var bin = atob(b64.replace(/\n/g, ''));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder('utf-8').decode(bytes);
  }
  function encodeB64(str) {
    var bytes = new TextEncoder().encode(str), bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  function getSource(path) {
    return gh('/repos/' + OWNER + '/' + REPO + '/contents/' + path + '?ref=' + BRANCH)
      .then(function (j) { return decodeB64(j.content); });
  }

  function commitAll(message, files, binaries) {
    var base = '/repos/' + OWNER + '/' + REPO;
    var headSha, treeSha;
    return gh(base + '/git/ref/heads/' + BRANCH)
      .then(function (r) { headSha = r.object.sha; return gh(base + '/git/commits/' + headSha); })
      .then(function (c) {
        treeSha = c.tree.sha;
        var blobs = Object.keys(files).map(function (p) {
          return gh(base + '/git/blobs', { method: 'POST', body: { content: encodeB64(files[p]), encoding: 'base64' } })
            .then(function (b) { return { path: p, mode: '100644', type: 'blob', sha: b.sha }; });
        }).concat(Object.keys(binaries).map(function (p) {
          return gh(base + '/git/blobs', { method: 'POST', body: { content: binaries[p], encoding: 'base64' } })
            .then(function (b) { return { path: p, mode: '100644', type: 'blob', sha: b.sha }; });
        }));
        return Promise.all(blobs);
      })
      .then(function (tree) {
        return gh(base + '/git/trees', { method: 'POST', body: { base_tree: treeSha, tree: tree } });
      })
      .then(function (t) {
        return gh(base + '/git/commits', { method: 'POST', body: { message: message, tree: t.sha, parents: [headSha] } });
      })
      .then(function (c) {
        return gh(base + '/git/refs/heads/' + BRANCH, { method: 'PATCH', body: { sha: c.sha } })
          .then(function () { return c; });
      });
  }

  /* ------------------------------------------------------------------ ui */
  var host = document.createElement('div');
  host.id = '__ed-host';
  host.style.cssText = 'position:fixed;inset:auto auto 0 0;z-index:2147483647';
  var sh = host.attachShadow({ mode: 'open' });
  sh.innerHTML =
    '<style>' +
    ':host{all:initial}' +
    '*{box-sizing:border-box;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}' +
    '.bar{display:flex;gap:8px;align-items:center;background:#241f1a;color:#f6f1e7;padding:10px 12px;' +
      'border-radius:0 10px 0 0;box-shadow:0 -2px 24px rgba(0,0,0,.3);font-size:12px;letter-spacing:.04em}' +
    'button{font:inherit;font-size:11px;letter-spacing:.06em;text-transform:uppercase;border:1px solid #6b6055;' +
      'background:#332c25;color:#f6f1e7;padding:7px 11px;border-radius:6px;cursor:pointer}' +
    'button:hover:not(:disabled){background:#463d33}' +
    'button:disabled{opacity:.38;cursor:default}' +
    'button.go{background:#8a6a3b;border-color:#a8834b}' +
    'button.go:hover:not(:disabled){background:#a8834b}' +
    '.tag{opacity:.6;padding-right:4px}' +
    '.msg{max-width:44ch;padding:8px 12px;background:#1a1613;color:#f6f1e7;font-size:11px;line-height:1.5;' +
      'border-radius:0 10px 0 0;display:none;white-space:pre-wrap}' +
    '.msg.on{display:block}' +
    '.msg.bad{background:#5c2020}' +
    '.msg a{color:#e5c48a}' +
    '</style>' +
    '<div class="msg" id="msg"></div>' +
    '<div class="bar">' +
      '<span class="tag">EDIT</span>' +
      '<button class="go" id="save" disabled>Save</button>' +
      '<button id="discard" disabled>Discard</button>' +
      '<button id="order">Reorder</button>' +
      '<button id="tok">Token</button>' +
      '<button id="exit">Exit</button>' +
    '</div>';
  document.documentElement.appendChild(host);
  var saveBtn = sh.getElementById('save'), discardBtn = sh.getElementById('discard');
  var orderBtn = sh.getElementById('order'), msgEl = sh.getElementById('msg');

  function say(text, bad) {
    msgEl.textContent = text;
    msgEl.className = 'msg on' + (bad ? ' bad' : '');
    if (!bad) setTimeout(function () { if (msgEl.textContent === text) msgEl.className = 'msg'; }, 6000);
  }

  var css = document.createElement('style');
  css.textContent =
    '[data-ed][contenteditable="true"]:hover{outline:1px dashed rgba(138,106,59,.6);outline-offset:3px}' +
    '[data-ed][contenteditable="true"]:focus{outline:2px solid #8a6a3b;outline-offset:3px;background:rgba(138,106,59,.06)}' +
    '[data-ed].__ed-changed{background:rgba(138,106,59,.13)}' +
    '.__ed-badge{position:absolute;z-index:60;font:600 9px/1 ui-monospace,monospace;letter-spacing:.08em;' +
      'background:#241f1a;color:#f6f1e7;border:0;padding:5px 7px;border-radius:5px;cursor:pointer;opacity:.55}' +
    '.__ed-badge:hover{opacity:1}' +
    '.__ed-wrap{position:relative}' +
    '.__ed-drop{outline:2px dashed #8a6a3b !important;outline-offset:2px}' +
    'body.__ed-order [data-ed].__ed-item{cursor:grab;outline:1px dashed rgba(138,106,59,.55);outline-offset:6px}' +
    'body.__ed-order [data-ed].__ed-item.__ed-drag{opacity:.4}' +
    'body.__ed-on a.cover-link{pointer-events:none}';
  document.head.appendChild(css);

  /* ------------------------------------------------------- text editing */
  var all = [].slice.call(document.querySelectorAll('[data-ed]'));
  var textEls = all.filter(function (el) {
    return el.tagName !== 'IMG' && !el.querySelector('[data-ed]');   // innermost only
  });
  var imgEls = all.filter(function (el) { return el.tagName === 'IMG'; });

  /* Evidence labels and status flags are the spine of this site's honesty.
     Make them atomic so a stray keystroke cannot dissolve MEASURED into prose;
     deleting one outright is still possible, and countLabels catches that. */
  var ATOMIC = '.lbl, .status-flag';
  function countLabels(html) {
    var d = document.createElement('div');
    d.innerHTML = html;
    return d.querySelectorAll(ATOMIC).length;
  }

  textEls.forEach(function (el) {
    origin[el.dataset.ed] = el.innerHTML;
    [].slice.call(el.querySelectorAll(ATOMIC)).forEach(function (n) { n.contentEditable = 'false'; });
    el.contentEditable = 'true';
    el.spellcheck = true;
    el.addEventListener('input', function () {
      var id = el.dataset.ed;
      if (el.innerHTML === origin[id]) { delete edits[id]; el.classList.remove('__ed-changed'); }
      else { edits[id] = el.innerHTML; el.classList.add('__ed-changed'); }
      touch();
    });
    // plain-text paste: pasted rich HTML would drag foreign markup into the page
    el.addEventListener('paste', function (e) {
      e.preventDefault();
      document.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('text'));
    });
    // Enter inserts a line break, never a new block element
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); document.execCommand('insertLineBreak'); }
    });
  });

  /* --------------------------------------------- alt text and photo swap */
  var SWAPPABLE = /^images\//;
  function badge(img, label, onClick) {
    var r = img.getBoundingClientRect();
    var b = document.createElement('button');
    b.className = '__ed-badge';
    b.textContent = label;
    b.style.position = 'absolute';
    b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); onClick(); });
    document.body.appendChild(b);
    var place = function () {
      var q = img.getBoundingClientRect();
      b.style.top = (q.top + window.scrollY + 6) + 'px';
      b.style.left = (q.left + window.scrollX + 6 + (label === 'PHOTO' ? 46 : 0)) + 'px';
      b.style.display = q.width < 90 || q.height < 40 ? 'none' : '';
    };
    place();
    window.addEventListener('scroll', place, { passive: true });
    window.addEventListener('resize', place);
    return b;
  }

  function editAlt(img) {
    var id = img.dataset.ed;
    var current = (attrs[id] && attrs[id].alt != null) ? attrs[id].alt : img.getAttribute('alt') || '';
    var next = window.prompt('Alt text — describe what the image shows, for screen readers and for when it fails to load:', current);
    if (next === null) return;
    if (next === (img.getAttribute('alt') || '')) { delete attrs[id]; }
    else { attrs[id] = { alt: next }; img.setAttribute('alt', next); }
    touch();
  }

  function swapPhoto(img, file) {
    var id = img.dataset.ed;
    var src = img.getAttribute('src') || '';
    if (!SWAPPABLE.test(src)) { say('That image is generated, not a photo file — it cannot be swapped here.', true); return; }
    if (!/^image\//.test(file.type)) { say('That is not an image file.', true); return; }
    var targetW = Math.round(img.getBoundingClientRect().width * 2) || 1600;
    createImageBitmap(file).then(function (bmp) {
      var w = Math.min(bmp.width, targetW), h = Math.round(bmp.height * (w / bmp.width));
      var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      cv.getContext('2d').drawImage(bmp, 0, 0, w, h);
      var oldAr = (+img.getAttribute('width') || bmp.width) / (+img.getAttribute('height') || bmp.height);
      var newAr = w / h;
      return new Promise(function (res) { cv.toBlob(res, 'image/webp', 0.82); })
        .then(function (blob) { return blob.arrayBuffer(); })
        .then(function (buf) {
          var bytes = new Uint8Array(buf), bin = '';
          for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
          photos[id] = { path: src, base64: btoa(bin), w: w, h: h };
          img.src = cv.toDataURL('image/webp', 0.82);
          img.setAttribute('width', w); img.setAttribute('height', h);
          img.classList.add('__ed-changed');
          touch();
          var note = 'Replaced ' + src + ' at ' + w + '×' + h + '.';
          if (Math.abs(oldAr - newAr) / oldAr > 0.02) {
            note += '\nHeads up: the new photo has a different shape than the old one. If this file is used on another page too, that page will crop differently.';
          }
          say(note);
        });
    }).catch(function (e) { say('Could not read that image: ' + e.message, true); });
  }

  imgEls.forEach(function (img) {
    origin[img.dataset.ed] = null;
    badge(img, 'ALT', function () { editAlt(img); });
    if (SWAPPABLE.test(img.getAttribute('src') || '')) {
      badge(img, 'PHOTO', function () {
        var inp = document.createElement('input');
        inp.type = 'file'; inp.accept = 'image/*';
        inp.onchange = function () { if (inp.files[0]) swapPhoto(img, inp.files[0]); };
        inp.click();
      });
      img.addEventListener('dragover', function (e) { e.preventDefault(); img.classList.add('__ed-drop'); });
      img.addEventListener('dragleave', function () { img.classList.remove('__ed-drop'); });
      img.addEventListener('drop', function (e) {
        e.preventDefault(); img.classList.remove('__ed-drop');
        if (e.dataTransfer.files[0]) swapPhoto(img, e.dataTransfer.files[0]);
      });
    }
  });

  /* ------------------------------------------------------------ reorder */
  var GROUPS = ['.flagships', '.tins'];
  var ordering = false, dragEl = null;

  function itemsOf(container) {
    return [].slice.call(container.children).filter(function (c) { return c.dataset && c.dataset.ed; });
  }

  orderBtn.addEventListener('click', function () {
    ordering = !ordering;
    document.body.classList.toggle('__ed-order', ordering);
    orderBtn.textContent = ordering ? 'Done' : 'Reorder';
    GROUPS.forEach(function (sel) {
      var c = document.querySelector(sel);
      if (!c || !c.dataset.ed) return;
      itemsOf(c).forEach(function (it) {
        it.classList.toggle('__ed-item', ordering);
        it.draggable = ordering;
      });
    });
    if (!ordering) return;
    say('Drag the cards to reorder them. Flagships and the smaller tins are separate rows — a card stays in its own row.');
  });

  document.addEventListener('dragstart', function (e) {
    if (!ordering) return;
    var it = e.target.closest && e.target.closest('.__ed-item');
    if (!it) return;
    dragEl = it; it.classList.add('__ed-drag');
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', it.dataset.ed); } catch (x) {}
  });
  document.addEventListener('dragend', function () {
    if (dragEl) dragEl.classList.remove('__ed-drag');
    dragEl = null;
  });
  document.addEventListener('dragover', function (e) {
    if (!ordering || !dragEl) return;
    var over = e.target.closest && e.target.closest('.__ed-item');
    if (!over || over === dragEl || over.parentElement !== dragEl.parentElement) return;
    e.preventDefault();
    var r = over.getBoundingClientRect();
    var after = (e.clientY - r.top) / r.height > 0.5;
    over.parentElement.insertBefore(dragEl, after ? over.nextSibling : over);
  });
  document.addEventListener('drop', function (e) {
    if (!ordering || !dragEl) return;
    e.preventDefault();
    var c = dragEl.parentElement;
    var ids = itemsOf(c).map(function (i) { return i.dataset.ed; });
    orders[c.dataset.ed] = ids;
    touch();
  });

  /* --------------------------------------------------------------- save */
  function askToken() {
    var t = window.prompt(
      'Paste a GitHub fine-grained personal access token.\n\n' +
      'Create one at github.com/settings/personal-access-tokens/new\n' +
      '  Repository access: only ' + OWNER + '/' + REPO + '\n' +
      '  Permissions: Contents -> Read and write\n\n' +
      'It is stored in this browser only, and used only to commit to the ' + BRANCH + ' branch.',
      token());
    if (t === null) return false;
    localStorage.setItem(TOKEN_KEY, t.trim());
    return !!t.trim();
  }
  sh.getElementById('tok').addEventListener('click', function () {
    if (askToken()) say('Token saved in this browser.');
  });

  saveBtn.addEventListener('click', function () {
    if (!token() && !askToken()) return;
    saveBtn.disabled = true;
    say('Fetching the current source…');

    var binaries = {};
    Object.keys(photos).forEach(function (id) { binaries[photos[id].path] = photos[id].base64; });

    var lost = Object.keys(edits).filter(function (id) {
      return countLabels(edits[id]) < countLabels(origin[id]);
    });
    if (lost.length && !window.confirm(
        'One of your edits removed an evidence label (MEASURED / SIMULATED / RETROSPECTIVE / PROPOSED) ' +
        'or a status flag. Those labels are what keep the claims on this site checkable.\n\n' +
        'Commit anyway?')) {
      touch(); say('Not committed. Reload to restore the label, or edit around it.', true); return;
    }

    getSource(FILE).then(function (src) {
      var out = src;
      Object.keys(orders).forEach(function (cid) { out = reorder(out, cid, orders[cid]); });
      Object.keys(edits).forEach(function (id) { out = replaceInner(out, id, edits[id]); });
      Object.keys(attrs).forEach(function (id) { out = setAttr(out, id, 'alt', attrs[id].alt); });
      Object.keys(photos).forEach(function (id) {
        out = setAttr(out, id, 'width', photos[id].w);
        out = setAttr(out, id, 'height', photos[id].h);
      });
      if (out === src && !Object.keys(binaries).length) throw new Error('Nothing changed in the source. Not committing.');

      var nText = Object.keys(edits).length, nAlt = Object.keys(attrs).length;
      var nPhoto = Object.keys(photos).length, nOrd = Object.keys(orders).length;
      var bits = [];
      if (nText) bits.push(nText + ' text edit' + (nText === 1 ? '' : 's'));
      if (nAlt) bits.push(nAlt + ' alt text');
      if (nPhoto) bits.push(nPhoto + ' photo' + (nPhoto === 1 ? '' : 's'));
      if (nOrd) bits.push('card order');
      var msg = 'Edit ' + FILE + ': ' + bits.join(', ') + '\n\nMade in the page editor on the preview site.';

      var files = {}; files[FILE] = out;
      say('Committing…');
      return commitAll(msg, files, binaries);
    }).then(function (c) {
      edits = {}; attrs = {}; photos = {}; orders = {}; dirty = false;
      [].slice.call(document.querySelectorAll('.__ed-changed')).forEach(function (el) { el.classList.remove('__ed-changed'); });
      touch();
      say('Committed ' + c.sha.slice(0, 7) + ' to ' + BRANCH + '. The preview site rebuilds in about a minute — reload then to see it served.');
    }).catch(function (e) {
      touch();
      say('Save failed. Nothing was committed.\n\n' + e.message, true);
    });
  });

  discardBtn.addEventListener('click', function () {
    if (!window.confirm('Throw away ' + count() + ' unsaved change(s) and reload?')) return;
    dirty = false; location.reload();
  });
  sh.getElementById('exit').addEventListener('click', function () {
    dirty = false;
    location.href = location.pathname;
  });
  window.addEventListener('beforeunload', function (e) {
    if (!dirty) return;
    e.preventDefault(); e.returnValue = '';
  });

  /* Links would navigate away mid-edit and take unsaved changes with them. */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (a && !host.contains(e.target)) { e.preventDefault(); }
  }, true);

  /* Same idea as morselDebug in the prototypes: let tooling drive the editor
     deterministically, so the source-rewriting can be tested without a commit. */
  window.__ed = {
    locate: locate, replaceInner: replaceInner, setAttr: setAttr, reorder: reorder,
    state: function () { return { edits: edits, attrs: attrs, photos: photos, orders: orders, origin: origin }; },
    file: FILE
  };

  document.body.classList.add('__ed-on');
  touch();
  say('Edit mode. Click any text to change it; ALT and PHOTO badges sit on the images. Saving commits to the ' +
      BRANCH + ' branch — the live site is untouched until you merge.');
})();
