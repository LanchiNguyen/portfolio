// Morsel v3.2 — app shell: navigation, saves, dietary tiers, sim states, tweaks.
// What lives here and why:
//   query, filters, area   shared by feed and search, so Back never re-asks for them
//   savedAt                a real timestamp per save, so "Recent" means recent
//   return context         which screen opened the dish, and which card, so Back
//                          lands on the same list, scroll position and focused card
const MORSEL_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "direction": "toast",
  "accent": "",
  "radius": 22,
  "gridCols": 2,
  "displayFont": "",
  "sim": "none",
  "textScale": 100
}/*EDITMODE-END*/;

// In-between display faces — Lora 600 is the committed default for Toast
const DISPLAY_FONTS = {
  "": null, // direction default (Toast = Lora 600)
  instrument: { family: '"Instrument Serif", Georgia, serif', weight: 400, label: "Instrument 400 — fine serif" },
  sourceserif: { family: '"Source Serif 4", Georgia, serif', weight: 600, label: "Source Serif 600 — calm, editorial" },
  bitter: { family: '"Bitter", Georgia, serif', weight: 600, label: "Bitter 600 — slab, a bit chunky" },
  hanken700: { family: '"Hanken Grotesk", sans-serif', weight: 700, label: "Hanken 700 — softer grotesque" }
};

const DIR_LABELS = { toast: "Toast — cream + serif", saffron: "Saffron — grotesque, denser", charred: "Charred — after dark" };

// After entrance animations finish, neutralize them so DOM captures /
// print show the settled state instead of frame 0.
document.addEventListener("animationend", (e) => {
  if (e.target && e.animationName && e.animationName.indexOf("m-") === 0) {
    e.target.style.animation = "none";
  }
});

const MORSEL_STATE_KEY = "morsel3_state";

// Load and migrate. Older saved state (v3.1) had no savedAt map, an "openNow"
// filter, string price buckets in some captures, a locDenied flag, and could hold
// a location object with a null city. Each is normalised here rather than in the
// screens, and nothing a diner saved is dropped.
function loadMorselState() {
  let raw = {};
  try { raw = JSON.parse(localStorage.getItem(MORSEL_STATE_KEY)) || {}; } catch (e) { raw = {}; }
  if (typeof raw !== "object" || raw === null) raw = {};
  const s = { ...raw };
  const f = (s.filters && typeof s.filters === "object") ? s.filters : {};
  s.filters = {
    price: Array.isArray(f.price) ? f.price.map(Number).filter((b) => [1, 2, 3].includes(b)) : [],
    maxMi: typeof f.maxMi === "number" && f.maxMi > 0 ? f.maxMi : 99
  };
  s.loc = (s.loc && typeof s.loc === "object" && typeof s.loc.city === "string") ? { city: s.loc.city, hood: s.loc.hood || null } : null;
  if (s.prefs && typeof s.prefs === "object") {
    s.prefs = { picked: Array.isArray(s.prefs.picked) ? s.prefs.picked : [], lifestyle: s.prefs.lifestyle || null, allergies: Array.isArray(s.prefs.allergies) ? s.prefs.allergies : [] };
  } else s.prefs = null;
  s.saved = Array.isArray(s.saved) ? s.saved.filter((id) => typeof id === "string") : null;
  s.savedAt = (s.savedAt && typeof s.savedAt === "object") ? s.savedAt : {};
  s.collections = Array.isArray(s.collections) ? s.collections.filter((c) => c && typeof c === "object" && Array.isArray(c.dishes)) : null;
  s.query = typeof s.query === "string" ? s.query : "";
  if (!["feed", "saved", "profile", "detail", "search", "restaurant", "collection", "onboarding"].includes(s.screen)) s.screen = undefined;
  return s;
}

