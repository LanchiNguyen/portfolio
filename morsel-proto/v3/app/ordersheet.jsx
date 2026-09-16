// Morsel v3.2 — the next-step sheet. It replaced the order sheet.
// Morsel never runs a checkout and never promises a cart, a fee, an ETA or that a
// dish is in stock. The sheet says where the next step goes (a dish page, a
// restaurant menu, or a phone number), what may have changed since the link was
// checked, and — in this demo — ends at a clear "no order was placed" endpoint.
// The label and the destination come from the catalog's destination model, not
// from a universal "Order" template.
function NextStepSheet({ dish, rest, onClose, onPing }) {
  const { u, price, destination, checked, dishes } = window.MorselData;
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
  const stale = dest.checked && dest.checked !== checked;
  const go = () => {
    if ((window.MorselSim || {}).handoffFail) { setPhase("failed"); return; }
    setPhase("done");
  };
  const title = dest.kind === "dish" ? "View this dish on the menu" : dest.kind === "menu" ? "View the restaurant menu" : "Check with " + restName;
  const p = dish ? price(dish) : null;

  return (
    <div ref={sheetRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} style={{ position: "absolute", inset: 0, zIndex: 60, display: "flex", flexDirection: "column", justifyContent: "flex-end", outline: "none" }}>
      <button aria-label="Close" onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(15,9,4,.45)", cursor: "pointer" }}></button>
      <div className="m-rise" style={{ position: "relative", background: "var(--surface)", borderRadius: "calc(var(--r) + 4px) calc(var(--r) + 4px) 0 0", padding: "10px 20px 28px", boxShadow: "var(--shadow-float)" }}>
        <div style={{ width: 36, height: 4, borderRadius: 99, background: "var(--line)", margin: "0 auto 14px" }}></div>

        {/* identity stays visible through every phase */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ width: 46, height: 46, borderRadius: 14, overflow: "hidden", flex: "none", background: "var(--sunken)" }}>
            {cover && <img src={u(cover.img, 160)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="m-second" id={titleId} style={{ fontWeight: 800 }}>{title}</div>
            <div className="m-caption" style={{ color: "var(--ink-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {dish ? `${dish.name} · ${restName}${p ? " · " + p : ""}` : `${restName} · ${cover ? cover.hood : ""}`}
            </div>
          </div>
        </div>

        {phase === "done" ? (
          <div role="status">
            <div style={{ background: "var(--sunken)", borderRadius: 14, padding: "14px 14px", marginBottom: 14 }}>
              <div className="m-second" style={{ fontWeight: 800, marginBottom: 4 }}>Demo complete</div>
              <div className="m-caption" style={{ color: "var(--ink-2)" }}>
                In a live version this would {dest.kind === "none" ? "start a call to " + dest.phone : "open " + dest.host + (dest.kind === "dish" ? " at this dish" : "'s menu")}. No order was placed, and nothing left this prototype.
              </div>
            </div>
            <button className="m-btn m-btn-quiet" style={{ width: "100%" }} onClick={onClose}>{dish ? "Back to the dish" : "Back to " + restName}</button>
          </div>
        ) : (
          <div>
            {dest.kind === "none" ? (
              <div style={{ background: "var(--sunken)", borderRadius: 14, padding: "12px 14px", marginBottom: 12 }}>
                <div className="m-second" style={{ fontWeight: 700 }}>No online menu to link to</div>
                <div className="m-caption" style={{ color: "var(--ink-2)" }}>{restName} doesn't publish a menu we can point to. Call {dest.phone}, or visit in {cover ? cover.hood : "person"}. Morsel can't confirm price or availability for this restaurant.</div>
              </div>
            ) : (
              <div style={{ background: "var(--sunken)", borderRadius: 14, padding: "12px 14px", marginBottom: 12 }}>
                <div className="m-second" style={{ fontWeight: 700 }}>Opens {dest.host}</div>
                <div className="m-caption" style={{ color: "var(--ink-2)" }}>
                  {dest.kind === "dish"
                    ? "Lands on this dish's page. Price and availability may have changed since " + dest.checked + "."
                    : "Lands on the restaurant's menu, not on this dish; you'll find it there. Price and availability may have changed since " + dest.checked + "."}
                </div>
                {stale && <div className="m-caption" style={{ color: "var(--ink-2)", marginTop: 6 }}><span style={{ fontWeight: 800 }}>Link last checked {dest.checked}.</span> It may have moved.</div>}
                {dish && dish.listed === false && <div className="m-caption" style={{ color: "var(--ink-2)", marginTop: 6 }}>This dish is no longer listed as of {checked}. The menu may show what replaced it.</div>}
              </div>
            )}

            {phase === "failed" && (
              <div role="alert" style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "rgba(194,73,43,.10)", border: "1.5px solid var(--accent)", borderRadius: 14, padding: "11px 13px", marginBottom: 12 }}>
                <div aria-hidden="true" style={{ color: "var(--accent)", flex: "none", fontWeight: 900, fontSize: 13, width: 20, height: 20, borderRadius: 99, border: "2px solid var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>!</div>
                <div style={{ flex: 1 }}>
                  <div className="m-caption" style={{ fontWeight: 800, color: "var(--accent)" }}>Couldn't open {dest.kind === "none" ? "the call" : dest.host}</div>
                  <div className="m-caption" style={{ color: "var(--ink-2)" }}>This is a simulated failure. Your dish is still here. Try again, or check with the restaurant another way.</div>
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button className="m-btn m-btn-primary" style={{ width: "100%" }} onClick={go}>
                {phase === "failed" ? "Try again" : dest.kind === "none" ? "Call " + restName + " (demo)" : dest.kind === "dish" ? "Open dish page (demo)" : "Open menu (demo)"}
              </button>
              <button className="m-btn m-btn-quiet" style={{ width: "100%" }} onClick={onClose}>Not now</button>
            </div>
            <div className="m-caption" style={{ color: "var(--ink-3)", marginTop: 10, textAlign: "center" }}>Morsel never places an order. This demo stops at the handoff.</div>
          </div>
        )}
      </div>
    </div>
  );
}

// Kept as an alias so older capture recipes and docs that name the sheet still resolve.
const OrderSheet = NextStepSheet;

Object.assign(window, { NextStepSheet, OrderSheet });
