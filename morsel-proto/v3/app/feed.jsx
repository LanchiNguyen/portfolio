// Morsel v3.2 — feed: featured dish + labeled cards, transparent ranking, honest states.
// The card, the constraint bar and the scroll memo live here because every other
// grid surface (search, saves, collections, restaurant) reuses them.

// ---- scroll position memo: Back returns the diner to where they were ----
const MORSEL_SCROLL = {};
function useScrollMemo(key) {
  const ref = React.useRef(null);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (el && MORSEL_SCROLL[key]) el.scrollTop = MORSEL_SCROLL[key];
  }, [key]);
  const onScroll = (e) => { MORSEL_SCROLL[key] = e.currentTarget.scrollTop; };
  return [ref, onScroll];
}

// ---- state chip: the one visual vocabulary for "this needs your attention" ----
// conflict  the menu lists an allergen the diner asked to avoid
// unknown   no ingredient information exists for this dish
// unlisted  no longer on the restaurant's menu
function StateChip({ kind, text }) {
  const tone = kind === "conflict" ? { background: "var(--accent)", color: "var(--accent-ink)" }
    : kind === "unknown" ? { background: "var(--surface)", color: "var(--ink)", border: "1.5px solid var(--ink-3)" }
    : { background: "var(--ink)", color: "var(--paper)" };
  return (
    <div className="m-statechip" style={tone}>
      {kind === "conflict" && <span aria-hidden="true">! </span>}{kind === "unknown" && <span aria-hidden="true">? </span>}{text}
    </div>
  );
}

// Which chip a dish earns on a given surface. Recommendation surfaces never show
// conflicts (they are excluded upstream); saves and restaurant menus show all three.
function morselChipFor(d, prefs) {
  const { dietState } = window.MorselData;
  if (d.listed === false) return { kind: "unlisted", text: "No longer on menu" };
  const s = dietState(d, prefs);
  if (s.state === "conflict") return { kind: "conflict", text: "Lists " + s.conflicts.join(", ").toLowerCase() };
  if (s.state === "unknown") return { kind: "unknown", text: "Ingredients unknown" };
  return null;
}

// ---- the card: photo first, but identifiable before it is opened ----
function MorselCard({ d, onOpen, saved, onToggleSave, prefs, imgW }) {
  const { u, price, dist } = window.MorselData;
  const sim = window.MorselSim || {};
  const chip = morselChipFor(d, prefs);
  const isSaved = saved ? saved.has(d.id) : false;
  const p = price(d);
  return (
    <div className="m-card">
      <button className="m-card-open" data-dish-id={d.id} onClick={(e) => onOpen(d, e)}
        aria-label={`${d.name}, ${d.rest}, ${p || "price not listed"}, ${dist(d)}${chip ? ", " + chip.text : ""}`}>
        <div className="m-card-photo">
          {!sim.imgfail ? (
            <img src={u(d.img, imgW || 520)} alt="" loading="lazy" />
          ) : (
            <div className="m-card-nophoto"><span className="m-micro">{d.tag}</span><span className="m-caption" style={{ color: "var(--ink-3)" }}>photo unavailable</span></div>
          )}
          {chip && <div style={{ position: "absolute", top: 8, left: 8, right: onToggleSave ? 50 : 8, display: "flex" }}><StateChip kind={chip.kind} text={chip.text} /></div>}
        </div>
        <div className="m-card-text">
          <div className="m-card-name">{d.name}</div>
          <div className="m-caption" style={{ color: "var(--ink-2)" }}>{d.rest} · {d.hood}</div>
          <div className="m-caption" style={{ color: p ? "var(--ink)" : "var(--ink-3)", fontWeight: p ? 700 : 500 }}>
            {p ? p : "Price not listed"}<span style={{ color: "var(--ink-3)", fontWeight: 500 }}> · {dist(d)}</span>
          </div>
        </div>
      </button>
      {onToggleSave && (
        <button className="m-glass m-glass-icon m-card-save" aria-label={isSaved ? "Remove " + d.name + " from saves" : "Save " + d.name} aria-pressed={isSaved}
          onClick={() => onToggleSave(d.id)} style={{ color: isSaved ? "#FF8A65" : "#FFF7EB" }}>
          <MIcon name="heart" size={19} filled={isSaved} />
        </button>
      )}
    </div>
  );
}

