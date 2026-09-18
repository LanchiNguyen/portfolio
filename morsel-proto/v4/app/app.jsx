// Morsel — app shell.
//   screen      home | picker | menu | dish | compare
//   restId      the restaurant whose menu is open (or was last open)
//   shortlist   up to three dish ids to compare; a decision aid, never a cart
//   view        menu | photos, within a full menu
//   returnTo    which screen opened the dish, so Back lands where it came from
//   menuFrom    which screen opened the menu: home or picker
const MORSEL_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "textScale": 100
}/*EDITMODE-END*/;

document.addEventListener("animationend", (e) => {
  if (e.target && e.animationName && e.animationName.indexOf("m-") === 0) e.target.style.animation = "none";
});

const MORSEL_STATE_KEY = "morsel4_state";
const MORSEL_SCREENS = ["home", "picker", "menu", "dish", "compare"];

// Load saved state defensively: anything malformed falls back to a fresh start.
function loadMorselState() {
  let raw = {};
  try { raw = JSON.parse(localStorage.getItem(MORSEL_STATE_KEY)) || {}; } catch (e) { raw = {}; }
  if (typeof raw !== "object" || raw === null) raw = {};
  const { restaurant, dish, compareMax } = window.MorselData;
  const s = {};
  const r = typeof raw.restId === "string" ? restaurant(raw.restId) : null;
  s.restId = r && r.menu !== "none" ? r.id : null;
  s.dishId = typeof raw.dishId === "string" && dish(raw.dishId) ? raw.dishId : null;
  s.shortlist = Array.isArray(raw.shortlist) ? raw.shortlist.filter((id, i, a) => typeof id === "string" && dish(id) && a.indexOf(id) === i).slice(0, compareMax) : [];
  s.view = raw.view === "photos" ? "photos" : "menu";
  s.screen = MORSEL_SCREENS.includes(raw.screen) ? raw.screen : "home";
  if (s.screen === "menu" && !s.restId) s.screen = "home";
  if (s.screen === "dish" && !s.dishId) s.screen = s.restId ? "menu" : "home";
  s.returnTo = ["home", "menu", "compare", "picker"].includes(raw.returnTo) ? raw.returnTo : "menu";
  s.menuFrom = raw.menuFrom === "picker" ? "picker" : "home";
  return s;
}

