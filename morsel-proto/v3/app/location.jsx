// Morsel — location sheet: type any place, then refine to a nearby neighborhood.
// Mock geo index — enough breadth to prove the pattern isn't DC-exclusive.
const MORSEL_PLACES = [
  { city: "Washington, DC", hoods: ["Shaw", "Dupont Circle", "Capitol Hill", "Adams Morgan", "Georgetown", "Navy Yard"] },
  { city: "Rockville, MD", hoods: ["Rockville Town Square", "Twinbrook", "King Farm", "Pike & Rose", "North Bethesda"] },
  { city: "Bethesda, MD", hoods: ["Downtown Bethesda", "Woodmont Triangle", "Westbard"] },
  { city: "Silver Spring, MD", hoods: ["Downtown Silver Spring", "Fenton Village", "Long Branch"] },
  { city: "Arlington, VA", hoods: ["Clarendon", "Ballston", "Crystal City", "Rosslyn"] },
  { city: "Alexandria, VA", hoods: ["Old Town", "Del Ray", "Carlyle"] },
  { city: "Los Angeles, CA", hoods: ["Silver Lake", "Echo Park", "Koreatown", "Venice", "Highland Park", "Arts District"] },
  { city: "Brooklyn, NY", hoods: ["Williamsburg", "Fort Greene", "Carroll Gardens", "Bushwick"] }
];

function LocationSheet({ loc, onChange, onClose }) {
  const [q, setQ] = React.useState("");
  const [cityPick, setCityPick] = React.useState(null); // stage 2: refine to a hood
  const query = q.trim().toLowerCase();

  // match cities and neighborhoods
  const matches = [];
  if (query) {
    MORSEL_PLACES.forEach((p) => {
      if (p.city.toLowerCase().includes(query)) matches.push({ city: p.city });
      p.hoods.forEach((h) => {
        if (h.toLowerCase().includes(query)) matches.push({ city: p.city, hood: h });
      });
    });
  }

  const commit = (city, hood) => { onChange({ city, hood: hood || null }); onClose(); };
  const stage2 = cityPick ? MORSEL_PLACES.find((p) => p.city === cityPick) : null;

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 60, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <button aria-label="Close" onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(15,9,4,.45)", cursor: "pointer" }}></button>
      <div className="m-rise" style={{ position: "relative", background: "var(--surface)", borderRadius: "calc(var(--r) + 4px) calc(var(--r) + 4px) 0 0", padding: "10px 20px 28px", boxShadow: "var(--shadow-float)", maxHeight: "78%", display: "flex", flexDirection: "column" }}>
        <div style={{ width: 36, height: 4, borderRadius: 99, background: "var(--line)", margin: "0 auto 14px", flex: "none" }}></div>

        {!stage2 ? (
          <React.Fragment>
            <div className="m-heading" style={{ marginBottom: 12, flex: "none" }}>Where are you eating?</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--sunken)", borderRadius: 99, padding: "0 16px", minHeight: 48, flex: "none", marginBottom: 6 }}>
              <div style={{ color: "var(--ink-3)", flex: "none" }}><MIcon name="search" size={16} /></div>
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="City, neighborhood, or zip"
                style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "none", font: "inherit", fontSize: 16, color: "var(--ink)" }} />
              {q && <button className="m-caption" style={{ color: "var(--ink-2)", fontWeight: 700, flex: "none" }} onClick={() => setQ("")}>Clear</button>}
            </div>

            <div className="m-scroll" style={{ margin: "0 -6px" }}>
              {!query && (
                <button onClick={() => commit(null)}
                  style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 6px", borderRadius: 14, minHeight: 52 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 99, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--accent)", color: "var(--accent-ink)" }}>
                    <MIcon name="nav" size={17} />
                  </div>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div className="m-second" style={{ fontWeight: 700 }}>Use my location</div>
                    <div className="m-caption" style={{ color: "var(--ink-3)" }}>Currently Shaw, Washington DC</div>
                  </div>
                  {!loc && <div style={{ color: "var(--accent)", flex: "none" }}><MIcon name="check" size={18} /></div>}
                </button>
              )}
              {query && matches.length === 0 && (
                <div className="m-caption" style={{ color: "var(--ink-3)", padding: "16px 6px" }}>No places match “{q}” — try a city or neighborhood name.</div>
              )}
              {matches.map((m, i) => (
                <button key={i} onClick={() => m.hood ? commit(m.city, m.hood) : setCityPick(m.city)}
                  style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "11px 6px", borderRadius: 14, minHeight: 48 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 99, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--sunken)", color: "var(--ink-2)" }}>
                    <MIcon name="pin" size={16} />
                  </div>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div className="m-second" style={{ fontWeight: 700 }}>{m.hood || m.city}</div>
                    <div className="m-caption" style={{ color: "var(--ink-3)" }}>
                      {m.hood ? m.city : "city"}{window.MorselData.covered.includes(m.city) ? "" : " · no coverage yet"}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flex: "none" }}>
              <button className="m-btn m-btn-quiet" style={{ width: 40, minHeight: 40, padding: 0, flex: "none" }} aria-label="Back" onClick={() => setCityPick(null)}>
                <MIcon name="back" size={16} />
              </button>
              <div>
                <div className="m-heading" style={{ fontSize: 20 }}>{stage2.city}</div>
                <div className="m-caption" style={{ color: "var(--ink-3)" }}>Pick a neighborhood, or take the whole city</div>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
              {stage2.hoods.map((h) => (
                <button key={h} className="m-chip" onClick={() => commit(stage2.city, h)}>{h}</button>
              ))}
            </div>
            <button className="m-btn m-btn-primary" style={{ width: "100%", flex: "none" }} onClick={() => commit(stage2.city, null)}>
              All of {stage2.city.split(",")[0]}
            </button>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { LocationSheet });
