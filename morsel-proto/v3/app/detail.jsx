// Morsel — dish detail: photo dominates, info lives in a sheet
// Initials avatar — no external image dependency
const AVA_TONES = ["#C2785A", "#8C9A6B", "#B89A4F", "#9A6B7E", "#6B8C9A", "#A9714B"];
function MAvatar({ name, size = 34, ring = false }) {
  const tone = AVA_TONES[(name.charCodeAt(0) + name.length) % AVA_TONES.length];
  return (
    <div style={{ width: size, height: size, borderRadius: 99, flex: "none", background: tone, color: "#FFF7EB", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: size * 0.42, border: ring ? "2px solid var(--surface)" : "none" }}>
      {name[0]}
    </div>);

}

function PctRing({ pct }) {
  const r = 15,c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 38 38" style={{ width: 38, height: 38, flex: "none" }}>
      <circle cx="19" cy="19" r={r} fill="none" stroke="var(--line)" strokeWidth="4" />
      <circle cx="19" cy="19" r={r} fill="none" stroke="var(--accent)" strokeWidth="4"
      strokeDasharray={`${pct / 100 * c} ${c}`} strokeLinecap="round" transform="rotate(-90 19 19)" />
    </svg>);

}

function DetailScreen({ dish, saved, zoom, prefs, onBack, onToggleSave, onOpen, onOpenRest }) {
  const { u, dishes } = window.MorselData;
  const more = dishes.filter((d) => d.rest === dish.rest && d.id !== dish.id).slice(0, 3);
  const alike = dishes.filter((d) => d.tag === dish.tag && d.id !== dish.id).slice(0, 3);
  const strip = more.length ? more : alike;
  const isSaved = saved.has(dish.id);
  const [toast, setToast] = React.useState(null);
  const [ordering, setOrdering] = React.useState(false);
  const orderBtnRef = React.useRef(null);
  const closeOrdering = React.useCallback(() => { setOrdering(false); requestAnimationFrame(() => orderBtnRef.current && orderBtnRef.current.focus()); }, []);
  const [showHow, setShowHow] = React.useState(false);
  // allergy conflict — dish is excluded from feeds, but reachable directly (saves, links)
  const conflict = ((prefs && prefs.allergies) || []).filter((a) => (dish.allergens || []).includes(a.toLowerCase()));
  const ping = (msg) => {setToast(msg);window.clearTimeout(ping._t);ping._t = window.setTimeout(() => setToast(null), 1800);};

  return (
    <div className="m-screen m-fade" style={{ background: "var(--paper)" }}>
      <div style={{ position: "absolute", top: 58, left: 14, right: 14, zIndex: 30, display: "flex", justifyContent: "space-between" }}>
        <button className="m-glass m-glass-icon" aria-label="Back" onClick={onBack}><MIcon name="back" size={18} /></button>
        <button className="m-glass m-glass-icon" aria-label="Share" onClick={() => ping("Link copied")}><MIcon name="share" size={18} /></button>
      </div>

      <div className="m-scroll">
        <div style={{ position: "relative", height: 440, background: "var(--sunken)" }}>
          <img src={u(dish.img, 900)} alt={dish.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
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
          <div className="m-title" style={{ marginBottom: 10 }}>{dish.name}</div>
          {(() => {
            const aff = window.MorselData.affinity(prefs && prefs.picked);
            return aff[dish.tag] && !conflict.length ? (
              <div className="m-caption" style={{ color: "var(--ink-3)", marginTop: -6, marginBottom: 10 }}>
                Ranked up in your feed because you tapped {dish.tag.toLowerCase()} during setup.
              </div>
            ) : null;
          })()}
          {dish.soldOut && (
            <div className="m-caption" style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 99, background: "var(--ink)", color: "var(--paper)", padding: "6px 12px", fontWeight: 700, marginBottom: 12 }}>
              Sold out today · usually back tomorrow
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <div className="m-second" style={{ fontWeight: 700, whiteSpace: "nowrap" }}>{dish.rest} · {dish.hood}</div>
            <div className="m-caption" style={{ color: "var(--ink-3)", whiteSpace: "nowrap" }}>{dish.price} · {dish.dist} · {dish.walk}</div>
          </div>

          {conflict.length > 0 && (
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "rgba(194,73,43,.10)", border: "1.5px solid var(--accent)", borderRadius: "var(--r)", padding: "12px 14px", marginBottom: 14 }}>
              <div style={{ color: "var(--accent)", flex: "none", fontWeight: 900, fontSize: 14, width: 22, height: 22, borderRadius: 99, border: "2px solid var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>!</div>
              <div>
                <div className="m-second" style={{ fontWeight: 800, color: "var(--accent)" }}>Contains {conflict.join(" and ").toLowerCase()}</div>
                <div className="m-caption" style={{ color: "var(--ink-2)" }}>You flagged this allergy, so this dish is excluded from your feed and search — you're seeing it because you opened it directly. Double-check with the kitchen before ordering.</div>
              </div>
            </div>
          )}

          {dish.fresh ? (
            /* cold start — no invented score for dishes without enough signal */
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: "var(--r)", background: "var(--sunken)", border: "1.5px dashed var(--ink-3)", marginBottom: 18 }}>
              <div style={{ width: 38, height: 38, borderRadius: 99, flex: "none", border: "2px dashed var(--ink-3)", color: "var(--ink-2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, letterSpacing: ".04em" }}>NEW</div>
              <div style={{ flex: 1 }}>
                <div className="m-second" style={{ fontWeight: 700 }}>New on Morsel — no score yet</div>
                <div className="m-caption" style={{ color: "var(--ink-2)" }}>Too few repeat orders to be honest about a number. We'd rather show nothing than guess.</div>
              </div>
            </div>
          ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: "var(--r)", background: "var(--sunken)", marginBottom: 18 }}>
            <PctRing pct={dish.pct} />
            <div style={{ flex: 1 }}>
              <div className="m-second" style={{ fontWeight: 700 }}>{dish.pct}% would order again</div>
              <div className="m-caption" style={{ color: "var(--ink-2)" }}>
                {37 + dish.pct} verified diners (illustrative) · <button onClick={() => setShowHow(!showHow)} aria-expanded={showHow} style={{ color: "var(--accent)", fontWeight: 700, fontSize: 13 }}>how we know</button>
              </div>
            </div>
            <div style={{ display: "flex" }}>
              {dish.reviews.slice(0, 3).map((r, i) =>
              <div key={i} style={{ marginLeft: i ? -8 : 0 }}><MAvatar name={r.who} size={28} ring={true} /></div>
              )}
            </div>
          </div>
          )}

          {showHow && !dish.fresh && (
            <div className="m-caption m-fade" style={{ background: "var(--sunken)", borderRadius: 14, padding: "10px 14px", marginTop: -8, marginBottom: 18, color: "var(--ink-2)" }}>
              Counted from repeat orders: diners who got this dish through a Morsel handoff or pickup, then ordered it again within 90 days. Never self-reported. Never stars.
              <span style={{ display: "block", marginTop: 6, color: "var(--ink-3)" }}>Prototype note: counts shown here are illustrative seed data, not real orders.</span>
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            <button className="m-btn m-btn-quiet" style={{ flex: "none", width: 52, padding: 0, color: isSaved ? "var(--accent)" : "var(--ink)" }}
            aria-label={isSaved ? "Remove from saves" : "Save"} aria-pressed={isSaved}
            onClick={() => {onToggleSave(dish.id);if (isSaved) ping("Removed from saves");}}>
              <MIcon name="heart" filled={isSaved} />
            </button>
            <button className="m-btn m-btn-quiet" style={{ flex: 1 }} onClick={() => ping("Opening Maps…")}>
              <MIcon name="nav" size={18} /> Directions
            </button>
            {dish.soldOut ? (
              <button className="m-btn m-btn-primary" style={{ flex: 1 }} disabled>
                Sold out
              </button>
            ) : (
            <button ref={orderBtnRef} className="m-btn m-btn-primary" style={{ flex: 1 }} onClick={() => setOrdering(true)}>
              <MIcon name="bag" size={18} /> Order
            </button>
            )}
          </div>

          <div className="m-micro" style={{ color: "var(--ink-3)", marginBottom: 12 }}>From people who ate it · illustrative</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 26 }}>
            {dish.reviews.map((r, i) =>
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <MAvatar name={r.who} size={34} />
                <div style={{ flex: 1 }}>
                  <div className="m-second" style={{ lineHeight: 1.4 }}>“{r.text}”</div>
                  <div className="m-caption" style={{ color: "var(--ink-3)", marginTop: 3 }}>{r.who} · ate here recently</div>
                </div>
              </div>
            )}
          </div>

          {strip.length > 0 &&
          <div>
              <button onClick={() => more.length ? onOpenRest(dish.rest) : null} disabled={!more.length}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: 12, cursor: more.length ? "pointer" : "default" }}>
              <div className="m-micro" style={{ color: "var(--ink-3)" }}>
                {more.length ? `More at ${dish.rest}` : `More ${dish.tag.toLowerCase()} nearby`}
              </div>
                {more.length > 0 &&
              <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--accent)", fontSize: 13, fontWeight: 700 }}>
                  Visit <span style={{ display: "inline-flex", transform: "rotate(180deg)" }}><MIcon name="back" size={13} /></span>
                </div>
              }
              </button>
              <div style={{ display: "flex", gap: 8 }}>
                {strip.map((d) =>
              <button key={d.id} className="m-photo" onClick={(e) => onOpen(d, e)} style={{ flex: 1, aspectRatio: "0.8", borderRadius: "calc(var(--r) * 0.7)" }}>
                    <img src={u(d.img, 640)} alt={d.name} />
                    <div className="m-veil"></div>
                    <div style={{ position: "absolute", left: 9, right: 9, bottom: 8, color: "#FFF7EB", fontWeight: 700, fontSize: 12, lineHeight: 1.25, textAlign: "left" }}>{d.name}</div>
                  </button>
              )}
              </div>
            </div>
          }
        </div>
      </div>

      {ordering && <OrderSheet dish={dish} conflict={conflict} onClose={closeOrdering} onPing={ping} />}

      {toast &&
      <div className="m-rise" role="status" style={{ position: "absolute", bottom: 30, left: "50%", transform: "translateX(-50%)", zIndex: 50, background: "var(--ink)", color: "var(--paper)", borderRadius: 99, padding: "10px 20px", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", boxShadow: "var(--shadow-float)" }}>
          {toast}
        </div>
      }
    </div>);

}

Object.assign(window, { DetailScreen, MAvatar });