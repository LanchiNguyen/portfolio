(function () {
  if (!new URLSearchParams(location.search).has('embed')) return;
  document.documentElement.setAttribute('data-embed', '');
  // Report the running screen's natural height as tabs and dialogs change.
  // The parent scales the frame; no captured markup or duplicated app logic.
  function connect() {
    // Wait for the runtime mount; x-dc initially contains an unbound template.
    var root = document.getElementById('dc-root');
    var screen = root && root.querySelector('[data-screen-label="Host phone"], [data-screen-label="Companion phone"], [data-screen-label="Meridian — with Tenet"]');
    if (!screen) return false;
    function report() {
      parent.postMessage({ type: 'tenet-embed-size', height: Math.ceil(screen.getBoundingClientRect().height) }, location.origin);
    }
    new ResizeObserver(report).observe(screen);
    report();
    return true;
  }
  document.addEventListener('DOMContentLoaded', function () {
    if (connect()) return;
    var boot = new MutationObserver(function () { if (connect()) boot.disconnect(); });
    boot.observe(document.body, { childList: true, subtree: true });
  });
})();
