// Morsel v3.2 — restaurant: every dish we have from one spot, with the same card
// and the same dietary policy as everywhere else. A restaurant menu may show a
// conflicting dish for context, flagged — it is never presented as a recommendation.
// The restaurant-level next step opens the menu; it never silently picks a dish.
function RestaurantScreen({ restName, onBack, onOpen, prefs, saved, onToggleSave }) {
  const { u, dishes, dietState, nextStepLabel, destination, checked, demoArea } = window.MorselData;
  const items = dishes.filter((d) => d.rest === restName);
  const [nextOpen, setNextOpen] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const ping = (msg) => { setToast(msg); window.clearTimeout(ping._t); ping._t = window.setTimeout(() => setToast(null), 1800); };
  if (!items.length) return null;
  const first = items[0];
  const priced = items.map((d) => d.price).filter((p) => p !== null && p !== undefined);
  const priceRange = priced.length ? (Math.min(...priced) === Math.max(...priced) ? "$" + priced[0] : "$" + Math.min(...priced) + "–" + Math.max(...priced)) : "Not listed";
  const flagged = items.filter((d) => { const s = dietState(d, prefs).state; return s === "conflict" || s === "unknown"; }).length;
  const dest = destination(restName);

  return (
    <div className="m-screen m-fade" style={{ background: "var(--paper)" }}>
      <div style={{ position: "absolute", top: 58, left: 14, zIndex: 30 }}>
        <button className="m-glass m-glass-icon" aria-label="Back" onClick={onBack}><MIcon name="back" size={18} /></button>
      </div>

      <div className="m-scroll">
        <div style={{ position: "relative", height: 260, background: "var(--sunken)" }}>
          <img src={u(first.img, 900)} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          <div className="m-veil"></div>
          <div style={{ position: "absolute", left: 20, right: 20, bottom: 20, color: "#FFF7EB" }}>
            <div className="m-micro" style={{ color: "rgba(255,247,235,.72)", marginBottom: 6 }}>{first.hood}</div>
            <div className="m-title" style={{ fontSize: 30 }}>{restName}</div>
          </div>
        </div>

        <div style={{ padding: "16px 22px 0" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            {[
              { big: String(items.length), small: items.length === 1 ? "dish on Morsel" : "dishes on Morsel" },
              { big: priceRange, small: priced.length < items.length ? "menu prices · some not listed" : "menu prices" },
              { big: first.mi + " mi", small: "from " + demoArea.hood + " (demo)" }
            ].map((s) => (
              <div key={s.small} style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r)", padding: "12px 10px", textAlign: "center" }}>
                <div className="m-heading" style={{ fontSize: 20 }}>{s.big}</div>
                <div className="m-caption" style={{ color: "var(--ink-3)", marginTop: 2, fontSize: 12 }}>{s.small}</div>
              </div>
            ))}
          </div>
          <div className="m-caption" style={{ color: "var(--ink-3)", marginBottom: 16 }}>Menu information as of {checked}. Illustrative demo catalog.</div>

          <button className="m-btn m-btn-primary" style={{ width: "100%", marginBottom: 6 }} onClick={() => setNextOpen(true)}>
            {nextStepLabel(restName)}
          </button>
          <div className="m-caption" style={{ color: "var(--ink-3)", marginBottom: 22, textAlign: "center" }}>
            {dest.kind === "none" ? "No online menu to link to; call or visit." : `Menu preview: ${dest.host} (demo).`}
          </div>

          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
            <div className="m-heading">Dishes on Morsel</div>
          </div>
          {flagged > 0 && (
            <div className="m-caption" style={{ color: "var(--ink-2)", marginBottom: 10 }}>
              {flagged} {flagged === 1 ? "dish is" : "dishes are"} flagged against your dietary settings. Shown for context, not recommended.
            </div>
          )}
        </div>
        <div style={{ padding: "8px 0 40px" }}>
          <FeedGrid dishes={items} cols={2} onOpen={onOpen} saved={saved} onToggleSave={onToggleSave} prefs={prefs} />
        </div>
      </div>

      {nextOpen && <NextStepSheet rest={restName} onClose={() => setNextOpen(false)} onPing={ping} />}
      {toast && (
        <div className="m-rise" role="status" style={{ position: "absolute", bottom: 30, left: "50%", transform: "translateX(-50%)", zIndex: 50, background: "var(--ink)", color: "var(--paper)", borderRadius: 99, padding: "10px 20px", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", boxShadow: "var(--shadow-float)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { RestaurantScreen });
