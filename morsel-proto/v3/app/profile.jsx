// Morsel v3 — profile: taste, dietary tiers, functional settings rows.
function ProfileScreen({ prefs, saved, collections, loc, locDenied, onRecalibrate, onEditDiet, onOpenSaved, onOpenLocation }) {
  const { dishes } = window.MorselData;
  const picked = (prefs && prefs.picked) || [];
  const tasteTags = [...new Set(picked.map((id) => { const d = dishes.find((x) => x.id === id); return d && d.tag; }).filter(Boolean))];
  const lifestyle = (prefs && prefs.lifestyle) || null;
  const allergies = (prefs && prefs.allergies) || [];
  // v3.1: never a stale hardcoded value — mirrors the live location state
  const locLabel = loc ? (loc.hood ? loc.hood + ", " + loc.city.split(",")[0] : loc.city) : (locDenied ? "Shaw, DC (demo)" : "Shaw, DC");
  const [info, setInfo] = React.useState(null); // { title, body, note }

  const Row = ({ icon, label, value, onClick }) => (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "14px 2px", borderBottom: "1px solid var(--line)", minHeight: 52 }}>
      <div style={{ color: "var(--ink-2)", flex: "none" }}><MIcon name={icon} size={19} /></div>
      <div className="m-second" style={{ fontWeight: 700, flex: 1, textAlign: "left" }}>{label}</div>
      <div className="m-caption" style={{ color: "var(--ink-3)", flex: "none" }}>{value}</div>
      <div style={{ color: "var(--ink-3)", flex: "none", transform: "rotate(180deg)" }}><MIcon name="back" size={14} /></div>
    </button>
  );

  return (
    <div className="m-screen m-fade" style={{ background: "var(--paper)" }}>
      <div className="m-scroll" style={{ padding: "64px 22px 120px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 26 }}>
          <MAvatar name="Alex" size={64} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="m-title" style={{ fontSize: "calc(26px * var(--ts))" }}>Alex</div>
            <div className="m-caption" style={{ color: "var(--ink-2)", marginTop: 2 }}>{locLabel} · {saved.size} dishes saved</div>
          </div>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r)", padding: "18px 16px", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div className="m-micro" style={{ color: "var(--ink-3)" }}>Your taste</div>
            <button className="m-caption" style={{ color: "var(--accent)", fontWeight: 700 }} onClick={onRecalibrate}>Recalibrate</button>
          </div>
          {tasteTags.length ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {tasteTags.map((t) => (
                <div key={t} style={{ borderRadius: 99, background: "var(--sunken)", padding: "8px 14px", fontSize: "calc(14px * var(--ts))", fontWeight: 700 }}>{t}</div>
              ))}
            </div>
          ) : (
            <div className="m-caption" style={{ color: "var(--ink-3)" }}>Not set — you skipped calibration. The feed ranks by distance alone.</div>
          )}
          <div className="m-caption" style={{ color: "var(--ink-3)", marginTop: 12 }}>
            {tasteTags.length ? `Read from ${picked.length} dishes you tapped — a moderate ranking boost, never a filter.` : "Tap Recalibrate to tune your feed."}
          </div>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r)", padding: "18px 16px", marginBottom: 26 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div className="m-micro" style={{ color: "var(--ink-3)" }}>Dietary</div>
            <button className="m-caption" style={{ color: "var(--accent)", fontWeight: 700 }} onClick={onEditDiet}>Edit</button>
          </div>
          <div className="m-caption" style={{ color: "var(--ink-3)", marginBottom: 8 }}>Lifestyle — filters your feed</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            {lifestyle ? (
              <div style={{ borderRadius: 99, border: "1.5px solid var(--line)", padding: "8px 14px", fontSize: "calc(14px * var(--ts))", fontWeight: 600, color: "var(--ink-2)" }}>{lifestyle}</div>
            ) : (
              <div className="m-caption" style={{ color: "var(--ink-3)", padding: "6px 0" }}>None — everything shows</div>
            )}
          </div>
          <div className="m-caption" style={{ color: "var(--accent)", fontWeight: 600, marginBottom: 8 }}>Allergies — excluded from discovery; saved dishes stay visible with warnings</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {allergies.length ? allergies.map((d) => (
              <div key={d} style={{ display: "inline-flex", alignItems: "center", gap: 5, borderRadius: 99, background: "var(--accent)", color: "var(--accent-ink)", padding: "8px 14px", fontSize: "calc(14px * var(--ts))", fontWeight: 700 }}>
                <span aria-hidden="true">!</span> {d}
              </div>
            )) : (
              <div className="m-caption" style={{ color: "var(--ink-3)", padding: "6px 0" }}>None set</div>
            )}
          </div>
          {allergies.length > 0 && (
            <div className="m-caption" style={{ color: "var(--ink-3)", marginTop: 12 }}>
              Allergen data is prototype seed data — always confirm with the kitchen.
            </div>
          )}
        </div>

        <div className="m-micro" style={{ color: "var(--ink-3)", marginBottom: 4 }}>Settings</div>
        <Row icon="pin" label="Neighborhood" value={locLabel} onClick={onOpenLocation} />
        <Row icon="bag" label="Order handoff" value="2 apps linked" onClick={() => setInfo({
          title: "Order handoff",
          body: "Morsel never runs its own checkout. Orders hand off to the apps you link here.",
          items: ["DoorDash — linked", "Uber Eats — linked", "Grubhub — not linked"],
          note: "Linking is mocked in this prototype; production would use each carrier's app-link flow."
        })} />
        <Row icon="flame" label="Hungry hour alert" value="Fri 5:30 PM" onClick={() => setInfo({
          title: "Hungry hour alert",
          body: "One nudge a week, timed to when you usually start browsing dinner.",
          items: ["Friday · 5:30 PM — on"],
          note: "Notification scheduling is out of prototype scope — shown for flow completeness."
        })} />
      </div>

      {info && (
        <div style={{ position: "absolute", inset: 0, zIndex: 60, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <button aria-label="Close" onClick={() => setInfo(null)} style={{ position: "absolute", inset: 0, background: "rgba(15,9,4,.45)", cursor: "pointer" }}></button>
          <div className="m-rise" style={{ position: "relative", background: "var(--surface)", borderRadius: "calc(var(--r) + 4px) calc(var(--r) + 4px) 0 0", padding: "10px 20px 28px", boxShadow: "var(--shadow-float)" }}>
            <div style={{ width: 36, height: 4, borderRadius: 99, background: "var(--line)", margin: "0 auto 14px" }}></div>
            <div className="m-heading" style={{ marginBottom: 6 }}>{info.title}</div>
            <div className="m-second" style={{ color: "var(--ink-2)", marginBottom: 14 }}>{info.body}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 14 }}>
              {info.items.map((it) => (
                <div key={it} className="m-second" style={{ fontWeight: 600, padding: "10px 0", borderBottom: "1px solid var(--line)" }}>{it}</div>
              ))}
            </div>
            <div className="m-caption" style={{ color: "var(--ink-3)", marginBottom: 16 }}>{info.note}</div>
            <button className="m-btn m-btn-quiet" style={{ width: "100%" }} onClick={() => setInfo(null)}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { ProfileScreen });
