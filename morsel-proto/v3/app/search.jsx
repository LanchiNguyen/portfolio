// Morsel v3.2 — search: the same constraints as the feed, the same cards, and an
// empty state that says exactly which rule removed the matches.
// The query lives in app state (not here) so opening a dish and coming Back
// restores the same results, filters and scroll position.
function SearchScreen({ onBack, onOpen, gridCols, prefs, onEditDiet, filters, onFilters, onClearFilters, loc, query, onQuery, saved, onToggleSave }) {
  const { dishes, partition, covered, demoArea } = window.MorselData;
  const [scrollRef, onScroll] = useScrollMemo("search");
  const norm = (s) => s.toLowerCase();
  const q = (query || "").trim();
  const matchQ = (d) => [d.name, d.rest, d.tag, d.hood].some((f) => norm(f).includes(norm(q)));

  // one classifier, then browsing filters, then the query — same order as the feed
  const part = partition(dishes, prefs);
  const pool = applyMorselFilters(part.match, filters);
  const unknownPool = applyMorselFilters(part.unknown, filters);
  const results = q ? pool.filter(matchQ) : null;
  const unknownResults = q ? unknownPool.filter(matchQ) : unknownPool;
  const allergyOn = prefs && (prefs.allergies || []).length > 0;
  const noCoverage = !!(loc && loc.city && !covered.includes(loc.city));
  const areaName = loc && loc.city ? (loc.hood || loc.city.split(",")[0]) : demoArea.hood;
  const fCount = morselFilterCount(filters);

  // browse-by chips come from the catalog itself, not from invented momentum
  const browse = [...new Set(dishes.map((d) => d.tag))].slice(0, 6).concat([...new Set(dishes.map((d) => d.hood))].slice(0, 4));
  // related threads to pull on: tags + hoods present in results, minus the query itself
  const related = results && results.length
    ? [...new Set(results.flatMap((d) => [d.tag, d.hood]))].filter((t) => norm(t) !== norm(q)).slice(0, 4)
    : [];

  return (
    <div className="m-screen m-fade" style={{ background: "var(--paper)" }}>
      <div style={{ padding: "58px 14px 8px", display: "flex", gap: 8, alignItems: "center" }}>
        <button className="m-btn m-btn-quiet" style={{ flex: "none", width: 46, minHeight: 46, padding: 0 }} aria-label="Back" onClick={onBack}>
          <MIcon name="back" size={18} />
        </button>
        <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8, background: "var(--sunken)", borderRadius: 99, padding: "0 14px", minHeight: 46 }}>
          <div style={{ color: "var(--ink-3)", flex: "none" }}><MIcon name="search" size={17} /></div>
          <input aria-label="Search dishes, restaurants, cuisines and neighborhoods" size={8} autoFocus={!q} value={query || ""} onChange={(e) => onQuery(e.target.value)} placeholder="A dish, a place, a craving…"
            style={{ flex: 1, minWidth: 0, border: "none",  background: "none", font: "inherit", fontSize: 16, color: "var(--ink)" }} />
          {q && <button className="m-caption" style={{ color: "var(--ink-2)", fontWeight: 700, flex: "none", minHeight: 32 }} onClick={() => onQuery("")}>Clear</button>}
        </div>
        <button className="m-btn m-btn-quiet" style={{ flex: "none", width: 46, minHeight: 46, padding: 0, position: "relative" }} aria-label={fCount ? `Filters, ${fCount} active` : "Filters"} onClick={onFilters}>
          <MIcon name="sliders" size={18} />
          {fCount > 0 && <div aria-hidden="true" style={{ position: "absolute", top: -3, right: -3, minWidth: 18, height: 18, borderRadius: 99, background: "var(--accent)", color: "var(--accent-ink)", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>{fCount}</div>}
        </button>
      </div>
      <div className="m-caption" style={{ color: "var(--ink-3)", padding: "0 16px 6px" }}>Searching near {areaName}{loc && loc.city ? "" : " (demo area)"}. Clearing the query keeps your filters.</div>
      <ConstraintBar prefs={prefs} filters={filters} onFilters={onFilters} onClearFilters={onClearFilters} onEditDiet={onEditDiet} />

      <div className="m-scroll" ref={scrollRef} onScroll={onScroll} style={{ paddingBottom: 40 }}>
        {noCoverage ? (
          <div style={{ margin: "10px 16px", borderRadius: "var(--r)", background: "var(--sunken)", padding: "24px 20px", textAlign: "center" }}>
            <div className="m-second" style={{ fontWeight: 800, marginBottom: 4 }}>{loc.city.split(",")[0]} isn't in this demo</div>
            <div className="m-caption" style={{ color: "var(--ink-2)" }}>This demo covers Washington, DC. Change the area from the feed to search the sample catalog.</div>
          </div>
        ) : !results ? (
          <div>
            <div className="m-micro" style={{ color: "var(--ink-3)", padding: "10px 16px 10px" }}>Browse by</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "0 16px 18px" }}>
              {browse.map((t) => (
                <button key={t} className="m-chip" style={{ minHeight: 40, padding: "8px 16px", fontSize: 14 }} onClick={() => onQuery(t)}>{t}</button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "0 16px 10px" }}>
              <div className="m-micro" style={{ color: "var(--ink-3)" }}>All dishes near {areaName}</div>
              <div className="m-caption" style={{ color: "var(--ink-3)", fontWeight: 600 }}>{pool.length}</div>
            </div>
            <FeedGrid dishes={pool} cols={gridCols || 2} onOpen={onOpen} saved={saved} onToggleSave={onToggleSave} />
            {allergyOn && <UnknownSection dishes={unknownResults} cols={gridCols || 2} onOpen={onOpen} saved={saved} onToggleSave={onToggleSave} prefs={prefs} />}
          </div>
        ) : results.length > 0 ? (
          <div>
            <div className="m-caption" style={{ color: "var(--ink-3)", fontWeight: 600, padding: "6px 16px 12px" }}>
              {results.length} dish{results.length === 1 ? "" : "es"} for “{q}”
            </div>
            <FeedGrid dishes={results} cols={2} onOpen={onOpen} saved={saved} onToggleSave={onToggleSave} />
            {allergyOn && <UnknownSection dishes={unknownResults} cols={2} onOpen={onOpen} saved={saved} onToggleSave={onToggleSave} prefs={prefs} />}
            {related.length > 0 && (
              <div style={{ padding: "20px 16px 0" }}>
                <div className="m-micro" style={{ color: "var(--ink-3)", marginBottom: 10 }}>Pull another thread</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {related.map((t) => (
                    <button key={t} className="m-chip" style={{ minHeight: 40, padding: "8px 16px", fontSize: 14 }} onClick={() => onQuery(t)}>{t}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (() => {
          // why is it empty? nothing in the catalog, removed by a browsing filter, or
          // removed by a dietary setting — three different answers, three recoveries
          const raw = dishes.filter(matchQ);
          const dietMatch = part.match.filter(matchQ);
          const byFilter = dietMatch.filter((d) => !pool.includes(d));
          const byLifestyle = raw.filter((d) => window.MorselData.dietState(d, prefs).state === "lifestyle");
          const byAllergy = raw.filter((d) => window.MorselData.dietState(d, prefs).state === "conflict");
          const alHits = [...new Set(byAllergy.flatMap((d) => window.MorselData.dietState(d, prefs).conflicts))];
          if (raw.length === 0) return (
            <div style={{ padding: "10px 16px" }}>
              <div style={{ borderRadius: "var(--r)", background: "var(--sunken)", padding: "26px 24px", textAlign: "center", marginBottom: 18 }}>
                <div className="m-second" style={{ fontWeight: 700, marginBottom: 4 }}>Nothing for “{q}” in this catalog</div>
                <div className="m-caption" style={{ color: "var(--ink-2)" }}>We match dish names, restaurants, cuisines and neighborhoods across {dishes.length} demo dishes.</div>
              </div>
              <div className="m-micro" style={{ color: "var(--ink-3)", marginBottom: 10 }}>Try one of these</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {browse.map((t) => (
                  <button key={t} className="m-chip" style={{ minHeight: 40, padding: "8px 16px", fontSize: 14 }} onClick={() => onQuery(t)}>{t}</button>
                ))}
              </div>
            </div>
          );
          return (
            <div style={{ padding: "10px 16px" }}>
              <div style={{ borderRadius: "var(--r)", background: "var(--sunken)", padding: "24px 20px" }}>
                <div className="m-second" style={{ fontWeight: 800, marginBottom: 6 }}>{raw.length} “{q}” {raw.length === 1 ? "dish exists" : "dishes exist"}, but your settings exclude {raw.length === 1 ? "it" : "them"}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
                  {byFilter.length > 0 && (
                    <div>
                      <div className="m-caption" style={{ color: "var(--ink-2)", marginBottom: 8 }}>{byFilter.length} removed by your browsing filters ({morselFilterChips(filters).map((c) => c.t).join(", ")}).</div>
                      <button className="m-btn m-btn-primary" style={{ width: "100%", minHeight: 46 }} onClick={onClearFilters}>Clear browsing filters</button>
                    </div>
                  )}
                  {byLifestyle.length > 0 && (
                    <div>
                      <div className="m-caption" style={{ color: "var(--ink-2)", marginBottom: 8 }}>{byLifestyle.length} removed by your {prefs.lifestyle.toLowerCase()} setting.</div>
                      <button className="m-btn m-btn-quiet" style={{ width: "100%", minHeight: 46 }} onClick={onEditDiet}>Edit dietary settings</button>
                    </div>
                  )}
                  {byAllergy.length > 0 && (
                    <div className="m-caption" style={{ color: "var(--ink-2)" }}>
                      <span style={{ color: "var(--accent)", fontWeight: 800 }}>! </span>{byAllergy.length} {byAllergy.length === 1 ? "lists" : "list"} {alHits.join(" or ").toLowerCase()}, which you asked to avoid. Allergy settings are never cleared from here.
                    </div>
                  )}
                  {unknownResults.length > 0 && (
                    <div className="m-caption" style={{ color: "var(--ink-2)" }}>{unknownResults.length} {unknownResults.length === 1 ? "has" : "have"} no ingredient information and {unknownResults.length === 1 ? "is" : "are"} listed below, not counted as a match.</div>
                  )}
                </div>
              </div>
              {allergyOn && <div style={{ margin: "0 -16px" }}><UnknownSection dishes={unknownResults} cols={2} onOpen={onOpen} saved={saved} onToggleSave={onToggleSave} prefs={prefs} /></div>}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

Object.assign(window, { SearchScreen });
