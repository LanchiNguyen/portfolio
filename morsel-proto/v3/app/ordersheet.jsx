// Morsel v3.2 — the restaurant-menu sheet. It replaced the order sheet.
// Morsel never runs a checkout and never promises a cart, a fee, an ETA or that a
// dish is in stock. The sheet names where the next step goes (the restaurant's
// menu, a dish on it, or a phone number), asks the diner to check current prices
// and availability there, and in this prototype ends at a neutral end state.
// Nothing here navigates or places a call; the disclosure that links are
// simulated lives in the caption beside the prototype, not inside it.
function NextStepSheet({ dish, rest, onClose, onPing }) {
  const { u, price, destination, dishes } = window.MorselData;
  const restName = dish ? dish.rest : rest;
  const dest = destination(restName);
  const cover = dish || dishes.find((d) => d.rest === restName);
  // Modal focus management: name the dialog, move focus in on open, trap Tab,
  // close on Escape; the opener restores focus (see DetailScreen).
  const sheetRef = React.useRef(null);
  const titleId = React.useId();
  React.useEffect(() => {
    const node = sheetRef.current;
    if (!node) return;
    const sel = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';
    const focusables = () => [...node.querySelectorAll(sel)].filter((el) => el.offsetWidth > 0 || el.offsetHeight > 0);
    (focusables()[0] || node).focus();
    const onKey = (e) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); return; }
      if (e.key !== "Tab") return;
      const f = focusables();
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || !node.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || !node.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
    };
    node.addEventListener("keydown", onKey);
    return () => node.removeEventListener("keydown", onKey);
  }, [onClose]);

  const [phase, setPhase] = React.useState("ready"); // ready | failed | done
  const go = () => {
    if ((window.MorselSim || {}).handoffFail) { setPhase("failed"); return; }
    setPhase("done");
  };
  const title = dest.kind === "dish" ? "Dish on the restaurant menu" : dest.kind === "menu" ? "Restaurant menu" : "Check with " + restName;
  const body = dest.kind === "dish"
    ? "Check the dish's current price and availability on the restaurant's menu."
    : dest.kind === "menu"
      ? "Check current prices and availability on the restaurant's menu."
      : `${restName} has no online menu. Call ${dest.phone}${cover ? " or visit in " + cover.hood : ""}.`;
  const primary = dest.kind === "dish" ? "Continue to dish" : dest.kind === "menu" ? "Continue to menu" : "Call " + restName;
  const p = dish ? price(dish) : null;

  return (
    <div ref={sheetRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} style={{ position: "absolute", inset: 0, zIndex: 60, display: "flex", flexDirection: "column", justifyContent: "flex-end", outline: "none" }}>
      <button aria-label="Close" onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(15,9,4,.45)", cursor: "pointer" }}></button>
      <div className="m-rise" style={{ position: "relative", background: "var(--surface)", borderRadius: "calc(var(--r) + 4px) calc(var(--r) + 4px) 0 0", padding: "10px 20px 28px", boxShadow: "var(--shadow-float)" }}>
        <div style={{ width: 36, height: 4, borderRadius: 99, background: "var(--line)", margin: "0 auto 14px" }}></div>

        {/* identity stays visible through every phase */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 14, overflow: "hidden", flex: "none", background: "var(--sunken)" }}>
            {cover && <img src={u(cover.img, 160)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="m-second" id={titleId} style={{ fontWeight: 800 }}>{phase === "done" ? "End of prototype" : title}</div>
            <div className="m-caption" style={{ color: "var(--ink-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {dish ? `${dish.name} · ${restName}${p ? " · " + p : ""}` : `${restName}${cover ? " · " + cover.hood : ""}`}
            </div>
          </div>
        </div>

        {phase === "done" ? (
          <div role="status">
            <button className="m-btn m-btn-quiet" style={{ width: "100%" }} onClick={onClose}>Back</button>
          </div>
        ) : (
          <div>
            <div className="m-second" style={{ color: "var(--ink-2)", marginBottom: 6 }}>{body}</div>
            {dish && dish.listed === false && <div className="m-caption" style={{ color: "var(--ink-2)", marginBottom: 6 }}>This dish is no longer listed. The menu may show what replaced it.</div>}

            {phase === "failed" && (
              <div role="alert" style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "rgba(194,73,43,.10)", border: "1.5px solid var(--accent)", borderRadius: 14, padding: "11px 13px", margin: "8px 0 4px" }}>
                <div aria-hidden="true" style={{ color: "var(--accent)", flex: "none", fontWeight: 900, fontSize: 13, width: 20, height: 20, borderRadius: 99, border: "2px solid var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>!</div>
                <div style={{ flex: 1 }}>
                  <div className="m-caption" style={{ fontWeight: 800, color: "var(--accent)" }}>{dest.kind === "none" ? "Couldn't start the call" : "Couldn't open the menu"}</div>
                  <div className="m-caption" style={{ color: "var(--ink-2)" }}>Try again or go back.</div>
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
              <button className="m-btn m-btn-primary" style={{ width: "100%" }} onClick={go}>
                {phase === "failed" ? "Try again" : primary}
              </button>
              <button className="m-btn m-btn-quiet" style={{ width: "100%" }} onClick={onClose}>Back</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Kept as an alias so older capture recipes and docs that name the sheet still resolve.
const OrderSheet = NextStepSheet;

Object.assign(window, { NextStepSheet, OrderSheet });
