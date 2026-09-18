// Morsel v3.2 — dish detail: the photo still opens the page, but the decision
// information (name, restaurant, price, distance, availability, what is known
// about ingredients) sits in the opening view, ahead of one primary next step.
// Nothing here is a score, a diner count or a quote: the prototype has no source
// for any of those.

// Initials avatar — kept for the profile screen
const AVA_TONES = ["#C2785A", "#8C9A6B", "#B89A4F", "#9A6B7E", "#6B8C9A", "#A9714B"];
function MAvatar({ name, size = 34, ring = false }) {
  const tone = AVA_TONES[(name.charCodeAt(0) + name.length) % AVA_TONES.length];
  return (
    <div style={{ width: size, height: size, borderRadius: 99, flex: "none", background: tone, color: "#FFF7EB", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: size * 0.42, border: ring ? "2px solid var(--surface)" : "none" }}>
      {name[0]}
    </div>);
}

function FactRow({ label, value, sub, tone }) {
  return (
    <div style={{ display: "flex", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--line)", alignItems: "flex-start" }}>
      <div className="m-caption" style={{ color: "var(--ink-3)", width: 84, flex: "none", paddingTop: 2 }}>{label}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="m-second" style={{ fontWeight: 700, color: tone || "var(--ink)" }}>{value}</div>
        {sub && <div className="m-caption" style={{ color: "var(--ink-2)", marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

function DetailScreen({ dish, saved, zoom, prefs, onBack, onToggleSave, onOpen, onOpenRest }) {
  const { u, dishes, dietState, partition, price, dist, nextStepLabel, destination, demoArea, allergens } = window.MorselData;
  const isSaved = saved.has(dish.id);
  const [toast, setToast] = React.useState(null);
  const [nextOpen, setNextOpen] = React.useState(false);
  const nextBtnRef = React.useRef(null);
  const closeNext = React.useCallback(() => { setNextOpen(false); requestAnimationFrame(() => nextBtnRef.current && nextBtnRef.current.focus()); }, []);
  const ping = (msg) => { setToast(msg); window.clearTimeout(ping._t); ping._t = window.setTimeout(() => setToast(null), 2200); };

  // the shared classifier — the same answer every other surface gets
  const st = dietState(dish, prefs);
  const allergyOn = prefs && (prefs.allergies || []).length > 0;
  const p = price(dish);
  const dest = destination(dish.rest);

  // related dishes follow the same policy as the feed: recommendable matches only
  const rel = partition(dishes.filter((d) => d.id !== dish.id), prefs).match;
  const more = rel.filter((d) => d.rest === dish.rest).slice(0, 3);
  const alike = rel.filter((d) => d.tag === dish.tag && d.rest !== dish.rest).slice(0, 3);
  const strip = more.length ? more : alike;
  const otherAtRest = dishes.some((d) => d.rest === dish.rest && d.id !== dish.id);

  // what we can say about ingredients, in the diner's terms
  const ingredientRow = (() => {
    if (dish.allergens === null || dish.allergens === undefined) {
      return { value: "Ingredient information unavailable", sub: allergyOn ? "Not counted as a match for your allergy settings." : "The menu lists no ingredients. Check with the restaurant before deciding.", tone: undefined };
    }
    const listed = dish.allergens.map((a) => a[0].toUpperCase() + a.slice(1)).join(", ");
    if (st.state === "conflict") {
      return { value: "Menu lists " + st.conflicts.join(" and ").toLowerCase(), sub: "You asked to avoid " + st.conflicts.join(" and ").toLowerCase() + ". This dish isn't recommended to you; it's shown because you opened it directly.", tone: "var(--accent)" };
    }
    const tracked = allergens.map((a) => a.toLowerCase());
    const base = dish.allergens.length ? "Menu lists " + listed.toLowerCase() : "None of " + tracked.join(", ") + " listed";
    const sub = allergyOn
      ? "None of the allergens you avoid appear on the menu listing. Menu data doesn't cover preparation or shared surfaces — tell the kitchen."
      : "Tracked: " + tracked.join(", ") + ". Menu data doesn't cover preparation or shared surfaces.";
    return { value: base, sub, tone: undefined };
  })();

  return (
    <div className="m-screen m-fade" style={{ background: "var(--paper)" }}>
      <div style={{ position: "absolute", top: 58, left: 14, right: 14, zIndex: 30, display: "flex", justifyContent: "space-between" }}>
        <button className="m-glass m-glass-icon" aria-label="Back" onClick={onBack}><MIcon name="back" size={18} /></button>
        <button className="m-glass m-glass-icon" aria-label={isSaved ? "Remove from saves" : "Save"} aria-pressed={isSaved}
          onClick={() => { onToggleSave(dish.id); if (isSaved) ping("Removed from saves"); }} style={{ color: isSaved ? "#FF8A65" : "#FFF7EB" }}>
          <MIcon name="heart" size={19} filled={isSaved} />
        </button>
      </div>

      <div className="m-scroll">
        <div style={{ position: "relative", height: 320, background: "var(--sunken)" }}>
          {!(window.MorselSim || {}).imgfail ? (
            <img src={u(dish.img, 900)} alt={dish.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><div className="m-micro" style={{ color: "var(--ink-3)" }}>photo unavailable</div></div>
          )}
        </div>

        {/* shared-element zoom: sits between hero and sheet so the rounded
            sheet cap slides OVER the expanding photo, never pops in late */}
        {zoom && (
          <div className="m-zoom" key={zoom.key} style={{ "--zx": zoom.from.x + "px", "--zy": zoom.from.y + "px", "--zw": zoom.from.w + "px", "--zh": zoom.from.h + "px" }}>
            <img src={zoom.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}

        {/* sheet */}
        <div className="m-rise" style={{ position: "relative", marginTop: -28, background: "var(--surface)", borderRadius: "calc(var(--r) + 4px) calc(var(--r) + 4px) 0 0", padding: "10px 22px 28px", boxShadow: "0 -10px 30px rgba(20,12,5,.10)" }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: "var(--line)", margin: "0 auto 16px" }}></div>

          <div className="m-micro" style={{ color: "var(--accent)", marginBottom: 8 }}>{dish.tag}</div>
          <div className="m-title" style={{ marginBottom: 8 }}>{dish.name}</div>
          <button className="m-second" style={{ fontWeight: 700, color: "var(--ink)", marginBottom: 10, display: "inline-flex", alignItems: "center", gap: 4, minHeight: 32 }} onClick={() => onOpenRest(dish.rest)} disabled={!otherAtRest}>
            {dish.rest} · {dish.hood}{otherAtRest && <span style={{ display: "inline-flex", transform: "rotate(180deg)", color: "var(--ink-3)" }}><MIcon name="back" size={13} /></span>}
          </button>
          <div className="m-second" style={{ color: "var(--ink-2)", marginBottom: 12 }}>{dish.desc}</div>

          {(() => {
            const aff = window.MorselData.affinity(prefs && prefs.picked);
            return aff[dish.tag] && st.state === "match" ? (
              <div className="m-caption" style={{ color: "var(--ink-3)", marginBottom: 12 }}>
                Shown higher because you chose {dish.tag.toLowerCase()}.
              </div>
            ) : null;
          })()}

          {dish.listed === false && (
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "var(--ink)", color: "var(--paper)", borderRadius: "var(--r)", padding: "12px 14px", marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <div className="m-second" style={{ fontWeight: 800 }}>No longer on the menu</div>
                <div className="m-caption" style={{ opacity: .8 }}>This dish is no longer listed on the menu. You can still keep it in your saves.</div>
              </div>
            </div>
          )}

          {st.state === "conflict" && (
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "rgba(194,73,43,.10)", border: "1.5px solid var(--accent)", borderRadius: "var(--r)", padding: "12px 14px", marginBottom: 14 }} role="note">
              <div aria-hidden="true" style={{ color: "var(--accent)", flex: "none", fontWeight: 900, fontSize: 14, width: 22, height: 22, borderRadius: 99, border: "2px solid var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>!</div>
              <div>
                <div className="m-second" style={{ fontWeight: 800, color: "var(--accent)" }}>The menu lists {st.conflicts.join(" and ").toLowerCase()}, which you asked to avoid</div>
                <div className="m-caption" style={{ color: "var(--ink-2)" }}>Choose another dish, or contact the restaurant about ingredients and preparation.</div>
              </div>
            </div>
          )}
          {st.state === "unknown" && (
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "var(--sunken)", border: "1.5px dashed var(--ink-3)", borderRadius: "var(--r)", padding: "12px 14px", marginBottom: 14 }} role="note">
              <div aria-hidden="true" style={{ color: "var(--ink-2)", flex: "none", fontWeight: 900, fontSize: 14, width: 22, height: 22, borderRadius: 99, border: "2px solid var(--ink-3)", display: "flex", alignItems: "center", justifyContent: "center" }}>?</div>
              <div>
                <div className="m-second" style={{ fontWeight: 800 }}>We don't have ingredient information for this dish</div>
                <div className="m-caption" style={{ color: "var(--ink-2)" }}>We can't confirm whether it fits your allergy settings. Check with the restaurant before deciding.</div>
              </div>
            </div>
          )}

          <div style={{ marginBottom: 18 }}>
            <FactRow label="Price" value={p ? p : "Not listed"} sub={p ? "Menu price. Tax, tip and extras not included." : "Check the restaurant menu for price."} tone={p ? undefined : "var(--ink-2)"} />
            <FactRow label="Distance" value={dist(dish) + " from " + demoArea.hood} sub="Straight-line distance from Shaw." />
            <FactRow label="On the menu" value={dish.listed === false ? "Not listed" : "Listed"} sub={dish.listed === false ? "No longer on the menu." : "Being listed doesn't mean it's available tonight."} />
            <FactRow label="Ingredients" value={ingredientRow.value} sub={ingredientRow.sub} tone={ingredientRow.tone} />
          </div>

          {st.state === "conflict" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
              {otherAtRest ? (
                <button className="m-btn m-btn-primary" onClick={() => onOpenRest(dish.rest)}>See other dishes at {dish.rest}</button>
              ) : (
                <button className="m-btn m-btn-primary" onClick={onBack}>Back to browsing</button>
              )}
              <button className="m-btn m-btn-quiet" onClick={() => setNextOpen(true)}>{dest.kind === "none" ? "Check with restaurant" : "See the restaurant's menu"}</button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
              <button className="m-btn m-btn-quiet" style={{ flex: "none", width: 52, padding: 0, color: isSaved ? "var(--accent)" : "var(--ink)" }}
                aria-label={isSaved ? "Remove from saves" : "Save"} aria-pressed={isSaved}
                onClick={() => { onToggleSave(dish.id); if (isSaved) ping("Removed from saves"); }}>
                <MIcon name="heart" filled={isSaved} />
              </button>
              <button ref={nextBtnRef} className="m-btn m-btn-primary" style={{ flex: 1 }} onClick={() => setNextOpen(true)}>
                {nextStepLabel(dish.rest)}
              </button>
            </div>
          )}
          {dest.kind === "none" && (
            <div className="m-caption" style={{ color: "var(--ink-3)", marginTop: -14, marginBottom: 24 }}>{dish.rest} has no online menu to link to.</div>
          )}

          {strip.length > 0 &&
          <div>
              <button onClick={() => more.length ? onOpenRest(dish.rest) : null} disabled={!more.length}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: 4, cursor: more.length ? "pointer" : "default", minHeight: 32 }}>
              <div className="m-micro" style={{ color: "var(--ink-3)" }}>
                {more.length ? `More at ${dish.rest}` : `More ${dish.tag.toLowerCase()} nearby`}
              </div>
                {more.length > 0 &&
              <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--accent)", fontSize: 13, fontWeight: 700 }}>
                  All dishes <span style={{ display: "inline-flex", transform: "rotate(180deg)" }}><MIcon name="back" size={13} /></span>
                </div>
              }
              </button>
              <div className="m-caption" style={{ color: "var(--ink-3)", marginBottom: 12 }}>Based on your dietary settings.</div>
              <div style={{ margin: "0 -22px" }}>
                <FeedGrid dishes={strip} cols={strip.length >= 3 ? 3 : 2} onOpen={onOpen} saved={saved} onToggleSave={onToggleSave} />
              </div>
            </div>
          }
        </div>
      </div>

      {nextOpen && <NextStepSheet dish={dish} onClose={closeNext} onPing={ping} />}

      {toast &&
      <div className="m-rise" role="status" style={{ position: "absolute", bottom: 30, left: "50%", transform: "translateX(-50%)", zIndex: 50, background: "var(--ink)", color: "var(--paper)", borderRadius: 99, padding: "10px 20px", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", boxShadow: "var(--shadow-float)" }}>
          {toast}
        </div>
      }
    </div>);
}

Object.assign(window, { DetailScreen, MAvatar });
