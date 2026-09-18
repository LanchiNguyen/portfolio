// Morsel v3.2 — profile: taste, dietary settings, area, and what this demo is.
// No invented account, no linked apps, no notification schedule: only rows that
// do something in this prototype.
function ProfileScreen({ prefs, saved, collections, loc, onTuneTaste, onEditDiet, onOpenSaved, onOpenLocation }) {
  const { dishes, demoArea } = window.MorselData;
  const picked = (prefs && prefs.picked) || [];
  const tasteTags = [...new Set(picked.map((id) => { const d = dishes.find((x) => x.id === id); return d && d.tag; }).filter(Boolean))];
  const lifestyle = (prefs && prefs.lifestyle) || null;
  const allergies = (prefs && prefs.allergies) || [];
  const unknownCount = dishes.filter((d) => d.allergens === null || d.allergens === undefined).length;
  const locLabel = loc && loc.city ? (loc.hood ? loc.hood + ", " + loc.city.split(",")[0] : loc.city) : demoArea.hood + ", DC";

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
            {unknownCount} dishes have no ingredient information. Ingredient lists do not cover preparation or cross-contact. Always confirm with the restaurant.
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
            <div className="m-caption" style={{ color: "var(--ink-3)" }}>No taste picks yet.</div>
          )}
          <div className="m-caption" style={{ color: "var(--ink-3)", marginTop: 12 }}>
            {tasteTags.length ? `Based on the ${picked.length} dish${picked.length === 1 ? "" : "es"} you chose.` : "Choose a few dishes to personalize your feed."}
          </div>
        </div>

        <div className="m-micro" style={{ color: "var(--ink-3)", marginBottom: 4 }}>Settings</div>
        <Row icon="pin" label="Area" value={locLabel} onClick={onOpenLocation} />
        <Row icon="heart" label="Saved" value={saved.size + " dish" + (saved.size === 1 ? "" : "es")} onClick={onOpenSaved} />
      </div>

    </div>
  );
}

Object.assign(window, { ProfileScreen });
