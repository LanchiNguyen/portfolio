// Morsel v3 — app shell: navigation, saves, dietary tiers, sim states, tweaks.
const MORSEL_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "direction": "toast",
  "accent": "",
  "radius": 22,
  "gridCols": 2,
  "popTag": "saves",
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

function loadMorselState() {
  // v3 uses a fresh key — prefs gained locDenied, loc gained coverage semantics
  try { return JSON.parse(localStorage.getItem("morsel3_state")) || {}; } catch (e) { return {}; }
}

function MorselApp() {
  const [t, setTweak] = useTweaks(MORSEL_TWEAK_DEFAULTS);
  const init = React.useMemo(loadMorselState, []);
  const [screen, setScreen] = React.useState(init.screen || "onboarding");
  const [dishId, setDishId] = React.useState(init.dishId || null);
  const [collections, setCollections] = React.useState(() => init.collections || window.MorselData.collections);
  // saved is the master set: anything filed in a collection is, by definition, saved
  const [saved, setSaved] = React.useState(() => {
    const base = new Set(init.saved || ["d08", "d01"]);
    (init.collections || window.MorselData.collections).forEach((c) => c.dishes.forEach((id) => base.add(id)));
    return base;
  });
  const [sheetDishId, setSheetDishId] = React.useState(null);
  const [saveToastId, setSaveToastId] = React.useState(null);
  const [announce, setAnnounce] = React.useState(""); // SR live region for save/unsave
  const toastTimer = React.useRef(null);
  const [tab, setTab] = React.useState(init.tab || "feed");
  const [prefs, setPrefs] = React.useState(init.prefs || null);
  const [colId, setColId] = React.useState(init.colId || null);
  const [restName, setRestName] = React.useState(init.restName || null);
  const [returnTo, setReturnTo] = React.useState(init.returnTo || "feed");
  const [filters, setFilters] = React.useState(init.filters || MORSEL_FILTER_DEFAULTS);
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [loc, setLoc] = React.useState(() => (init.loc && typeof init.loc === "object") ? init.loc : null);
  const [locOpen, setLocOpen] = React.useState(false);
  const [locDenied, setLocDenied] = React.useState(!!init.locDenied);
  const appRef = React.useRef(null);
  const [zoom, setZoom] = React.useState(null);
  const zoomTimer = React.useRef(null);

  React.useEffect(() => {
    localStorage.setItem("morsel3_state", JSON.stringify({ screen, dishId, tab, saved: [...saved], collections, prefs, colId, restName, returnTo, filters, loc, locDenied }));
  }, [screen, dishId, tab, saved, collections, prefs, colId, restName, returnTo, filters, loc, locDenied]);

  // Simulated prototype states (driven from the Tweaks panel)
  window.MorselSim = {
    loading: t.sim === "loading",
    offline: t.sim === "offline",
    imgfail: t.sim === "imgfail",
    handoffFail: t.sim === "handoff"
  };

  // capture/debug hook — lets tooling drive the prototype deterministically
  React.useEffect(() => {
    window.morselDebug = { setScreen, setTab, setDishId, setPrefs, setFilters, setLoc, setLocDenied, setSheetDishId, setSaveToastId, setFiltersOpen, setLocOpen, setColId, setRestName, setTweak, setCollections,
      setSavedIds: (ids) => setSaved(new Set(ids)),
      openDish: (id) => { setDishId(id); setScreen("detail"); } };
  });

  const { dishes } = window.MorselData;
  const dish = dishes.find((d) => d.id === dishId);
  const col = collections.find((c) => c.id === colId);
  const openDish = (d, e) => {
    if (screen !== "detail") setReturnTo(screen);
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (e && e.currentTarget && appRef.current && !reduce) {
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
  const toggleSave = (id) => {
    if (saved.has(id)) {
      setSaved((s) => { const n = new Set(s); n.delete(id); return n; });
      setCollections((cs) => cs.map((c) => ({ ...c, dishes: c.dishes.filter((x) => x !== id) })));
      setAnnounce("Removed from saves");
    } else {
      setSaved((s) => new Set(s).add(id));
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
  };
  const createCollection = (name) => setCollections((cs) => [...cs, { id: "c" + Date.now(), name, dishes: [sheetDishId] }]);
  const createEmptyCollection = (name) => setCollections((cs) => [...cs, { id: "c" + Date.now(), name, dishes: [] }]);
  const goTab = (k) => { setTab(k); setScreen(k); };
  // allergy conflicts — shared across saved / collections / restaurant / detail
  const conflictsOf = (d) => ((prefs && prefs.allergies) || []).filter((a) => (d.allergens || []).includes(a.toLowerCase()));
  // deep-edit: reopen onboarding directly on the diet & safety step
  const editDiet = () => {
    setScreen("onboarding");
    window.setTimeout(() => { if (window.morselOb) window.morselOb.setStep(2); }, 60);
  };

  const dir = t.direction;
  const isDark = dir === "charred" || screen === "onboarding-welcome";
  const showTabs = screen === "feed" || screen === "saved" || screen === "profile";

  // status bar: light text whenever a photo or dark bg sits under it
  const statusDark = dir === "charred" || screen === "feed" || screen === "detail" || screen === "restaurant" || screen === "onboarding";

  let content = null;
  if (screen === "onboarding") {
    content = <Onboarding onComplete={(p) => { setPrefs(p); setLocDenied(!!p.locDenied); setScreen("feed"); setTab("feed"); }} />;
  } else if (screen === "detail" && dish) {
    content = <DetailScreen dish={dish} saved={saved} zoom={zoom} prefs={prefs} onBack={() => setScreen(returnTo === "detail" ? tab : returnTo)} onToggleSave={toggleSave} onOpen={openDish}
      onOpenRest={(name) => { setRestName(name); setScreen("restaurant"); }} />;
  } else if (screen === "restaurant" && restName) {
    content = <RestaurantScreen restName={restName} onBack={() => setScreen(dish ? "detail" : "feed")} onOpen={openDish} conflictsOf={conflictsOf} />;
  } else if (screen === "search") {
    content = <SearchScreen onBack={() => setScreen("feed")} onOpen={openDish} gridCols={t.gridCols} prefs={prefs} onEditDiet={editDiet} />;
  } else if (screen === "collection" && col) {
    content = <CollectionScreen col={col} onBack={() => setScreen("saved")} onOpen={openDish} conflictsOf={conflictsOf} />;
  } else if (screen === "saved") {
    content = <SavedScreen saved={saved} collections={collections} onOpen={openDish} onOpenCol={(c) => { setColId(c.id); setScreen("collection"); }} onCreateCol={createEmptyCollection} conflictsOf={conflictsOf} locOff={locDenied && !loc} />;
  } else if (screen === "profile") {
    content = <ProfileScreen prefs={prefs} saved={saved} collections={collections} loc={loc} locDenied={locDenied}
      onRecalibrate={() => setScreen("onboarding")} onEditDiet={editDiet} onOpenSaved={() => goTab("saved")} onOpenLocation={() => setLocOpen(true)} />;
  } else {
    content = <FeedScreen saved={saved} onOpen={openDish} onToggleSave={toggleSave} gridCols={t.gridCols} onSearch={() => setScreen("search")}
      filters={filters} onFilters={() => setFiltersOpen(true)} onClearFilters={() => setFilters(MORSEL_FILTER_DEFAULTS)}
      loc={loc} onLocation={() => setLocOpen(true)} popTag={t.popTag} prefs={prefs}
      locDenied={locDenied} onEnableLoc={() => setLocDenied(false)} onResetLoc={() => setLoc(null)} onEditDiet={editDiet} />;
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
        <TweakRadio label="Trending tag" value={t.popTag} options={["saves", "rank"]}
          onChange={(v) => setTweak("popTag", v)} />
        <TweakSlider label="Corner radius" value={t.radius} min={6} max={28} unit="px"
          onChange={(v) => setTweak("radius", v)} />
        <TweakSection label="Prototype states" />
        <TweakSelect label="Simulate" value={t.sim}
          options={[
            { value: "none", label: "None — normal" },
            { value: "loading", label: "Feed loading" },
            { value: "offline", label: "Offline" },
            { value: "imgfail", label: "Images failing" },
            { value: "handoff", label: "Order handoff fails" }
          ]}
          onChange={(v) => setTweak("sim", v)} />
        <TweakSlider label="Text size" value={t.textScale} min={100} max={140} unit="%"
          onChange={(v) => setTweak("textScale", v)} />
        <TweakSection label="Flow" />
        <TweakButton label="Replay onboarding" onClick={() => setScreen("onboarding")} />
        <TweakButton label="Clear saves" onClick={() => { setSaved(new Set()); setCollections((cs) => cs.map((c) => ({ ...c, dishes: [] }))); }} />
      </TweaksPanel>
    </div>
  );
}

// ---- page mount: phone centered + scaled to fit viewport ----
function MorselPage() {
  const [scale, setScale] = React.useState(1);
  React.useEffect(() => {
    const fit = () => setScale(Math.min(1, (window.innerHeight - 70) / 900));
    fit(); window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: "16px 0" }}>
      <div style={{ width: 402 * scale, height: 874 * scale }}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
          <MorselApp />
        </div>
      </div>
      <div style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 13, color: "#8A7A66", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center", whiteSpace: "nowrap" }}>
          <span style={{ fontWeight: 700, color: "#5C4B38" }}>Morsel v3</span>
          <span>final iteration</span>
          <a href="../morsel-docs/wireflow.html" style={{ color: "#B0542F", fontWeight: 600 }}>wireflow →</a>
          <a href="../morsel-docs/explorations.html" style={{ color: "#B0542F", fontWeight: 600 }}>explorations →</a>
          <a href="../morsel-docs/ds-addendum.html" style={{ color: "#B0542F", fontWeight: 600 }}>ds addendum →</a>
          <a href="../morsel.html" style={{ color: "#B0542F", fontWeight: 600 }}>v2 →</a>
        </div>
        <div style={{ fontSize: 12, maxWidth: 560, textAlign: "center" }}>Prototype: all diner counts, scores, save numbers, names, and quotes are illustrative seed data — not real customer evidence.</div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<MorselPage />);