function FeedGrid({ dishes, cols, onOpen, saved, onToggleSave, prefs }) {
  const n = Math.max(1, Math.min(cols || 2, dishes.length === 1 ? 1 : 3));
  return (
    <div className="m-grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
      {dishes.map((d) => <MorselCard key={d.id} d={d} onOpen={onOpen} saved={saved} onToggleSave={onToggleSave} prefs={prefs} imgW={n === 3 ? 360 : 520} />)}
    </div>
  );
}

// ---- active constraints, shown wherever they change what is on screen ----
function ConstraintBar({ prefs, filters, onFilters, onClearFilters, onEditDiet }) {
  const chips = [];
  if (prefs && prefs.lifestyle) chips.push({ key: "ls", t: prefs.lifestyle, warn: false, diet: true });
  ((prefs && prefs.allergies) || []).forEach((a) => chips.push({ key: "al" + a, t: "No " + a.toLowerCase(), warn: true, diet: true }));
  morselFilterChips(filters).forEach((c) => chips.push({ ...c, warn: false, diet: false }));
  if (!chips.length) return null;
  const hasFilters = morselFilterCount(filters) > 0;
  return (
    <div className="m-constraints" aria-label="Active constraints">
      {chips.map((c) => (
        <button key={c.key} className="m-caption m-constraint" onClick={c.diet ? onEditDiet : onFilters}
          aria-label={(c.warn ? "Allergy setting: " : c.diet ? "Lifestyle setting: " : "Browsing filter: ") + c.t + ". Edit"}
          style={{ background: c.warn ? "var(--accent)" : "var(--surface)", color: c.warn ? "var(--accent-ink)" : "var(--ink-2)", border: c.warn ? "1.5px solid var(--accent)" : "1.5px solid var(--line)" }}>
          {c.warn && <span aria-hidden="true">! </span>}{c.t}
        </button>
      ))}
      {hasFilters && <button className="m-caption" style={{ color: "var(--accent)", fontWeight: 700, minHeight: 32, padding: "0 4px", flex: "none" }} onClick={onClearFilters}>Clear filters</button>}
    </div>
  );
}

// ---- unknown-ingredient dishes: listed apart, never counted as matches ----
function UnknownSection({ dishes, cols, onOpen, saved, onToggleSave, prefs }) {
  if (!dishes.length) return null;
  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ padding: "0 16px 10px" }}>
        <div className="m-heading" style={{ fontSize: "calc(18px * var(--ts))" }}>Ingredient information unavailable</div>
        <div className="m-caption" style={{ color: "var(--ink-2)", marginTop: 4 }}>
          {dishes.length} dish{dishes.length === 1 ? " has" : "es have"} missing ingredient details and {dishes.length === 1 ? "is" : "are"} excluded from the match count. Check with the restaurant about your allergy.
        </div>
      </div>
      <FeedGrid dishes={dishes} cols={cols} onOpen={onOpen} saved={saved} onToggleSave={onToggleSave} prefs={prefs} />
    </div>
  );
}

