// Morsel v3 — search: craving-first, results carry info scent, recoverable empty state.
// v3.1 — distinguishes "nothing exists" from "your dietary rules exclude the matches".
function SearchScreen({ onBack, onOpen, gridCols, prefs, onEditDiet }) {
  const { dishes, applyDietPrefs } = window.MorselData;
  const pool = applyDietPrefs(dishes, prefs); // safety applies in search too
  const [q, setQ] = React.useState("");
  const norm = (s) => s.toLowerCase();
  const query = q.trim();
  const matchQ = (d) => [d.name, d.rest, d.tag, d.hood].some((f) => norm(f).includes(norm(query)));
  const results = query ? pool.filter(matchQ) : null;
  const trending = ["Ramen", "Pizza", "Brunch", "Sushi", "Shaw", "Adams Morgan", "Noodles", "The Wharf"];
  // related threads to pull on: tags + hoods present in results, minus the query itself
  const related = results && results.length
    ? [...new Set(results.flatMap((d) => [d.tag, d.hood]))].filter((t) => norm(t) !== norm(query)).slice(0, 4)
    : [];

  return (
    <div className="m-screen m-fade" style={{ background: "var(--paper)" }}>
      <div style={{ padding: "58px 14px 12px", display: "flex", gap: 8, alignItems: "center" }}>
        <button className="m-btn m-btn-quiet" style={{ flex: "none", width: 46, minHeight: 46, padding: 0 }} aria-label="Back" onClick={onBack}>
          <MIcon name="back" size={18} />
        </button>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "var(--sunken)", borderRadius: 99, padding: "0 16px", minHeight: 46 }}>
          <div style={{ color: "var(--ink-3)", flex: "none" }}><MIcon name="search" size={17} /></div>
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="A dish, a place, a craving…"
            style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "none", font: "inherit", fontSize: 16, color: "var(--ink)" }} />
          {q && <button className="m-caption" style={{ color: "var(--ink-2)", fontWeight: 700, flex: "none" }} onClick={() => setQ("")}>Clear</button>}
        </div>
      </div>

      <div className="m-scroll" style={{ paddingBottom: 40 }}>
        {!results && (
          <div>
            <div className="m-micro" style={{ color: "var(--ink-3)", padding: "10px 16px 10px" }}>Trending in DC</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "0 16px 18px" }}>
              {trending.map((t) => (
                <button key={t} className="m-chip" style={{ minHeight: 40, padding: "8px 16px", fontSize: 14 }} onClick={() => setQ(t)}>{t}</button>
              ))}
            </div>
            <div className="m-micro" style={{ color: "var(--ink-3)", padding: "0 16px 12px" }}>Everything near you</div>
            <FeedGrid dishes={pool} cols={gridCols || 3} onOpen={onOpen} />
          </div>
        )}
        {results && results.length > 0 && (
          <div>
            <div className="m-caption" style={{ color: "var(--ink-3)", fontWeight: 600, padding: "6px 16px 12px" }}>
              {results.length} dish{results.length === 1 ? "" : "es"} for “{query}”
            </div>
            {/* results carry name + price — searchers are comparing, not grazing */}
            <FeedGrid dishes={results} cols={2} onOpen={onOpen} label={(d) => `${d.name} · ${d.price}`} />
            {related.length > 0 && (
              <div style={{ padding: "20px 16px 0" }}>
                <div className="m-micro" style={{ color: "var(--ink-3)", marginBottom: 10 }}>Pull another thread</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {related.map((t) => (
                    <button key={t} className="m-chip" style={{ minHeight: 40, padding: "8px 16px", fontSize: 14 }} onClick={() => setQ(t)}>{t}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {results && results.length === 0 && (() => {
          // why is it empty? absent inventory vs dietary exclusion — different answers
          const raw = dishes.filter(matchQ);
          const ls = prefs && prefs.lifestyle;
          const al = ((prefs && prefs.allergies) || []).map((a) => a.toLowerCase());
          const lsBlocked = ls ? raw.filter((d) => applyDietPrefs([d], { lifestyle: ls }).length === 0) : [];
          const alHits = [...new Set(raw.flatMap((d) => (d.allergens || []).filter((a) => al.includes(a))))];
          if (raw.length > 0 && (lsBlocked.length > 0 || alHits.length > 0)) return (
            <div style={{ padding: "10px 16px" }}>
              <div style={{ borderRadius: "var(--r)", background: "var(--sunken)", padding: "24px 20px" }}>
                <div className="m-second" style={{ fontWeight: 800, marginBottom: 6 }}>No “{query}” matches your current dietary settings</div>
                <div className="m-caption" style={{ color: "var(--ink-2)", marginBottom: 12 }}>{raw.length === 1 ? "1 dish exists on Morsel but is" : raw.length + " dishes exist on Morsel but are"} excluded by:</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                  {ls && lsBlocked.length > 0 && (
                    <div className="m-caption" style={{ borderRadius: 99, padding: "6px 12px", fontWeight: 700, background: "var(--surface)", color: "var(--ink-2)", border: "1px solid var(--line)" }}>{ls} · lifestyle</div>
                  )}
                  {alHits.map((a) => (
                    <div key={a} className="m-caption" style={{ borderRadius: 99, padding: "6px 12px", fontWeight: 700, background: "var(--accent)", color: "var(--accent-ink)" }}><span aria-hidden="true">! </span>no {a} · allergy</div>
                  ))}
                </div>
                {ls && lsBlocked.length > 0 && (
                  <button className="m-btn m-btn-quiet" style={{ width: "100%", minHeight: 46 }} onClick={onEditDiet}>Edit lifestyle preferences</button>
                )}
                <div className="m-caption" style={{ color: "var(--ink-3)", marginTop: 12 }}>
                  Allergy protections are separate and always stay on — edit them deliberately in Diet &amp; safety.
                </div>
              </div>
            </div>
          );
          return (
          <div style={{ padding: "10px 16px" }}>
            <div style={{ borderRadius: "var(--r)", background: "var(--sunken)", padding: "26px 24px", textAlign: "center", marginBottom: 18 }}>
              <div className="m-second" style={{ fontWeight: 700, marginBottom: 4 }}>Nothing for “{query}” yet</div>
              <div className="m-caption" style={{ color: "var(--ink-2)" }}>We match dishes, restaurants, cuisines, and neighborhoods.</div>
            </div>
            <div className="m-micro" style={{ color: "var(--ink-3)", marginBottom: 10 }}>Hungry anyway? Try one of these</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {trending.map((t) => (
                <button key={t} className="m-chip" style={{ minHeight: 40, padding: "8px 16px", fontSize: 14 }} onClick={() => setQ(t)}>{t}</button>
              ))}
            </div>
          </div>
          );
        })()}
      </div>
    </div>
  );
}

Object.assign(window, { SearchScreen });
