// Morsel — shared icons + onboarding flow (3 steps)
const MIcon = ({ name, size = 22, filled = false }) => {
  const s = { width: size, height: size, flex: "none" };
  const k = { fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round" };
  const paths = {
    heart: <path {...k} fill={filled ? "currentColor" : "none"} d="M12 20.5C7.5 17.2 3.5 13.8 3.5 9.6 3.5 6.8 5.6 4.8 8.2 4.8c1.6 0 3 .8 3.8 2.1.8-1.3 2.2-2.1 3.8-2.1 2.6 0 4.7 2 4.7 4.8 0 4.2-4 7.6-8.5 10.9z" />,
    search: <g {...k}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></g>,
    sliders: <g {...k}><path d="M4 8h10M18 8h2M4 16h2M10 16h10" /><circle cx="16" cy="8" r="2.2" /><circle cx="8" cy="16" r="2.2" /></g>,
    pin: <g {...k}><path d="M12 21s-6.5-5.4-6.5-10.3C5.5 7 8.4 4 12 4s6.5 3 6.5 6.7C18.5 15.6 12 21 12 21z" /><circle cx="12" cy="10.5" r="2.3" /></g>,
    nav: <path {...k} d="M20 4L4 11.5l7 1.8 1.8 7L20 4z" />,
    bag: <g {...k}><path d="M5.5 8h13l-1 12.5h-11L5.5 8z" /><path d="M9 10.5V6.8C9 5.2 10.3 4 12 4s3 1.2 3 2.8v3.7" /></g>,
    back: <path {...k} d="M14.5 5L8 12l6.5 7" />,
    bookmark: <path {...k} fill={filled ? "currentColor" : "none"} d="M7 4h10a1 1 0 011 1v15.5L12 17l-6 3.5V5a1 1 0 011-1z" />,
    grid: <g {...k}><rect x="4" y="4" width="7" height="9" rx="1.5" /><rect x="13" y="4" width="7" height="5" rx="1.5" /><rect x="13" y="11" width="7" height="9" rx="1.5" /><rect x="4" y="15" width="7" height="5" rx="1.5" /></g>,
    user: <g {...k}><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c1-3.5 3.8-5 7-5s6 1.5 7 5" /></g>,
    check: <path {...k} strokeWidth="2.4" d="M5 12.5l4.5 4.5L19 7.5" />,
    share: <g {...k}><path d="M12 4v12M12 4l-4 4M12 4l4 4" /><path d="M5 13v6h14v-6" /></g>,
    flame: <path {...k} d="M12 21c-3.9 0-6.5-2.5-6.5-6 0-2.6 1.7-4.5 3-6.2C9.7 7.2 10.8 5.6 11 3.5c2.6 1.6 4 4.1 3.4 6.6 1-.3 1.8-1 2.2-2 1.2 1.6 1.9 3.5 1.9 5.4 0 4-2.6 7.5-6.5 7.5z" />,
    plus: <path {...k} strokeWidth="2.2" d="M12 5v14M5 12h14" />
  };
  return <svg viewBox="0 0 24 24" style={s}>{paths[name] || null}</svg>;
};

/* ============ ONBOARDING ============ */

function ObDots({ step }) {
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{
          width: i === step ? 22 : 6, height: 6, borderRadius: 99,
          background: i === step ? "var(--accent)" : "var(--ink-3)",
          transition: "all .25s ease"
        }}></div>
      ))}
    </div>
  );
}