// ---- featured dish: one editorial pick, photo-led, still identifiable ----
function FeedHero({ dishes, saved, onOpen, onToggleSave }) {
  const { u, price, dist } = window.MorselData;
  const sim = window.MorselSim || {};
  const railRef = React.useRef(null);
  const [idx, setIdx] = React.useState(0);
  const onScroll = () => {
    const el = railRef.current;
    if (el) setIdx(Math.round(el.scrollLeft / el.clientWidth));
  };
  return (
    <div style={{ position: "relative" }}>
      <div ref={railRef} onScroll={onScroll} style={{ display: "flex", overflowX: "auto", scrollSnapType: "x mandatory", scrollbarWidth: "none", gap: 0 }}>
        {dishes.map((d) => {
          const isSaved = saved.has(d.id);
          const p = price(d);
          return (
          <div key={d.id} style={{ position: "relative", flex: "none", width: "100%", scrollSnapAlign: "start", height: 350, overflow: "hidden", background: "var(--sunken)" }}>
            {/* open + save are sibling controls — never nested interactives */}
            <button onClick={(e) => onOpen(d, e)} data-dish-id={d.id} aria-label={`Featured: ${d.name}, ${d.rest}, ${p || "price not listed"}, ${dist(d)}`} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", textAlign: "left" }}>
            {!sim.imgfail ? (
              <img src={u(d.img, 900)} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div className="m-micro" style={{ color: "var(--ink-3)" }}>photo unavailable</div>
              </div>
            )}
            <div className="m-veil" style={{ background: "linear-gradient(to top, rgba(12,7,3,.82) 0%, rgba(12,7,3,.30) 34%, rgba(12,7,3,0) 52%, rgba(12,7,3,.22) 86%, rgba(12,7,3,.45) 100%)", opacity: sim.imgfail ? 0 : 1 }}></div>
            <div style={{ position: "absolute", left: 18, right: 74, bottom: 30, textAlign: "left" }}>
              <div style={{ minWidth: 0, color: sim.imgfail ? "var(--ink)" : "#FFF7EB" }}>
                <div className="m-micro" style={{ color: sim.imgfail ? "var(--ink-3)" : "rgba(255,247,235,.72)", marginBottom: 6 }}>Featured · demo pick</div>
                <div className="m-title" style={{ fontSize: "calc(26px * var(--ts))" }}>{d.name}</div>
                <div className="m-second" style={{ color: sim.imgfail ? "var(--ink-2)" : "rgba(255,247,235,.85)", marginTop: 4 }}>{d.rest} · {d.hood}</div>
                <div className="m-second" style={{ color: sim.imgfail ? "var(--ink-2)" : "rgba(255,247,235,.85)", fontWeight: 700 }}>{p ? p + " menu price" : "Price not listed"} · {dist(d)}</div>
              </div>
            </div>
            </button>
            <button aria-label={isSaved ? "Remove " + d.name + " from saves" : "Save " + d.name} aria-pressed={isSaved}
              onClick={() => onToggleSave(d.id)}
              className="m-glass m-glass-icon" style={{ position: "absolute", right: 18, bottom: 30, width: 44, height: 44, color: isSaved ? "#FF8A65" : "#FFF7EB" }}>
              <MIcon name="heart" size={21} filled={isSaved} />
            </button>
          </div>
          );
        })}
      </div>
      {dishes.length > 1 && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 12, display: "flex", justifyContent: "center", gap: 5, pointerEvents: "none" }}>
          {dishes.map((_, i) => (
            <div key={i} style={{ width: i === idx ? 16 : 5, height: 5, borderRadius: 99, background: i === idx ? "#FFF7EB" : "rgba(255,247,235,.45)", transition: "all .25s ease" }}></div>
          ))}
        </div>
      )}
    </div>
  );
}

// Loading skeleton — shown while the feed "fetches" (simulated)
function FeedSkeleton({ cols }) {
  return (
    <div>
      <div className="m-skel" style={{ height: 350, borderRadius: 0 }}></div>
      <div style={{ display: "flex", gap: 12, padding: "20px 16px 14px", alignItems: "center" }}>
        <div className="m-skel" style={{ width: 140, height: 22 }}></div>
      </div>
      <div className="m-grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: cols * 2 }, (_, i) => (
          <div key={i}><div className="m-skel" style={{ aspectRatio: "4 / 5" }}></div><div className="m-skel" style={{ height: 14, marginTop: 8, width: "70%" }}></div><div className="m-skel" style={{ height: 12, marginTop: 6, width: "50%" }}></div></div>
        ))}
      </div>
    </div>
  );
}

