// Morsel v3.2 — profile: taste, dietary settings, area, and what this demo is.
// No invented account, no linked apps, no notification schedule: only rows that
// do something in this prototype.
function ProfileScreen({ prefs, saved, collections, loc, onTuneTaste, onEditDiet, onOpenSaved, onOpenLocation }) {
  const { dishes, demoArea, checked, allergens: tracked } = window.MorselData;
  const picked = (prefs && prefs.picked) || [];
  const tasteTags = [...new Set(picked.map((id) => { const d = dishes.find((x) => x.id === id); return d && d.tag; }).filter(Boolean))];
  const lifestyle = (prefs && prefs.lifestyle) || null;
  const allergies = (prefs && prefs.allergies) || [];
  const unknownCount = dishes.filter((d) => d.allergens === null || d.allergens === undefined).length;
  const locLabel = loc && loc.city ? (loc.hood ? loc.hood + ", " + loc.city.split(",")[0] : loc.city) : demoArea.hood + ", DC (demo)";
  const [info, setInfo] = React.useState(false);

  const Row = ({ icon, label, value, onClick }) => (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "14px 2px", borderBottom: "1px solid var(--line)", minHeight: 52 }}>
      <div style={{ color: "var(--ink-2)", flex: "none" }}><MIcon name={icon} size={19} /></div>
      <div className="m-second" style={{ fontWeight: 700, flex: 1, textAlign: "left" }}>{label}</div>
      <div className="m-caption" style={{ color: "var(--ink-3)", flex: "none", textAlign: "right" }}>{value}</div>
      <div style={{ color: "var(--ink-3)", flex: "none", transform: "rotate(180deg)" }}><MIcon name="back" size={14} /></div>
    </button>
  );

  return (
    <div className="m-screen m-fade" style={{ background: "var(--paper)" }}>
      <div className="m-scroll" style={{ padding: "64px 22px 120px" }}>
        <div style={{ marginBottom: 22 }}>
          <div className="m-display" style={{ fontSize: "calc(32px * var(--ts))" }}>You</div>
          <div className="m-caption" style={{ color: "var(--ink-2)", marginTop: 4 }}>{locLabel} · {saved.size} dish{saved.size === 1 ? "" : "es"} saved · {collections.length} collection{collections.length === 1 ? "" : "s"}</div>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r)", padding: "18px 16px", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div className="m-micro" style={{ color: "var(--ink-3)" }}>Dietary settings</div>
            <button className="m-caption" style={{ color: "var(--accent)", fontWeight: 700, minHeight: 32 }} onClick={onEditDiet}>Edit</button>
          </div>
          <div className="m-caption" style={{ color: "var(--ink-3)", marginBottom: 8 }}>Dietary preference</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            {lifestyle ? (
              <div style={{ borderRadius: 99, border: "1.5px solid var(--line)", padding: "8px 14px", fontSize: "calc(14px * var(--ts))", fontWeight: 600, color: "var(--ink-2)" }}>{lifestyle}</div>
            ) : (
              <div className="m-caption" style={{ color: "var(--ink-3)", padding: "6px 0" }}>None set</div>
            )}
          </div>
          <div className="m-caption" style={{ color: "var(--accent)", fontWeight: 600, marginBottom: 8 }}>Allergies</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {allergies.length ? allergies.map((d) => (
              <div key={d} style={{ display: "inline-flex", alignItems: "center", gap: 5, borderRadius: 99, background: "var(--accent)", color: "var(--accent-ink)", padding: "8px 14px", fontSize: "calc(14px * var(--ts))", fontWeight: 700 }}>
                <span aria-hidden="true">!</span> {d}
              </div>
            )) : (
              <div className="m-caption" style={{ color: "var(--ink-3)", padding: "6px 0" }}>None set</div>
            )}
          </div>
          <div className="m-caption" style={{ color: "var(--ink-3)", marginTop: 12 }}>
            {unknownCount} dishes have no ingredient information. The sample menus do not cover preparation or cross-contact. Always confirm with the restaurant.
          </div>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r)", padding: "18px 16px", marginBottom: 26 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div className="m-micro" style={{ color: "var(--ink-3)" }}>Your taste</div>
            <button className="m-caption" style={{ color: "var(--accent)", fontWeight: 700, minHeight: 32 }} onClick={onTuneTaste}>{tasteTags.length ? "Edit" : "Choose"}</button>
          </div>
          {tasteTags.length ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {tasteTags.map((t) => (
                <div key={t} style={{ borderRadius: 99, background: "var(--sunken)", padding: "8px 14px", fontSize: "calc(14px * var(--ts))", fontWeight: 700 }}>{t}</div>
              ))}
            </div>
          ) : (
            <div className="m-caption" style={{ color: "var(--ink-3)" }}>No favorites chosen yet.</div>
          )}
          <div className="m-caption" style={{ color: "var(--ink-3)", marginTop: 12 }}>
            {tasteTags.length ? `Based on the ${picked.length} dish${picked.length === 1 ? "" : "es"} you chose.` : "Choose a few dishes to personalize your feed."}
          </div>
        </div>

        <div className="m-micro" style={{ color: "var(--ink-3)", marginBottom: 4 }}>Settings</div>
        <Row icon="pin" label="Area" value={locLabel} onClick={onOpenLocation} />
        <Row icon="heart" label="Saved" value={saved.size + " dish" + (saved.size === 1 ? "" : "es")} onClick={onOpenSaved} />
        <Row icon="info" label="About this demo" value="Illustrative data" onClick={() => setInfo(true)} />
      </div>

      {info && (
        <div style={{ position: "absolute", inset: 0, zIndex: 60, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <button aria-label="Close" onClick={() => setInfo(false)} style={{ position: "absolute", inset: 0, background: "rgba(15,9,4,.45)", cursor: "pointer" }}></button>
          <div className="m-rise" role="dialog" aria-label="About this demo" style={{ position: "relative", background: "var(--surface)", borderRadius: "calc(var(--r) + 4px) calc(var(--r) + 4px) 0 0", padding: "10px 20px 28px", boxShadow: "var(--shadow-float)" }}>
            <div style={{ width: 36, height: 4, borderRadius: 99, background: "var(--line)", margin: "0 auto 14px" }}></div>
            <div className="m-heading" style={{ marginBottom: 6 }}>About this demo</div>
            <div className="m-second" style={{ color: "var(--ink-2)", marginBottom: 14 }}>Morsel is a working design concept with fictional restaurants and sample menus.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 14 }}>
              {[
                `${dishes.length} illustrative dishes across ${[...new Set(dishes.map((d) => d.rest))].length} fictional restaurants in ${demoArea.hood}, Washington DC`,
                `Prices, ingredients, links and dates are sample data; ${unknownCount} dishes have missing ingredient details`,
                `Allergen tracking covers ${tracked.join(", ").toLowerCase()} only, from menu listings — not preparation`,
                "Menu and call buttons are simulated. No orders are placed",
                "Saves and settings stay in this browser only"
              ].map((it) => (
                <div key={it} className="m-second" style={{ fontWeight: 600, padding: "10px 0", borderBottom: "1px solid var(--line)" }}>{it}</div>
              ))}
            </div>
            <button className="m-btn m-btn-quiet" style={{ width: "100%" }} onClick={() => setInfo(false)}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { ProfileScreen });
