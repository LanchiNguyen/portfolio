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
  if (/[?&#]draft/.test(location.search + location.hash)) {
    document.documentElement.classList.add("draft");
  }
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
  document.querySelectorAll(".demo-stage").forEach(function (stage) {
    if (stage.classList.contains("demo-static")) return;
    var frame = stage.querySelector(".demo-frame");
    var openLink = stage.querySelector(".demo-open");
    var loadBtn = stage.querySelector(".demo-load");
    var resetBtn = stage.querySelector(".demo-reset");
    var tabs = stage.querySelectorAll(".demo-tab");
    var poster = stage.querySelector(".demo-poster");
    var posterImg = poster ? poster.querySelector("img") : null;
    var current = null, iframe = null;

    function cfg() {
      var t = stage.querySelector('.demo-tab[aria-selected="true"]');
      var el = t || stage;
      return {
        src: el.getAttribute("data-src"),
        w: parseInt(el.getAttribute("data-w"), 10),
        h: parseInt(el.getAttribute("data-h"), 10),
        poster: el.getAttribute("data-poster"),
        title: el.getAttribute("data-title") || "Interactive prototype"
      };
    }
    function fit() {
      var c = current; if (!c) return;
      var cw = frame.clientWidth;
      var scale = cw / c.w;
      frame.style.height = Math.round(c.h * scale) + "px";
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
      if (posterImg && c.poster) { posterImg.src = c.poster; }
      if (openLink) openLink.href = c.src;
      fit();
    }
    function load() {
      var c = cfg(); current = c;
      if (iframe) { iframe.remove(); iframe = null; }
      iframe = document.createElement("iframe");
      iframe.setAttribute("title", c.title);
      iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
      iframe.src = c.src;
      frame.appendChild(iframe);
      stage.classList.add("is-live");
      if (poster) poster.style.display = "none";
      fit();
      iframe.focus();
    }
    function reset() {
      if (iframe) { iframe.remove(); iframe = null; }
      stage.classList.remove("is-live");
      if (poster) poster.style.display = "";
      applyPoster();
      if (loadBtn) loadBtn.focus();
    }
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) { t.setAttribute("aria-selected", t === tab ? "true" : "false"); });
        if (stage.classList.contains("is-live")) { load(); } else { applyPoster(); }
      });
    });
    if (loadBtn) loadBtn.addEventListener("click", load);
    if (resetBtn) resetBtn.addEventListener("click", reset);
    window.addEventListener("resize", fit);
    applyPoster();
  });

})();