// Standalone phone viewports render the app at native CSS width, without the
// device bezel and without scaling. Embedded (iframe) and capture contexts keep
// the fixed 402px device so the case-study stage and figure pipeline are unchanged.
function isFrameless() {
  try { if (window.self !== window.top) return false; } catch (e) { return false; }
  return window.matchMedia("(max-width: 479px)").matches;
}
function useFrameless() {
  const [f, setF] = React.useState(isFrameless);
  React.useEffect(() => {
    const on = () => setF(isFrameless());
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  React.useEffect(() => { document.documentElement.setAttribute("data-morsel-frame", f ? "none" : "device"); }, [f]);
  return f;
}

function MorselApp({ frameless = false }) {
  const [t, setTweak] = useTweaks(MORSEL_TWEAK_DEFAULTS);
  const init = React.useMemo(loadMorselState, []);
  const { restaurant, dish, shortlistToggle, shortlistRemove } = window.MorselData;
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
  const [menuFrom, setMenuFrom] = React.useState(init.menuFrom);
  const appRef = React.useRef(null);
  const lastOpened = React.useRef(null);

  React.useEffect(() => {
    localStorage.setItem(MORSEL_STATE_KEY, JSON.stringify({ v: 4, screen, restId, dishId, shortlist, view, returnTo, menuFrom }));
  }, [screen, restId, dishId, shortlist, view, returnTo, menuFrom]);

  // capture/debug hook — lets tooling drive the prototype deterministically
  React.useEffect(() => {
    window.morselDebug = { setScreen, setRestId, setDishId, setShortlist, setView, setReturnTo, setMenuFrom, setTweak,
      pick: (id, from) => openMenu(id, from || "picker"),
      openDish: (id, from) => { const d = dish(id); if (d) setRestId(d.rest); setDishId(id); setReturnTo(from || "menu"); setScreen("dish"); } };
  });

  // Back from a dish: return focus to the card or row that opened it, once the list is mounted
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

  const openMenu = (id, from) => {
    const r = restaurant(id);
    if (!r || r.menu === "none") return;
    setRestId(id);
    setMenuFrom(from);
    setScreen("menu");
  };
  const toggle = (id) => {
    const res = shortlistToggle(shortlistRef.current, id);
    setShortlist(res.list);
    return res;
  };
  const openDish = (id, from) => {
    lastOpened.current = id;
    const d = dish(id);
    if (d) setRestId(d.rest);
    setDishId(id);
    setReturnTo(from);
    setScreen("dish");
  };
  const backFromDish = () => {
    if (returnTo === "compare" && shortlist.length) return setScreen("compare");
    if (returnTo === "home") return setScreen("home");
    setScreen("menu");
  };
  const backLabel = returnTo === "compare" && shortlist.length ? "Back to compare" : returnTo === "home" ? "Back to nearby" : "Back to menu";
  // Tab bar: Nearby, Menu (the last restaurant, or the picker), Compare
  const goTab = (tab) => {
    if (tab === "home") setScreen("home");
    else if (tab === "menu") { if (restId) setScreen("menu"); else setScreen("picker"); }
    else setScreen("compare");
  };
  const tab = screen === "home" ? "home" : screen === "compare" ? "compare" : (screen === "menu" || screen === "picker") ? "menu" : null;
  const showTabs = screen !== "dish";

  const app = (
        <div className="morsel-app" style={{ "--ts": t.textScale / 100 }} data-ts={t.textScale >= 130 ? "large" : "normal"} data-tabs={showTabs ? "true" : "false"}>
          {screen === "home" && <HomeScreen onPicker={() => setScreen("picker")} onRestaurant={(id) => openMenu(id, "home")} onOpen={(id) => openDish(id, "home")} />}
          {screen === "picker" && <PickerScreen onPick={(id) => openMenu(id, "picker")} onBack={() => setScreen("home")} />}
          {screen === "menu" && restId && (
            <MenuScreen restId={restId} view={view} setView={setView} shortlist={shortlist} onToggle={toggle}
              onOpen={(id) => openDish(id, "menu")} onBack={() => setScreen(menuFrom === "picker" ? "picker" : "home")} />
          )}
          {screen === "dish" && dishId && (
            <DishScreen dishId={dishId} shortlist={shortlist} onToggle={toggle} onBack={backFromDish} backLabel={backLabel} fromMenu={returnTo === "menu"}
              onMenu={() => openMenu(dish(dishId).rest, "home")} onCompare={() => { setReturnTo("compare"); setScreen("compare"); }} />
          )}
          {screen === "compare" && (
            <CompareScreen shortlist={shortlist} onRemove={(id) => setShortlist((l) => shortlistRemove(l, id))}
              onOpen={(id) => openDish(id, "compare")} onBack={() => setScreen(restId ? "menu" : "home")} onAdd={() => setScreen(restId ? "menu" : "home")} />
          )}
          {showTabs && (
            <div className="m-tabbar" role="tablist" aria-label="Morsel">
              <button className="m-tab" role="tab" data-active={tab === "home"} aria-selected={tab === "home"} onClick={() => goTab("home")}><MIcon name="grid" size={20} /><span className="m-tab-label">Nearby</span></button>
              <button className="m-tab" role="tab" data-active={tab === "menu"} aria-selected={tab === "menu"} aria-label={restId ? "Menu, " + restaurant(restId).name : "Menu"} onClick={() => goTab("menu")}><MIcon name="menu" size={20} /><span className="m-tab-label">Menu</span></button>
              <button className="m-tab" role="tab" data-active={tab === "compare"} aria-selected={tab === "compare"} aria-label={"Compare, " + shortlist.length + " of 3"} onClick={() => goTab("compare")}>
                <MIcon name="compare" size={20} /><span className="m-tab-label">Compare</span>{shortlist.length > 0 && <span className="m-tab-badge" aria-hidden="true">{shortlist.length}</span>}
              </button>
            </div>
          )}
        </div>
  );
  const controls = (
      <details className="m-demo-controls" style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, maxWidth: 402, marginTop: 16, color: "#34291f" }}>
        <summary style={{ cursor: "pointer", padding: 12 }}>Prototype controls</summary>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 12 }}>
          <label>Text size <select value={t.textScale} onChange={(e) => setTweak("textScale", Number(e.target.value))} style={{ padding: 8 }}>
            <option value={100}>100%</option><option value={120}>120%</option><option value={140}>140%</option>
          </select></label>
          <button style={{ padding: 10 }} onClick={() => { localStorage.removeItem(MORSEL_STATE_KEY); window.location.reload(); }}>Reset the prototype</button>
        </div>
      </details>
  );
  if (frameless) {
    return (
      <div className="morsel-app-shell" data-frame="none" ref={appRef}>
        {app}
        {controls}
      </div>
    );
  }
  return (
    <div className="morsel-app-shell" data-frame="device" style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 402 }} ref={appRef}>
      <IOSDevice>{app}</IOSDevice>
      {controls}
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
  const frameless = useFrameless();
  const [scale, setScale] = React.useState(1);
  React.useEffect(() => {
    const fit = () => setScale(Math.max(0.5, Math.min(1, (window.innerWidth - 24) / 402, (window.innerHeight - 70) / 900)));
    fit(); window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  const foot = (
    <div style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 13, color: "#6F5F4B", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", justifyContent: "center", padding: "0 16px" }}>
          <span style={{ fontWeight: 700, color: "#4A3C2C" }}>Morsel</span>
          <span>Interactive prototype</span>
          <a href="../morsel-docs/wireflow.html" style={{ color: "#9C4726", fontWeight: 600 }}>flow →</a>
          <a href="../morsel-docs/explorations.html" style={{ color: "#9C4726", fontWeight: 600 }}>alternatives →</a>
          <a href="../morsel.html" style={{ color: "#9C4726", fontWeight: 600 }}>case study →</a>
        </div>
        <div style={{ fontSize: 12, maxWidth: 560, textAlign: "center", padding: "0 16px" }}>Interactive concept with fictional restaurants and sample menu data. All photos, including those labeled as diner photos, are illustrative fixtures; nothing is ordered.</div>
    </div>
  );
  if (frameless) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "0 0 24px" }}>
        <MorselApp frameless />
        {foot}
      </div>
    );
  }
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: "16px 0" }}>
      <div style={{ width: 402 * scale, height: 874 * scale + 150, overflow: "visible" }}>
        <div style={{ width: 402, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          <MorselApp />
        </div>
      </div>
      {foot}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<MorselPage />);
