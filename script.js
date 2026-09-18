// ---- clean / draft mode ------------------------------------------------
// [ADD:] chips are hidden for visitors; ?draft reveals the punch list.
// Chips with data-clean get honest fallback text in clean mode.
(function () {
  document.querySelectorAll(".addm[data-clean]").forEach(function (el) {
    var t = el.getAttribute("data-clean");
    if (t) {
      var s = document.createElement("span");
      s.className = "clean-fill";
      s.textContent = t;
      el.parentNode.insertBefore(s, el);
    }
  });
})();

(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* reveal on scroll */
  var items = document.querySelectorAll(".rv");
  if (reduce || !("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
    items.forEach(function (el) { io.observe(el); });
  }

  /* footer year */
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  /* under reduced motion, stop autoplaying prototype videos */
  if (reduce) {
    document.querySelectorAll("video[autoplay]").forEach(function (v) {
      v.removeAttribute("autoplay");
      v.pause();
      v.controls = true;
    });
  }

  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---- hero cluster parallax: the desk props drift with the cursor ---- */
  if (!reduce && fine) {
    var hero = document.querySelector(".hero");
    var props = hero ? hero.querySelectorAll(".parallax") : [];
    if (hero && props.length) {
      var pRaf = null, pe = null;
      hero.addEventListener("pointermove", function (e) {
        pe = e;
        if (pRaf) return;
        pRaf = requestAnimationFrame(function () {
          var r = hero.getBoundingClientRect();
          var nx = (pe.clientX - r.left) / r.width - 0.5;
          var ny = (pe.clientY - r.top) / r.height - 0.5;
          props.forEach(function (p) {
            var d = parseFloat(p.getAttribute("data-depth") || "16") / 100;
            p.style.setProperty("--tx", (nx * -d * 100).toFixed(1) + "px");
            p.style.setProperty("--ty", (ny * -d * 100).toFixed(1) + "px");
          });
          pRaf = null;
        });
      });
      hero.addEventListener("pointerleave", function () {
        props.forEach(function (p) { p.style.setProperty("--tx", "0px"); p.style.setProperty("--ty", "0px"); });
      });
    }
  }

  /* ---- flagship work cards tilt in 3D toward the cursor ---- */
  if (!reduce && fine) {
    document.querySelectorAll(".flag").forEach(function (card) {
      var tRaf = null, te = null;
      card.style.transition = "transform 0.2s var(--ease)";
      card.addEventListener("pointermove", function (e) {
        te = e;
        if (tRaf) return;
        tRaf = requestAnimationFrame(function () {
          var r = card.getBoundingClientRect();
          var rx = ((te.clientY - r.top) / r.height - 0.5) * -6;
          var ry = ((te.clientX - r.left) / r.width - 0.5) * 7;
          card.style.transform = "perspective(1100px) rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg) translateY(-6px)";
          tRaf = null;
        });
      });
      card.addEventListener("pointerleave", function () { card.style.transform = ""; });
    });
  }

  /* ---- metric numbers count up when they scroll into view ---- */
  var nums = document.querySelectorAll(".chip .n:not([data-static]), .tin .metric:not([data-static])");
  if (nums.length && !reduce && "IntersectionObserver" in window) {
    var countUp = function (el) {
      var m = el.textContent.match(/^(\D*)(\d[\d,]*)(.*)$/);
      if (!m) return;
      var prefix = m[1], target = parseInt(m[2].replace(/,/g, ""), 10), suffix = m[3];
      var dur = 950, start = null;
      el.textContent = prefix + "0" + suffix;
      var tick = function (ts) {
        if (!start) start = ts;
        var t = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - t, 3);
        el.textContent = prefix + Math.round(eased * target) + suffix;
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    var nio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { countUp(e.target); nio.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    nums.forEach(function (n) { nio.observe(n); });
  }
})();

/* ---- Try-the-prototype stages + flagship motion previews ---- */
(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* demo stages: lazy click-to-load sandboxed iframes, scaled to fit */
  document.querySelectorAll(".demo-stage").forEach(function (stage, stageIndex) {
    if (stage.classList.contains("demo-static")) return;
    var frame = stage.querySelector(".demo-frame");
    var openLink = stage.querySelector(".demo-open");
    var loadBtn = stage.querySelector(".demo-load");
    var resetBtn = stage.querySelector(".demo-reset");
    var tabs = stage.querySelectorAll(".demo-tab");
    var poster = stage.querySelector(".demo-poster");
    var posterImg = poster ? poster.querySelector("img") : null;
    var current = null, iframe = null;
    var liveOnLoad = stage.hasAttribute('data-live-on-load');
    if (tabs.length) {
      frame.id = 'demo-panel-' + stageIndex;
      tabs.forEach(function (tab, i) {
        tab.id = 'demo-tab-' + stageIndex + '-' + i;
        tab.setAttribute('aria-controls', frame.id);
      });
    }

    function cfg() {
      var t = stage.querySelector('.demo-tab[aria-selected="true"]');
      var el = t || stage;
      return {
        src: el.getAttribute("data-src"),
        w: parseInt(el.getAttribute("data-w"), 10),
        h: parseInt(el.getAttribute("data-h"), 10),
        poster: el.getAttribute("data-poster"),
        posterAlt: el.getAttribute("data-poster-alt"),
        title: el.getAttribute("data-title") || "Interactive prototype"
      };
    }
    function fit() {
      var c = current; if (!c) return;
      var cw = frame.clientWidth;
      var pan = c.w > 700 && cw < 900;
      var scale = pan ? 1 : cw / c.w;
      frame.classList.toggle('is-pan', pan);
      frame.style.height = (pan ? c.h + 2 : Math.round(c.h * scale)) + "px";
      if (pan) {
        frame.setAttribute('tabindex', '0');
        frame.setAttribute('role', 'region');
        frame.setAttribute('aria-label', 'Scrollable Meridian workstation prototype');
      } else {
        frame.removeAttribute('tabindex');
        frame.removeAttribute('role');
        frame.removeAttribute('aria-label');
      }
      if (tabs.length) {
        frame.setAttribute('role', 'tabpanel');
        frame.setAttribute('aria-labelledby', stage.querySelector('.demo-tab[aria-selected="true"]').id);
      }
      if (iframe) {
        iframe.style.width = c.w + "px";
        iframe.style.height = c.h + "px";
        iframe.style.transform = "scale(" + scale + ")";
      }
    }
    function applyPoster() {
      var c = cfg(); current = c;
      frame.classList.toggle("is-wide", c.w > 700);
      frame.classList.toggle("is-phone", c.w <= 700);
      if (posterImg && c.poster) {
        posterImg.src = c.poster;
        /* the poster changes with the tab, so its description must too */
        if (c.posterAlt) posterImg.alt = c.posterAlt;
      }
      /* c.src carries ?bare for the embed; the escape hatch wants the full page */
      if (openLink) {
        var full = new URL(c.src, document.baseURI);
        full.searchParams.delete('bare');
        openLink.href = full.href;
      }
      fit();
    }
    function load(focusFrame) {
      applyPoster();
      var c = current;
      if (iframe) { iframe.remove(); iframe = null; }
      iframe = document.createElement("iframe");
      iframe.setAttribute("title", c.title);
      iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
      iframe.src = c.src;
      frame.appendChild(iframe);
      stage.classList.add("is-live");
      stage.classList.remove("is-slow");
      if (poster) poster.style.display = "none";
      fit();
      // Start the wide workstation at its order ticket on narrow screens.
      frame.scrollLeft = frame.classList.contains('is-pan') ? Math.max(0, frame.scrollWidth - frame.clientWidth - 48) : 0;
      frame.scrollTop = 0;
      if (focusFrame !== false) iframe.focus();
      watchBoot(c);
    }
    /* if the embed hasn't finished loading after a while (e.g. a blocked CDN),
       point at the standalone prototype instead of leaving a silent blank frame */
    function watchBoot(c) {
      var mine = iframe;
      setTimeout(function () {
        if (iframe !== mine || !stage.classList.contains("is-live")) return;
        var stuck = false;
        try {
          var doc = mine.contentDocument;
          stuck = !doc || doc.readyState === "loading" || !doc.body || doc.body.childElementCount === 0 || (doc.querySelector('x-dc') && !doc.querySelector('#dc-root > *'));
        } catch (e) { /* cross-origin: assume it loaded */ }
        if (!stuck) return;
        var note = stage.querySelector(".demo-stall");
        if (!note) {
          note = document.createElement("a");
          note.className = "demo-stall";
          note.href = c.src;
          note.textContent = "Taking a while to load here — open the full prototype ↗";
          frame.appendChild(note);
        } else {
          note.href = c.src;
        }
        stage.classList.add("is-slow");
      }, 7000);
    }
    function reset() {
      if (iframe) { iframe.remove(); iframe = null; }
      var note = stage.querySelector(".demo-stall");
      if (note) note.remove();
      if (liveOnLoad) { load(false); return; }
      stage.classList.remove("is-live");
      stage.classList.remove("is-slow");
      if (poster) poster.style.display = "";
      applyPoster();
      if (loadBtn) loadBtn.focus();
    }
    tabs.forEach(function (tab) {
      tab.tabIndex = tab.getAttribute('aria-selected') === 'true' ? 0 : -1;
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) { t.setAttribute("aria-selected", t === tab ? "true" : "false"); t.tabIndex = t === tab ? 0 : -1; });
        if (stage.classList.contains("is-live")) { load(false); } else { applyPoster(); }
      });
      tab.addEventListener('keydown', function (e) {
        var keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
        if (keys.indexOf(e.key) < 0) return;
        e.preventDefault();
        var list = Array.prototype.slice.call(tabs), i = list.indexOf(tab);
        var next = e.key === 'Home' ? 0 : e.key === 'End' ? list.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + list.length) % list.length;
        list[next].click(); list[next].focus();
      });
    });
    if (loadBtn) loadBtn.addEventListener("click", load);
    if (resetBtn) resetBtn.addEventListener("click", reset);
    window.addEventListener("resize", fit);
    applyPoster();
    if (liveOnLoad) load(false);
  });

})();
