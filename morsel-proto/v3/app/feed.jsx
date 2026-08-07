// Morsel v3 — feed: hero carousel + grid, taste-boosted ranking, honest states.
function FeedHero({ dishes, saved, onOpen, onToggleSave }) {
  const { u } = window.MorselData;
  const sim = window.MorselSim || {};
  const railRef = React.useRef(null);
  const [idx, setIdx] = React.useState(0);
  const onScroll = () => {
    const el = railRef.current;
    if (el) setIdx(Math.round(el.scrollLeft / el.clientWidth));
  };
  return (
    <div style={{ position: "relative" }}>
      <div ref={railRef} onScroll={onScroll} style={{
        display: "flex", overflowX: "auto", scrollSnapType: "x mandatory",
        scrollbarWidth: "none", gap: 0
      }}>
        {dishes.map((d) => {
          const isSaved = saved.has(d.id);
          return (
          <div key={d.id} style={{
            position: "relative", flex: "none", width: "100%", scrollSnapAlign: "start",
            height: 470, overflow: "hidden", background: "var(--sunken)"
          }}>
            {/* v3.1: open + save are sibling controls — never nested interactives */}
            <button onClick={(e) => onOpen(d, e)} aria-label={"Open " + d.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", textAlign: "left" }}>
            {!sim.imgfail ? (
              <img src={u(d.img, 900)} alt={d.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div className="m-micro" style={{ color: "var(--ink-3)" }}>photo unavailable</div>
              </div>
            )}
            <div className="m-veil" style={{ background: "linear-gradient(to top, rgba(12,7,3,.78) 0%, rgba(12,7,3,.25) 30%, rgba(12,7,3,0) 48%, rgba(12,7,3,.22) 86%, rgba(12,7,3,.45) 100%)", opacity: sim.imgfail ? 0 : 1 }}></div>
            <div style={{ position: "absolute", left: 20, right: 76, bottom: 38, textAlign: "left" }}>
              <div style={{ minWidth: 0, color: sim.imgfail ? "var(--ink)" : "#FFF7EB" }}>
                <div className="m-micro" style={{ color: sim.imgfail ? "var(--ink-3)" : "rgba(255,247,235,.72)", marginBottom: 6 }}>{d.tag} · {d.hood}</div>
                <div className="m-title" style={{ fontSize: "calc(30px * var(--ts))" }}>{d.name}</div>
                <div className="m-second" style={{ color: sim.imgfail ? "var(--ink-2)" : "rgba(255,247,235,.78)", marginTop: 4 }}>{d.rest} · {d.price}</div>
              </div>
            </div>
            </button>
            <button aria-label={isSaved ? "Remove " + d.name + " from saves" : "Save " + d.name} aria-pressed={isSaved}
              onClick={() => onToggleSave(d.id)}
              className="m-glass m-glass-icon" style={{ position: "absolute", right: 20, bottom: 38, width: 44, height: 44, color: isSaved ? "#FF8A65" : "#FFF7EB" }}>
              <MIcon name="heart" size={21} filled={isSaved} />
            </button>
          </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 14, display: "flex", justifyContent: "center", gap: 5, pointerEvents: "none" }}>
        {dishes.map((_, i) => (
          <div key={i} style={{ width: i === idx ? 16 : 5, height: 5, borderRadius: 99, background: i === idx ? "#FFF7EB" : "rgba(255,247,235,.45)", transition: "all .25s ease" }}></div>
        ))}
      </div>
    </div>
  );
}

function FeedGrid({ dishes, cols, onOpen, label, flag }) {
  const { u } = window.MorselData;
  const sim = window.MorselSim || {};
  // distribute round-robin into N columns, preserving rough order
  const columns = Array.from({ length: cols }, () => []);
  const heights = Array.from({ length: cols }, () => 0);
  dishes.forEach((d) => {
    const i = heights.indexOf(Math.min(...heights));
    columns[i].push(d);
    heights[i] += d.h;
  });
  return (
    <div style={{ display: "flex", gap: 8, padding: "0 8px" }}>
      {columns.map((col, ci) => (
        <div key={ci} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
          {col.map((d) => {
            const warns = flag ? flag(d) : [];
            const tag = label ? label(d) : null;
            return (
              <button key={d.id} className="m-photo" aria-label={`Open ${d.name}, ${d.rest}`} onClick={(e) => onOpen(d, e)} style={{ aspectRatio: String(1 / d.h), borderRadius: "calc(var(--r) * 0.8)" }}>
                {!sim.imgfail ? (
                  <img src={u(d.img, cols === 3 ? 360 : 520)} alt={d.name} loading="lazy" />
                ) : (
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, padding: 12, textAlign: "center" }}>
                    <div className="m-caption" style={{ fontWeight: 700 }}>{d.name}</div>
                    <div className="m-micro" style={{ color: "var(--ink-3)" }}>photo unavailable</div>
                  </div>
                )}
                {warns && warns.length > 0 && (
                  <div className="m-warnchip"><span aria-hidden="true">!</span> {warns.join(" · ")}</div>
                )}
                {tag && (
                  <div className="m-glass" style={{ position: "absolute", left: 8, bottom: 8, padding: "5px 10px", fontSize: "calc(11.5px * var(--ts))", whiteSpace: "nowrap" }}>{tag}</div>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// Loading skeleton — shown while the feed "fetches" (simulated)
function FeedSkeleton({ cols }) {
  const tiles = [1.1, 0.85, 1.25, 0.95, 1.05, 1.2];
  return (
    <div>
      <div className="m-skel" style={{ height: 470, borderRadius: 0 }}></div>
      <div style={{ display: "flex", gap: 12, padding: "20px 16px 14px", alignItems: "center" }}>
        <div className="m-skel" style={{ width: 110, height: 22 }}></div>
        <div className="m-skel" style={{ width: 80, height: 22 }}></div>
      </div>
      <div style={{ display: "flex", gap: 8, padding: "0 8px" }}>
        {Array.from({ length: cols }, (_, ci) => (
          <div key={ci} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            {tiles.slice(ci, ci + 3).map((h, i) => (
              <div key={i} className="m-skel" style={{ aspectRatio: String(1 / h) }}></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function FeedScreen({ saved, onOpen, onToggleSave, gridCols, onSearch, filters, onFilters, onClearFilters, loc, onLocation, popTag, prefs, locDenied, onEnableLoc, onResetLoc, onEditDiet }) {
  const { dishes, heroIds, trend, applyDietPrefs, covered, affinity } = window.MorselData;
  const sim = window.MorselSim || {};
  const fCount = morselFilterCount(filters);
  const [mode, setMode] = React.useState("near");
  const [notified, setNotified] = React.useState(false);
  const locOff = locDenied && !loc; // v3.1: no fake "near you" claims without a location

  // safety first: lifestyle filters + allergy exclusions apply to EVERYTHING, hero included
  const dietPool = applyDietPrefs(dishes, prefs);
  const pool = applyMorselFilters(dietPool, filters);
  let heroes = heroIds.map((id) => pool.find((d) => d.id === id)).filter(Boolean);
  if (!heroes.length) heroes = pool.slice(0, 3);

  // v3 ranking — deterministic, transparent:
  //   Near you  = distance, minus a moderate taste-affinity boost (never a filter)
  //   Trending  = this week's saves × quality, so junk spikes can't win
  const aff = affinity(prefs && prefs.picked);
  const hasTaste = Object.keys(aff).length > 0;
  const heat = (d) => (trend[d.id] || 0) * (d.pct / 100);
  const nearScore = (d) => parseFloat(d.dist) - Math.min(aff[d.tag] || 0, 2) * 0.3;
  let rest = pool.filter((d) => d.id !== (heroes[0] && heroes[0].id));
  rest = [...rest].sort(mode === "trending"
    ? (a, b) => heat(b) - heat(a) || (a.id < b.id ? -1 : 1)
    : (a, b) => nearScore(a) - nearScore(b) || (a.id < b.id ? -1 : 1));

  const locLabel = loc ? (loc.hood || loc.city.split(",")[0]) : "Shaw, DC";
  const noCoverage = loc && !covered.includes(loc.city);

  // why-empty diagnostics for the zero-result state
  const dietaryActive = prefs && (prefs.lifestyle || (prefs.allergies || []).length > 0);
  const constraintChips = [];
  if (prefs && prefs.lifestyle) constraintChips.push({ t: prefs.lifestyle, warn: false });
  ((prefs && prefs.allergies) || []).forEach((a) => constraintChips.push({ t: "No " + a.toLowerCase(), warn: true }));
  if (filters.price.length) constraintChips.push({ t: "$".repeat(Math.min(...filters.price)) + " price", warn: false, filter: true });
  if (filters.maxMi < 99) constraintChips.push({ t: "within " + filters.maxMi + " mi", warn: false, filter: true });
  if (filters.openNow) constraintChips.push({ t: "open now", warn: false, filter: true });

  return (
    <div className="m-screen m-fade" style={{ background: "var(--paper)" }}>
      {/* floating chrome over the hero */}
      <div style={{ position: "absolute", top: 58, left: 14, right: 14, zIndex: 30, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button className="m-glass" onClick={onLocation}>
          <MIcon name="pin" size={15} /> {noCoverage ? locLabel + " · no coverage" : locDenied && !loc ? "Location off" : locLabel + " · now"}
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="m-glass m-glass-icon" aria-label="Search" onClick={onSearch}><MIcon name="search" size={18} /></button>
          <button className="m-glass m-glass-icon" aria-label="Filters" onClick={onFilters} style={{ position: "relative" }}>
            <MIcon name="sliders" size={18} />
            {fCount > 0 && (
              <div style={{ position: "absolute", top: -3, right: -3, minWidth: 18, height: 18, borderRadius: 99, background: "var(--accent)", color: "var(--accent-ink)", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>{fCount}</div>
            )}
          </button>
        </div>
      </div>

      {sim.loading ? (
        <div className="m-scroll" style={{ paddingBottom: 110 }} aria-label="Loading dishes near you">
          <FeedSkeleton cols={gridCols} />
        </div>
      ) : noCoverage ? (
        /* honest coverage state — never DC dishes under another city's label */
        <div className="m-scroll" style={{ paddingBottom: 110 }}>
          <div style={{ padding: "150px 28px 0", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 6 }}>
            <div style={{ width: 64, height: 64, borderRadius: 99, background: "var(--sunken)", color: "var(--ink-2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
              <MIcon name="pin" size={28} />
            </div>
            <div className="m-title">{loc.city.split(",")[0]} isn't<br />mapped yet.</div>
            <div className="m-second" style={{ color: "var(--ink-2)", maxWidth: 280, marginTop: 6 }}>
              Morsel opens city by city so every photo is recent and every dish is real. {loc.city.split(",")[0]} is on the list.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 22, alignSelf: "stretch" }}>
              <button className="m-btn m-btn-primary" onClick={onResetLoc}>Back to Washington, DC</button>
              <button className="m-btn m-btn-quiet" onClick={() => setNotified(true)} disabled={notified}>
                {notified ? "You're on the list ✓" : "Tell me when it opens"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="m-scroll" style={{ paddingBottom: 110, paddingTop: heroes.length ? 0 : 100 }}>
          <FeedHero dishes={heroes} saved={saved} onOpen={onOpen} onToggleSave={onToggleSave} />

          {sim.offline && (
            <div className="m-banner" role="status">
              <div style={{ flex: "none", width: 8, height: 8, borderRadius: 99, background: "var(--ink-3)" }}></div>
              <div style={{ flex: 1 }}>
                <div className="m-caption" style={{ fontWeight: 700 }}>You're offline</div>
                <div className="m-caption" style={{ color: "var(--ink-2)" }}>Showing your last loaded feed — prices and hours may be stale.</div>
              </div>
            </div>
          )}
          {locDenied && !loc && !sim.offline && (
            <div className="m-banner">
              <div style={{ flex: 1 }}>
                <div className="m-caption" style={{ fontWeight: 700 }}>Location is off</div>
                <div className="m-caption" style={{ color: "var(--ink-2)" }}>Showing Shaw, our demo neighborhood.</div>
              </div>
              <button className="m-caption" style={{ color: "var(--accent)", fontWeight: 800, flex: "none", minHeight: 32 }} onClick={onEnableLoc}>Enable</button>
              <button className="m-caption" style={{ color: "var(--accent)", fontWeight: 800, flex: "none", minHeight: 32 }} onClick={onLocation}>Set manually</button>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "18px 16px 12px" }} data-comment-anchor="feed-grid-header">
            <div role="tablist" aria-label="Feed ranking" style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
              {[{ k: "near", l: locOff ? "For you" : "Near you" }, { k: "trending", l: "Trending" }].map((o) => (
                <button key={o.k} className="m-heading" role="tab" aria-selected={mode === o.k} onClick={() => setMode(o.k)}
                  style={{ whiteSpace: "nowrap", paddingBottom: 5,
                    color: mode === o.k ? "var(--ink)" : "var(--ink-3)",
                    borderBottom: mode === o.k ? "3px solid var(--accent)" : "3px solid transparent",
                    transition: "color .18s ease, border-color .18s ease" }}>
                  {o.l}
                </button>
              ))}
            </div>
            {fCount > 0 ? (
              <button className="m-caption" style={{ color: "var(--accent)", fontWeight: 700, whiteSpace: "nowrap" }} onClick={onClearFilters}>
                clear browsing filters
              </button>
            ) : (
              <div className="m-caption" style={{ color: "var(--ink-3)", fontWeight: 600, whiteSpace: "nowrap" }}>
                {mode === "trending" ? "rising this week · sample data" : locOff ? "distances from Shaw (demo)" : hasTaste ? "tuned to your taste" : "under 20 min away"}
              </div>
            )}
          </div>

          {rest.length ? (
            <FeedGrid dishes={rest} cols={gridCols} onOpen={onOpen}
              label={mode === "trending"
                ? ((d) => popTag === "rank" ? "#" + (rest.indexOf(d) + 1) : "\u2191 " + (trend[d.id] || 0))
                : hasTaste ? ((d) => aff[d.tag] ? "your taste" : null) : null} />
          ) : (
            /* zero-result recovery — names the cause, never clears allergies with "clear filters" */
            <div style={{ margin: "10px 16px", borderRadius: "var(--r)", background: "var(--sunken)", padding: "24px 20px" }}>
              <div className="m-second" style={{ fontWeight: 800, marginBottom: 6 }}>No dish clears every rule right now</div>
              <div className="m-caption" style={{ color: "var(--ink-2)", marginBottom: 12 }}>Active limits:</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                {constraintChips.map((c) => (
                  <div key={c.t} className="m-caption" style={{ borderRadius: 99, padding: "6px 12px", fontWeight: 700,
                    background: c.warn ? "var(--accent)" : "var(--surface)",
                    color: c.warn ? "var(--accent-ink)" : "var(--ink-2)",
                    border: c.warn ? "none" : "1px solid var(--line)" }}>
                    {c.warn && <span aria-hidden="true">! </span>}{c.t}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {fCount > 0 && (
                  <button className="m-btn m-btn-primary" style={{ minHeight: 46 }} onClick={onClearFilters}>Clear browsing filters</button>
                )}
                {dietaryActive && (
                  <button className="m-btn m-btn-quiet" style={{ minHeight: 46 }} onClick={onEditDiet}>Edit dietary settings</button>
                )}
                <button className="m-btn m-btn-quiet" style={{ minHeight: 46 }} onClick={onLocation}>Change location</button>
              </div>
              {dietaryActive && (
                <div className="m-caption" style={{ color: "var(--ink-3)", marginTop: 12 }}>
                  Allergy settings are never cleared by these buttons — edit them deliberately.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { FeedScreen, FeedGrid, FeedSkeleton });
