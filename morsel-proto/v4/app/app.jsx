// Morsel — app shell for the visual-menu prototype.
//   screen      entry | menu | dish | compare | nomenu
//   restId      the restaurant the diner picked
//   shortlist   up to three dish ids to compare; a decision aid, never a cart
//   view        menu | photos, within the restaurant
//   returnTo    which screen opened the dish, so Back lands where it came from
const MORSEL_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "textScale": 100
}/*EDITMODE-END*/;

document.addEventListener("animationend", (e) => {
  if (e.target && e.animationName && e.animationName.indexOf("m-") === 0) e.target.style.animation = "none";
});

const MORSEL_STATE_KEY = "morsel4_state";
const MORSEL_SCREENS = ["entry", "menu", "dish", "compare", "nomenu"];

// Load saved state defensively: anything malformed falls back to a fresh start.
function loadMorselState() {
  let raw = {};
  try { raw = JSON.parse(localStorage.getItem(MORSEL_STATE_KEY)) || {}; } catch (e) { raw = {}; }
  if (typeof raw !== "object" || raw === null) raw = {};
  const { restaurant, dish, compareMax } = window.MorselData;
  const s = {};
  s.restId = typeof raw.restId === "string" && restaurant(raw.restId) ? raw.restId : null;
  s.dishId = typeof raw.dishId === "string" && dish(raw.dishId) ? raw.dishId : null;
  s.shortlist = Array.isArray(raw.shortlist) ? raw.shortlist.filter((id, i, a) => typeof id === "string" && dish(id) && a.indexOf(id) === i).slice(0, compareMax) : [];
  s.view = raw.view === "photos" ? "photos" : "menu";
  s.screen = MORSEL_SCREENS.includes(raw.screen) ? raw.screen : "entry";
  if ((s.screen === "menu" || s.screen === "compare" || s.screen === "nomenu") && !s.restId) s.screen = "entry";
  if (s.screen === "dish" && !(s.restId && s.dishId)) s.screen = s.restId ? "menu" : "entry";
  s.returnTo = raw.returnTo === "compare" ? "compare" : "menu";
  return s;
}