function ObWelcome({ onNext }) {
  const { u } = window.MorselData;
  // Three-column slow collage behind the headline
  const cols = [
    ["1565299624946-b28f40a0ae38", "1567620905732-2d1ec7ab7445", "1569718212165-3a8278d5f624"],
    ["1579871494447-9811cf80d66c", "1568901346375-23c9450c58cd", "1565958011703-44f9829ba187"],
    ["1565557623262-b51c2513a641", "1546069901-ba9599a7e63c", "1504674900247-0877df9cc836"]
  ];
  return (
    <div className="m-screen m-fade" style={{ background: "#16100B" }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", gap: 8, padding: "0 8px", opacity: 0.9 }}>
        {cols.map((col, ci) => (
          <div key={ci} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, transform: `translateY(${ci === 1 ? -40 : -8}px)` }}>
            {col.map((id) => (
              <div key={id} style={{ borderRadius: 18, overflow: "hidden", flex: "none", height: 240, background: "#241A12" }}>
                <img src={u(id, 400)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(13,8,4,.96) 18%, rgba(13,8,4,.55) 48%, rgba(13,8,4,.18) 75%)" }}></div>
      <div style={{ position: "relative", marginTop: "auto", padding: "0 28px 30px", display: "flex", flexDirection: "column", gap: 16, color: "#FFF7EB" }}>
        <div className="m-display m-rise" style={{ fontSize: 44 }}>Eat with<br />your eyes.</div>
        <div className="m-body m-rise" style={{ color: "rgba(255,247,235,.75)", maxWidth: 280, animationDelay: ".06s" }}>
          The best dishes in the District, shot by the people who ate them. No stars. No essays.
        </div>
        <button className="m-btn m-btn-primary m-rise" style={{ marginTop: 8, alignSelf: "stretch", animationDelay: ".12s" }} onClick={() => onNext(false)}>
          Show me what's good
        </button>
        <button className="m-caption" style={{ color: "rgba(255,247,235,.65)", fontWeight: 700, alignSelf: "center", minHeight: 32 }} onClick={() => onNext(true)}>
          Continue without location
        </button>
        <div className="m-caption" style={{ textAlign: "center", color: "rgba(255,247,235,.5)" }}>Location only ranks what's near you — never shared, never posted. You can set it by hand anytime.</div>
      </div>
    </div>
  );
}

// Taste calibration — unlabeled dish photos; cuisines are inferred from taps.
// Mixed order so no two same-tag dishes sit adjacent.
const TASTE_IDS = ["d01", "d08", "d07", "d21", "d04", "d15", "d11", "d05", "d09", "d24", "d17", "d03", "d16", "d22", "d20", "d13", "d18", "d26"];

function ObTaste({ picked, setPicked, onNext, onSkip, onBack }) {
  const { u, dishes } = window.MorselData;
  const pool = TASTE_IDS.map((id) => dishes.find((d) => d.id === id));
  const toggle = (id) => setPicked((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const tags = [...new Set(picked.map((id) => dishes.find((d) => d.id === id).tag))];
  const enough = picked.length >= 4;
  return (
    <div className="m-screen m-fade" style={{ background: "var(--paper)" }}>
      <div style={{ padding: "64px 24px 4px", display: "flex", flexDirection: "column", gap: 14 }}>
        <ObDots step={1} />
        <div className="m-title">Tap what looks<br />good to you.</div>
        <div className="m-second" style={{ color: "var(--ink-2)" }}>We'll read your taste from it. Nothing gets hidden — this only tunes what surfaces first.</div>
      </div>
      <div className="m-scroll" style={{ padding: "14px 24px 150px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {pool.map((d, i) => {
            const on = picked.includes(d.id);
            return (
              <button key={d.id} className="m-photo m-rise" onClick={() => toggle(d.id)} aria-label={d.name} aria-pressed={on}
                style={{ aspectRatio: "0.82", animationDelay: `${i * 0.03}s`, outline: on ? "3px solid var(--accent)" : "3px solid transparent", outlineOffset: -3 }}>
                <img src={u(d.img, 320)} alt={d.name} />
                {on && (
                  <div className="m-fade" style={{ position: "absolute", top: 8, right: 8, width: 26, height: 26, borderRadius: 99, background: "var(--accent)", color: "var(--accent-ink)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <MIcon name="check" size={15} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "34px 24px 30px", display: "flex", flexDirection: "column", gap: 12, background: "linear-gradient(to top, var(--paper) 62%, transparent)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", minHeight: 30 }}>
          {tags.length === 0 ? (
            <div className="m-caption" style={{ color: "var(--ink-3)" }}>Your taste shows up here as you tap…</div>
          ) : (
            <React.Fragment>
              <div className="m-caption" style={{ color: "var(--ink-3)", fontWeight: 600 }}>Sensing:</div>
              {tags.map((t) => (
                <div key={t} className="m-fade" style={{ borderRadius: 99, background: "var(--ink)", color: "var(--paper)", padding: "5px 12px", fontSize: 12, fontWeight: 700 }}>{t}</div>
              ))}
            </React.Fragment>
          )}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="m-btn m-btn-quiet" style={{ flex: "none", width: 52, padding: 0 }} onClick={onBack}><MIcon name="back" /></button>
          <button className="m-btn m-btn-primary" style={{ flex: 1 }} disabled={!enough} onClick={onNext}>
            {enough ? "Next" : `Tap ${4 - picked.length} more dish${4 - picked.length === 1 ? "" : "es"}`}
          </button>
        </div>
        <button className="m-caption" style={{ color: "var(--ink-3)", fontWeight: 700, alignSelf: "center", minHeight: 32 }} onClick={onSkip}>
          Skip for now — you can browse first
        </button>
      </div>
    </div>
  );
}

// v2 — three tiers, three different promises:
// taste RE-RANKS (step 2) · lifestyle FILTERS · allergies EXCLUDE + FLAG.
function ObSafety({ lifestyle, setLifestyle, allergies, setAllergies, onDone, onBack }) {
  const { lifestyles, allergens } = window.MorselData;
  const toggleAllergy = (a) => setAllergies((p) => p.includes(a) ? p.filter((x) => x !== a) : [...p, a]);
  return (
    <div className="m-screen m-fade" style={{ background: "var(--paper)" }}>
      <div style={{ padding: "64px 24px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
        <ObDots step={2} />
        <div className="m-title">Eat your way.</div>
        <div className="m-second" style={{ color: "var(--ink-2)" }}>Lifestyle shapes your feed. Allergies are a hard rule.</div>
      </div>
      <div className="m-scroll" style={{ padding: "8px 24px 130px" }}>
        <div className="m-micro" style={{ color: "var(--ink-3)", marginBottom: 4 }}>Lifestyle</div>
        <div className="m-caption" style={{ color: "var(--ink-2)", marginBottom: 12 }}>Filters the feed to matching dishes. Change anytime.</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 28 }}>
          {lifestyles.map((d, i) => (
            <button key={d} className="m-chip m-rise" data-on={lifestyle === d} aria-pressed={lifestyle === d} style={{ animationDelay: `${i * 0.03}s` }}
              onClick={() => setLifestyle(lifestyle === d ? null : d)}>
              {lifestyle === d && <MIcon name="check" size={14} />}{d}
            </button>
          ))}
        </div>
        <div className="m-micro" style={{ color: "var(--accent)", marginBottom: 4 }}>Allergies</div>
        <div className="m-caption" style={{ color: "var(--ink-2)", marginBottom: 12 }}>Not a preference — dishes with these <b>leave your feed and search</b>. Anything you've saved stays visible, with a clear warning.</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {allergens.map((d, i) => {
            const on = allergies.includes(d);
            return (
              <button key={d} className="m-chip m-rise" aria-pressed={on} style={{ animationDelay: `${i * 0.03}s`,
                background: on ? "var(--accent)" : "var(--surface)", color: on ? "var(--accent-ink)" : "var(--ink)", borderColor: on ? "var(--accent)" : "var(--line)" }}
                onClick={() => toggleAllergy(d)}>
                {on && <MIcon name="check" size={14} />}{d}
              </button>
            );
          })}
        </div>
        {allergies.length > 0 && (
          <div className="m-caption m-fade" style={{ color: "var(--ink-2)", marginTop: 16, background: "var(--sunken)", borderRadius: 14, padding: "10px 14px" }}>
            Always confirm with the kitchen too — restaurants share surfaces, and menu data can lag.
          </div>
        )}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "28px 24px 30px", display: "flex", gap: 10, background: "linear-gradient(to top, var(--paper) 55%, transparent)" }}>
        <button className="m-btn m-btn-quiet" style={{ flex: "none", width: 52, padding: 0 }} onClick={onBack}><MIcon name="back" /></button>
        <button className="m-btn m-btn-primary" style={{ flex: 1 }} onClick={onDone}>Start browsing</button>
      </div>
    </div>
  );
}

function Onboarding({ onComplete }) {
  const [step, setStep] = React.useState(0);
  const [picked, setPicked] = React.useState([]);
  const [lifestyle, setLifestyle] = React.useState(null);
  const [allergies, setAllergies] = React.useState([]);
  const [denied, setDenied] = React.useState(false);
  // capture/debug hook — lets tooling jump to a given onboarding state
  React.useEffect(() => {
    window.morselOb = { setStep, setPicked, setLifestyle, setAllergies, setDenied };
    return () => { delete window.morselOb; };
  });
  if (step === 0) return <ObWelcome onNext={(d) => { setDenied(!!d); setStep(1); }} />;
  if (step === 1) return <ObTaste picked={picked} setPicked={setPicked} onNext={() => setStep(2)} onSkip={() => setStep(2)} onBack={() => setStep(0)} />;
  return <ObSafety lifestyle={lifestyle} setLifestyle={setLifestyle} allergies={allergies} setAllergies={setAllergies} onBack={() => setStep(1)} onDone={() => onComplete({ picked, lifestyle, allergies, locDenied: denied })} />;
}

Object.assign(window, { MIcon, Onboarding });