function FeedScreen({ saved, onOpen, onToggleSave, gridCols, onSearch, filters, onFilters, onClearFilters, loc, onLocation, prefs, onResetLoc, onEditDiet }) {
  const { dishes, heroIds, partition, covered, affinity, demoArea } = window.MorselData;
  const sim = window.MorselSim || {};
  const fCount = morselFilterCount(filters);
  const [scrollRef, onScroll] = useScrollMemo("feed");

  // one classifier, one policy for a recommendation surface:
  // matches are shown, unknowns are listed apart, conflicts never appear
  const part = partition(dishes, prefs);
  const pool = applyMorselFilters(part.match, filters);
  const unknownPool = applyMorselFilters(part.unknown, filters);
  const unpriced = morselUnpriced(part.match, filters).length;
  let heroes = heroIds.map((id) => pool.find((d) => d.id === id)).filter(Boolean);
  if (!heroes.length) heroes = pool.slice(0, 3);

  // ranking — deterministic, transparent: distance, minus a moderate taste boost (never a filter)
  const aff = affinity(prefs && prefs.picked);
  const tasteTags = Object.keys(aff);
  const nearScore = (d) => d.mi - Math.min(aff[d.tag] || 0, 2) * 0.3;
  let rest = pool.filter((d) => d.id !== (heroes[0] && heroes[0].id));
  rest = [...rest].sort((a, b) => nearScore(a) - nearScore(b) || (a.id < b.id ? -1 : 1));

  const noCoverage = !!(loc && loc.city && !covered.includes(loc.city));
  const areaName = loc && loc.city ? (loc.hood || loc.city.split(",")[0]) : demoArea.hood;
  const chipLabel = noCoverage ? areaName + " · not covered" : loc && loc.city ? areaName : areaName + ", DC · demo area";

  const dietaryActive = prefs && (prefs.lifestyle || (prefs.allergies || []).length > 0);
  const anyConstraint = dietaryActive || fCount > 0;

  return (
    <div className="m-screen m-fade" style={{ background: "var(--paper)" }}>
      {/* floating chrome over the hero */}
      <div style={{ position: "absolute", top: 58, left: 14, right: 14, zIndex: 30, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button className="m-glass" onClick={onLocation} aria-label={"Area: " + chipLabel + ". Change area"}>
          <MIcon name="pin" size={15} /> {chipLabel}
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="m-glass m-glass-icon" aria-label="Search" onClick={onSearch}><MIcon name="search" size={18} /></button>
          <button className="m-glass m-glass-icon" aria-label={fCount ? `Filters, ${fCount} active` : "Filters"} onClick={onFilters} style={{ position: "relative" }}>
            <MIcon name="sliders" size={18} />
            {fCount > 0 && (
              <div aria-hidden="true" style={{ position: "absolute", top: -3, right: -3, minWidth: 18, height: 18, borderRadius: 99, background: "var(--accent)", color: "var(--accent-ink)", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>{fCount}</div>
            )}
          </button>
        </div>
      </div>

      {sim.loading ? (
        <div className="m-scroll" style={{ paddingBottom: 110 }} aria-label="Loading dishes">
          <FeedSkeleton cols={gridCols} />
        </div>
      ) : noCoverage ? (
        /* honest coverage state — never DC dishes under another city's label */
        <div className="m-scroll" style={{ paddingBottom: 110 }}>
          <div style={{ padding: "150px 28px 0", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 6 }}>
            <div style={{ width: 64, height: 64, borderRadius: 99, background: "var(--sunken)", color: "var(--ink-2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
              <MIcon name="pin" size={28} />
            </div>
            <div className="m-title">{loc.city.split(",")[0]} isn't<br />in this demo.</div>
            <div className="m-second" style={{ color: "var(--ink-2)", maxWidth: 280, marginTop: 6 }}>
              The sample dishes are in Washington, DC. Choose the demo area to browse them.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 22, alignSelf: "stretch" }}>
              <button className="m-btn m-btn-primary" onClick={onResetLoc}>Explore the DC sample area</button>
              <button className="m-btn m-btn-quiet" onClick={onLocation}>Choose another area</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="m-scroll" ref={scrollRef} onScroll={onScroll} style={{ paddingBottom: 110, paddingTop: heroes.length ? 0 : 100 }}>
          <FeedHero dishes={heroes} saved={saved} onOpen={onOpen} onToggleSave={onToggleSave} />

          {sim.offline && (
            <div className="m-banner" role="status">
              <div style={{ flex: "none", width: 8, height: 8, borderRadius: 99, background: "var(--ink-3)" }}></div>
              <div style={{ flex: 1 }}>
                <div className="m-caption" style={{ fontWeight: 700 }}>You're offline</div>
                <div className="m-caption" style={{ color: "var(--ink-2)" }}>Showing the last loaded dishes. Prices and availability may be out of date.</div>
              </div>
            </div>
          )}

          <div style={{ padding: "18px 16px 8px" }} data-comment-anchor="feed-grid-header">
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
              <div className="m-heading">Near {areaName}</div>
              <div className="m-caption" style={{ color: "var(--ink-3)", fontWeight: 600, whiteSpace: "nowrap" }}>{pool.length} dish{pool.length === 1 ? "" : "es"}</div>
            </div>
            <div className="m-caption" style={{ color: "var(--ink-3)", marginTop: 3 }}>
              {tasteTags.length ? `Sorted by distance and your picks: ${tasteTags.map((t) => t.toLowerCase()).join(", ")}.` : `Nearest to ${demoArea.hood} first (demo distances).`}
            </div>
          </div>
          {anyConstraint && <ConstraintBar prefs={prefs} filters={filters} onFilters={onFilters} onClearFilters={onClearFilters} onEditDiet={onEditDiet} />}
          {unpriced > 0 && (
            <div className="m-caption" style={{ color: "var(--ink-3)", padding: "0 16px 10px" }}>
              {unpriced} dish{unpriced === 1 ? "" : "es"} with no listed price {unpriced === 1 ? "is" : "are"} set aside while a price filter is on.
            </div>
          )}

          {rest.length ? (
            <FeedGrid dishes={rest} cols={gridCols} onOpen={onOpen} saved={saved} onToggleSave={onToggleSave} />
          ) : !heroes.length ? (
            /* zero-result recovery — names the cause, never clears allergies with "clear filters" */
            <div style={{ margin: "10px 16px", borderRadius: "var(--r)", background: "var(--sunken)", padding: "24px 20px" }}>
              <div className="m-second" style={{ fontWeight: 800, marginBottom: 6 }}>No dish fits every setting right now</div>
              <div className="m-caption" style={{ color: "var(--ink-2)", marginBottom: 14 }}>Try a different price range or distance.</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {fCount > 0 && (
                  <button className="m-btn m-btn-primary" style={{ minHeight: 46 }} onClick={onClearFilters}>Clear browsing filters</button>
                )}
                {dietaryActive && (
                  <button className="m-btn m-btn-quiet" style={{ minHeight: 46 }} onClick={onEditDiet}>Edit dietary settings</button>
                )}
                <button className="m-btn m-btn-quiet" style={{ minHeight: 46 }} onClick={onLocation}>Change area</button>
              </div>
              {dietaryActive && (
                <div className="m-caption" style={{ color: "var(--ink-3)", marginTop: 12 }}>
                  Clearing browsing filters keeps your dietary settings.
                </div>
              )}
            </div>
          ) : null}

          {(prefs && (prefs.allergies || []).length > 0) && (
            <UnknownSection dishes={unknownPool} cols={gridCols} onOpen={onOpen} saved={saved} onToggleSave={onToggleSave} prefs={prefs} />
          )}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { FeedScreen, FeedGrid, FeedSkeleton, MorselCard, StateChip, ConstraintBar, UnknownSection, useScrollMemo, morselChipFor });