function MorselApp() {
  const [t, setTweak] = useTweaks(MORSEL_TWEAK_DEFAULTS);
  const init = React.useMemo(loadMorselState, []);
  const { restaurant, shortlistToggle, shortlistRemove } = window.MorselData;
  const [screen, setScreen] = React.useState(init.screen);
  const [restId, setRestId] = React.useState(init.restId);
  const [dishId, setDishId] = React.useState(init.dishId);
  const [shortlist, setShortlistState] = React.useState(init.shortlist);
  // The shortlist rule is pure; the ref keeps two taps in one tick from
  // each computing against the same stale list.
  const shortlistRef = React.useRef(init.shortlist);
  const setShortlist = (next) => { const v = typeof next === "function" ? next(shortlistRef.current) : next; shortlistRef.current = v; setShortlistState(v); };
  const [view, setView] = React.useState(init.view);
  const [returnTo, setReturnTo] = React.useState(init.returnTo);
  const appRef = React.useRef(null);
  const lastOpened = React.useRef(null);

  React.useEffect(() => {
    localStorage.setItem(MORSEL_STATE_KEY, JSON.stringify({ v: 4, screen, restId, dishId, shortlist, view, returnTo }));
  }, [screen, restId, dishId, shortlist, view, returnTo]);

  // capture/debug hook — lets tooling drive the prototype deterministically
  React.useEffect(() => {
    window.morselDebug = { setScreen, setRestId, setDishId, setShortlist, setView, setReturnTo, setTweak,
      pick: (id) => pick(id),
      openDish: (id, from) => { setDishId(id); setReturnTo(from || "menu"); setScreen("dish"); } };
  });

  // Back from a dish: return focus to the row that opened it, once the list is mounted
  React.useEffect(() => {
    if (screen === "dish" || !lastOpened.current) return;
    const id = lastOpened.current;
    lastOpened.current = null;
    const raf = requestAnimationFrame(() => {
      const root = appRef.current;
      const el = root && root.querySelector('[data-dish-id="' + id + '"] button');
      if (el && typeof el.focus === "function") el.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(raf);
  }, [screen]);

  const pick = (id) => {
    const r = restaurant(id);
    setRestId(id);
    setScreen(r && r.visual ? "menu" : "nomenu");
  };
  const toggle = (id) => {
    const res = shortlistToggle(shortlistRef.current, id);
    setShortlist(res.list);
    return res;
  };
  const openDish = (id, from) => {
    lastOpened.current = id;
    setDishId(id);
    setReturnTo(from);
    setScreen("dish");
  };
  const back = () => setScreen(returnTo === "compare" && shortlist.length ? "compare" : "menu");

  return (
    <div className="morsel-app-shell" style={{ display: "flex", flexDirection: "column", alignItems: "center" }} ref={appRef}>
      <IOSDevice>
        <div className="morsel-app" style={{ "--ts": t.textScale / 100 }}>
          {screen === "entry" && <EntryScreen onPick={pick} />}
          {screen === "nomenu" && <NoMenuScreen restId={restId} onBack={() => setScreen("entry")} />}
          {screen === "menu" && restId && (
            <MenuScreen restId={restId} view={view} setView={setView} shortlist={shortlist} onToggle={toggle}
              onOpen={(id) => openDish(id, "menu")} onCompare={() => setScreen("compare")} onBack={() => setScreen("entry")} />
          )}
          {screen === "dish" && dishId && (
            <DishScreen dishId={dishId} shortlist={shortlist} onToggle={toggle} onBack={back} onCompare={() => setScreen("compare")} />
          )}
          {screen === "compare" && (
            <CompareScreen shortlist={shortlist} onRemove={(id) => setShortlist((l) => shortlistRemove(l, id))}
              onOpen={(id) => openDish(id, "compare")} onBack={() => setScreen("menu")} />
          )}
        </div>
      </IOSDevice>

      <details className="m-demo-controls" style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, maxWidth: 402, marginTop: 16, color: "#34291f" }}>
        <summary style={{ cursor: "pointer", padding: 12 }}>Prototype controls</summary>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 12 }}>
          <label>Text size <select value={t.textScale} onChange={(e) => setTweak("textScale", Number(e.target.value))} style={{ padding: 8 }}>
            <option value={100}>100%</option><option value={120}>120%</option><option value={140}>140%</option>
          </select></label>
          <button style={{ padding: 10 }} onClick={() => { localStorage.removeItem(MORSEL_STATE_KEY); window.location.reload(); }}>Reset the prototype</button>
        </div>
      </details>
      <TweaksPanel>
        <TweakSection label="Prototype" />
        <TweakSlider label="Text size" value={t.textScale} min={100} max={140} unit="%" onChange={(v) => setTweak("textScale", v)} />
        <TweakButton label="Reset the prototype" onClick={() => { localStorage.removeItem(MORSEL_STATE_KEY); window.location.reload(); }} />
      </TweaksPanel>
    </div>
  );
}

// ---- page mount: phone centered + scaled to fit viewport ----
function MorselPage() {
  const [scale, setScale] = React.useState(1);
  React.useEffect(() => {
    const fit = () => setScale(Math.max(0.5, Math.min(1, (window.innerWidth - 24) / 402, (window.innerHeight - 70) / 900)));
    fit(); window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: "16px 0" }}>
      <div style={{ width: 402 * scale, height: 874 * scale + 150 }}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
          <MorselApp />
        </div>
      </div>
      <div style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 13, color: "#8A7A66", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", justifyContent: "center", padding: "0 16px" }}>
          <span style={{ fontWeight: 700, color: "#5C4B38" }}>Morsel</span>
          <span>Interactive prototype</span>
          <a href="../morsel-docs/wireflow.html" style={{ color: "#B0542F", fontWeight: 600 }}>flow →</a>
          <a href="../morsel-docs/explorations.html" style={{ color: "#B0542F", fontWeight: 600 }}>alternatives →</a>
          <a href="../morsel.html" style={{ color: "#B0542F", fontWeight: 600 }}>case study →</a>
        </div>
        <div style={{ fontSize: 12, maxWidth: 560, textAlign: "center" }}>Interactive concept with a fictional restaurant and sample menu data. All photos, including those labeled as diner photos, are illustrative fixtures; nothing is ordered.</div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<MorselPage />);