function MorselApp() {
  const [t, setTweak] = useTweaks(MORSEL_TWEAK_DEFAULTS);
  const init = React.useMemo(loadMorselState, []);
  const { dishes } = window.MorselData;
  const known = (id) => dishes.some((d) => d.id === id);
  const [screen, setScreen] = React.useState(init.screen || "onboarding");
  const [dishId, setDishId] = React.useState(init.dishId && known(init.dishId) ? init.dishId : null);
  const [collections, setCollections] = React.useState(() => (init.collections || window.MorselData.collections).map((c) => ({ ...c, dishes: c.dishes.filter(known) })));
  // saved is the master set: anything filed in a collection is, by definition, saved
  const [saved, setSaved] = React.useState(() => {
    const base = new Set((init.saved || ["d08", "d01"]).filter(known));
    (init.collections || window.MorselData.collections).forEach((c) => c.dishes.forEach((id) => { if (known(id)) base.add(id); }));
    return base;
  });
  const [savedAt, setSavedAt] = React.useState(init.savedAt);
  const [sheetDishId, setSheetDishId] = React.useState(null);
  const [saveToastId, setSaveToastId] = React.useState(null);
  const [announce, setAnnounce] = React.useState(""); // SR live region for save/unsave
  const toastTimer = React.useRef(null);
  const [tab, setTab] = React.useState(init.tab || "feed");
  const [prefs, setPrefs] = React.useState(init.prefs);
  const [colId, setColId] = React.useState(init.colId || null);
  const [restName, setRestName] = React.useState(init.restName || null);
  const [returnTo, setReturnTo] = React.useState(init.returnTo || "feed");
  const [filters, setFilters] = React.useState(init.filters);
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [loc, setLoc] = React.useState(init.loc);
  const [locOpen, setLocOpen] = React.useState(false);
  const [query, setQuery] = React.useState(init.query);
  const [ob, setOb] = React.useState({ start: 0, back: "feed" }); // entry flow: where it starts, where it returns
  const appRef = React.useRef(null);
  const [zoom, setZoom] = React.useState(null);
  const zoomTimer = React.useRef(null);
  const lastOpened = React.useRef(null); // card to refocus after Back

  React.useEffect(() => {
    localStorage.setItem(MORSEL_STATE_KEY, JSON.stringify({ v: 2, screen, dishId, tab, saved: [...saved], savedAt, collections, prefs, colId, restName, returnTo, filters, loc, query }));
  }, [screen, dishId, tab, saved, savedAt, collections, prefs, colId, restName, returnTo, filters, loc, query]);

  // Simulated prototype states (driven from the demo controls)
  window.MorselSim = {
    loading: t.sim === "loading",
    offline: t.sim === "offline",
    imgfail: t.sim === "imgfail",
    handoffFail: t.sim === "handoff"
  };

  // capture/debug hook — lets tooling drive the prototype deterministically
  React.useEffect(() => {
    window.morselDebug = { setScreen, setTab, setDishId, setPrefs, setFilters, setLoc, setSheetDishId, setSaveToastId, setFiltersOpen, setLocOpen, setColId, setRestName, setTweak, setCollections, setQuery, setSavedAt, setReturnTo,
      setOb: (start, back) => setOb({ start, back: back || "feed" }),
      setSavedIds: (ids) => setSaved(new Set(ids)),
      openDish: (id) => { setDishId(id); setScreen("detail"); } };
  });

  // Back from a dish: return focus to the card that opened it, once the list is mounted
  React.useEffect(() => {
    if (screen === "detail" || !lastOpened.current) return;
    const id = lastOpened.current;
    lastOpened.current = null;
    const raf = requestAnimationFrame(() => {
      const root = appRef.current;
      const el = root && root.querySelector('[data-dish-id="' + id + '"]');
      if (el && typeof el.focus === "function") el.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(raf);
  }, [screen]);

  const dish = dishes.find((d) => d.id === dishId);
  const col = collections.find((c) => c.id === colId);
  const openDish = (d, e) => {
    if (screen !== "detail") setReturnTo(screen);
    lastOpened.current = d.id;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (e && e.currentTarget && appRef.current && !reduce && !(window.MorselSim || {}).imgfail) {
      const c = appRef.current.getBoundingClientRect();
      const r = e.currentTarget.getBoundingClientRect();
      const sc = c.width / appRef.current.offsetWidth || 1;
      setZoom({
        src: window.MorselData.u(d.img, 520),
        from: { x: (r.left - c.left) / sc, y: (r.top - c.top) / sc, w: r.width / sc, h: r.height / sc },
        key: Date.now()
      });
      window.clearTimeout(zoomTimer.current);
      zoomTimer.current = window.setTimeout(() => setZoom(null), 620);
    }
    setDishId(d.id); setScreen("detail");
  };
  const stamp = (id) => setSavedAt((m) => (m[id] ? m : { ...m, [id]: Date.now() }));
  const toggleSave = (id) => {
    if (saved.has(id)) {
      setSaved((s) => { const n = new Set(s); n.delete(id); return n; });
      setSavedAt((m) => { const n = { ...m }; delete n[id]; return n; });
      setCollections((cs) => cs.map((c) => ({ ...c, dishes: c.dishes.filter((x) => x !== id) })));
      setAnnounce("Removed from saves");
    } else {
      setSaved((s) => new Set(s).add(id));
      stamp(id);
      setAnnounce("Saved");
      setSaveToastId(id);
      window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => setSaveToastId(null), 3500);
    }
  };
  const toggleInCollection = (colId) => {
    setCollections((cs) => cs.map((c) => {
      if (c.id !== colId) return c;
      const has = c.dishes.includes(sheetDishId);
      return { ...c, dishes: has ? c.dishes.filter((x) => x !== sheetDishId) : [...c.dishes, sheetDishId] };
    }));
    setSaved((s) => new Set(s).add(sheetDishId));
    stamp(sheetDishId);
  };
  const createCollection = (name) => { setCollections((cs) => [...cs, { id: "c" + Date.now(), name, dishes: [sheetDishId] }]); stamp(sheetDishId); };
  const createEmptyCollection = (name) => setCollections((cs) => [...cs, { id: "c" + Date.now(), name, dishes: [] }]);
  const goTab = (k) => { setTab(k); setScreen(k); };
  // dietary settings and taste live in the entry flow; open it at the right step and come back
  const editDiet = () => { setOb({ start: 1, back: screen === "onboarding" ? "feed" : screen }); setScreen("onboarding"); };
  const tuneTaste = () => { setOb({ start: 2, back: screen === "onboarding" ? "feed" : screen }); setScreen("onboarding"); };
  const leaveEntry = () => { const back = ob.back || "feed"; setScreen(back); if (["feed", "saved", "profile"].includes(back)) setTab(back); };

  const dir = t.direction;
  const showTabs = screen === "feed" || screen === "saved" || screen === "profile";

  // status bar: light text whenever a photo or dark bg sits under it
  const statusDark = dir === "charred" || screen === "feed" || screen === "detail" || screen === "restaurant" || (screen === "onboarding" && ob.start === 0);

  let content = null;
  if (screen === "onboarding") {
    content = <Onboarding prefs={prefs} start={ob.start} onCancel={leaveEntry}
      onComplete={(p) => { setPrefs({ picked: p.picked || [], lifestyle: p.lifestyle || null, allergies: p.allergies || [] }); leaveEntry(); }} />;
  } else if (screen === "detail" && dish) {
    content = <DetailScreen dish={dish} saved={saved} zoom={zoom} prefs={prefs} onBack={() => setScreen(returnTo === "detail" ? tab : returnTo)} onToggleSave={toggleSave} onOpen={openDish}
      onOpenRest={(name) => { setRestName(name); setScreen("restaurant"); }} />;
  } else if (screen === "restaurant" && restName) {
    content = <RestaurantScreen restName={restName} onBack={() => setScreen(dish ? "detail" : "feed")} onOpen={openDish} prefs={prefs} saved={saved} onToggleSave={toggleSave} />;
  } else if (screen === "search") {
    content = <SearchScreen onBack={() => setScreen("feed")} onOpen={openDish} gridCols={t.gridCols} prefs={prefs} onEditDiet={editDiet}
      filters={filters} onFilters={() => setFiltersOpen(true)} onClearFilters={() => setFilters(MORSEL_FILTER_DEFAULTS)}
      loc={loc} query={query} onQuery={setQuery} saved={saved} onToggleSave={toggleSave} />;
  } else if (screen === "collection" && col) {
    content = <CollectionScreen col={col} onBack={() => setScreen("saved")} onOpen={openDish} prefs={prefs} saved={saved} onToggleSave={toggleSave} />;
  } else if (screen === "saved") {
    content = <SavedScreen saved={saved} savedAt={savedAt} collections={collections} onOpen={openDish} onOpenCol={(c) => { setColId(c.id); setScreen("collection"); }} onCreateCol={createEmptyCollection} prefs={prefs} onToggleSave={toggleSave} />;
  } else if (screen === "profile") {
    content = <ProfileScreen prefs={prefs} saved={saved} collections={collections} loc={loc}
      onTuneTaste={tuneTaste} onEditDiet={editDiet} onOpenSaved={() => goTab("saved")} onOpenLocation={() => setLocOpen(true)} />;
  } else {
    content = <FeedScreen saved={saved} onOpen={openDish} onToggleSave={toggleSave} gridCols={t.gridCols} onSearch={() => setScreen("search")}
      filters={filters} onFilters={() => setFiltersOpen(true)} onClearFilters={() => setFilters(MORSEL_FILTER_DEFAULTS)}
      loc={loc} onLocation={() => setLocOpen(true)} prefs={prefs} onResetLoc={() => setLoc(null)} onEditDiet={editDiet} />;
  }

  const appStyle = { "--r": t.radius + "px", "--ts": (t.textScale || 100) / 100 };
  if (t.accent) { appStyle["--accent"] = t.accent; }
  const df = DISPLAY_FONTS[t.displayFont];
  if (df) {
    appStyle["--font-display"] = df.family;
    appStyle["--display-weight"] = df.weight;
  }

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <IOSDevice dark={statusDark}>
        <div className="morsel-app" data-dir={dir} style={appStyle} ref={appRef}>
          {content}
          <div role="status" aria-live="polite" style={{ position: "absolute", width: 1, height: 1, margin: -1, padding: 0, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap", border: 0 }}>{announce}</div>
          {saveToastId && !sheetDishId && (() => {
            const td = dishes.find((d) => d.id === saveToastId);
            return (
              <div className="m-rise" role="status" style={{ position: "absolute", left: 14, right: 14, bottom: 92, zIndex: 50, display: "flex", alignItems: "center", gap: 10, background: "var(--ink)", color: "var(--paper)", borderRadius: 18, padding: "10px 12px", boxShadow: "var(--shadow-float)" }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, overflow: "hidden", flex: "none" }}>
                  <img src={window.MorselData.u(td.img, 120)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ flex: 1, fontSize: 14, fontWeight: 700 }}>Saved</div>
                <button onClick={() => { setSheetDishId(saveToastId); setSaveToastId(null); window.clearTimeout(toastTimer.current); }}
                  style={{ flex: "none", fontSize: 13, fontWeight: 800, color: "var(--paper)", background: "rgba(255,255,255,.14)", borderRadius: 99, padding: "9px 14px", minHeight: 36 }}>
                  Add to collection
                </button>
              </div>
            );
          })()}
          {locOpen && (
            <LocationSheet loc={loc} onChange={setLoc} onClose={() => setLocOpen(false)} />
          )}
          {filtersOpen && (
            <FiltersSheet filters={filters} prefs={prefs} onChange={setFilters} onClose={() => setFiltersOpen(false)} />
          )}
          {sheetDishId && (
            <SaveSheet dish={dishes.find((d) => d.id === sheetDishId)} collections={collections}
              onToggle={toggleInCollection} onCreate={createCollection} onClose={() => setSheetDishId(null)} />
          )}
          {showTabs && (
            <div className="m-tabbar">
              <button className="m-tab" data-active={tab === "feed"} aria-label="Feed" aria-current={tab === "feed" ? "page" : undefined} onClick={() => goTab("feed")}><MIcon name="grid" size={21} /></button>
              <button className="m-tab" data-active={tab === "saved"} aria-label="Saved" aria-current={tab === "saved" ? "page" : undefined} onClick={() => goTab("saved")}><MIcon name="heart" size={21} /></button>
              <button className="m-tab" data-active={tab === "profile"} aria-label="Profile" aria-current={tab === "profile" ? "page" : undefined} onClick={() => goTab("profile")}><MIcon name="user" size={21} /></button>
            </div>
          )}
        </div>
      </IOSDevice>

      <details className="m-demo-controls" style={{fontFamily:"system-ui, sans-serif",fontSize:13,maxWidth:402,marginTop:16,color:"#34291f"}}>
        <summary style={{cursor:"pointer",padding:12}}>Prototype controls · simulated states</summary>
        <div style={{display:"flex",flexDirection:"column",gap:10,padding:12}}>
          <label>Scenario <select value={t.sim} onChange={(e)=>setTweak("sim",e.target.value)} style={{padding:8}}>
            <option value="none">Normal</option><option value="loading">Feed loading</option><option value="offline">Offline</option><option value="imgfail">Images unavailable</option><option value="handoff">Menu link fails to open</option>
          </select></label>
          <button style={{padding:10}} onClick={()=>{localStorage.removeItem(MORSEL_STATE_KEY);window.location.reload();}}>Reset prototype and replay the entry flow</button>
        </div>
      </details>
      <TweaksPanel>
        <TweakSection label="Direction" />
        <TweakSelect label="Visual direction" value={t.direction}
          options={[
            { value: "toast", label: DIR_LABELS.toast },
            { value: "saffron", label: DIR_LABELS.saffron },
            { value: "charred", label: DIR_LABELS.charred }
          ]}
          onChange={(v) => setTweak({ direction: v, accent: "", radius: v === "saffron" ? 14 : 22 })} />
        <TweakColor label="Accent override" value={t.accent}
          options={["#C2492B", "#C97C1B", "#7A8450", "#A23E52"]}
          onChange={(v) => setTweak("accent", v)} />
        <TweakSelect label="Display face" value={t.displayFont}
          options={[
            { value: "", label: "Lora 600 — default" },
            { value: "instrument", label: DISPLAY_FONTS.instrument.label },
            { value: "sourceserif", label: DISPLAY_FONTS.sourceserif.label },
            { value: "bitter", label: DISPLAY_FONTS.bitter.label },
            { value: "hanken700", label: DISPLAY_FONTS.hanken700.label }
          ]}
          onChange={(v) => setTweak("displayFont", v)} />
        <TweakSection label="Feed" />
        <TweakRadio label="Grid density" value={String(t.gridCols)} options={["2", "3"]}
          onChange={(v) => setTweak("gridCols", Number(v))} />
        <TweakSlider label="Corner radius" value={t.radius} min={6} max={28} unit="px"
          onChange={(v) => setTweak("radius", v)} />
        <TweakSection label="Prototype states" />
        <TweakSelect label="Simulate" value={t.sim}
          options={[
            { value: "none", label: "None — normal" },
            { value: "loading", label: "Feed loading" },
            { value: "offline", label: "Offline" },
            { value: "imgfail", label: "Images failing" },
            { value: "handoff", label: "Menu link fails to open" }
          ]}
          onChange={(v) => setTweak("sim", v)} />
        <TweakSlider label="Text size" value={t.textScale} min={100} max={140} unit="%"
          onChange={(v) => setTweak("textScale", v)} />
        <TweakSection label="Flow" />
        <TweakButton label="Replay entry flow" onClick={() => { setOb({ start: 0, back: "feed" }); setScreen("onboarding"); }} />
        <TweakButton label="Clear saves" onClick={() => { setSaved(new Set()); setSavedAt({}); setCollections((cs) => cs.map((c) => ({ ...c, dishes: [] }))); }} />
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
      <div style={{ width: 402 * scale, height: 874 * scale + 190 }}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
          <MorselApp />
        </div>
      </div>
      <div style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 13, color: "#8A7A66", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", justifyContent: "center", padding: "0 16px" }}>
          <span style={{ fontWeight: 700, color: "#5C4B38" }}>Morsel</span>
          <span>Interactive prototype</span>
          <a href="../morsel-docs/wireflow.html" style={{ color: "#B0542F", fontWeight: 600 }}>wireflow →</a>
          <a href="../morsel-docs/explorations.html" style={{ color: "#B0542F", fontWeight: 600 }}>explorations →</a>
          <a href="../morsel-docs/ds-addendum.html" style={{ color: "#B0542F", fontWeight: 600 }}>ds addendum →</a>
          <a href="../morsel.html" style={{ color: "#B0542F", fontWeight: 600 }}>case study →</a>
        </div>
        <div style={{ fontSize: 12, maxWidth: 560, textAlign: "center" }}>Interactive concept with fictional restaurants and sample menu data. Links and calls are simulated; no orders are placed.</div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<MorselPage />);
