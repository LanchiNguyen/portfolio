// Morsel — the restaurant's menu, in its own order, with photos where they exist.
//   Menu view    every dish, section by section; unphotographed dishes keep their place
//   Photos view  only photographed dishes, with the count of what it leaves out
function CompareToggle({ dish, shortlist, onToggle, full }) {
  const on = shortlist.includes(dish.id);
  const blocked = !on && full;
  return (
    <button className="m-row-compare" aria-pressed={on} aria-label={(on ? "Remove " : "Add ") + dish.name + (on ? " from compare" : " to compare")}
      title={blocked ? "Compare holds " + window.MorselData.compareMax + " dishes" : undefined}
      onClick={(e) => { e.stopPropagation(); onToggle(dish.id); }}>
      <MIcon name={on ? "check" : "plus"} size={20} />
    </button>
  );
}

function DishRow({ dish, shortlist, onOpen, onToggle, full }) {
  const { price, photoNote } = window.MorselData;
  return (
    <div className="m-row" data-dish-id={dish.id}>
      <button className="m-row-open" onClick={(e) => onOpen(dish.id, e)} aria-label={dish.name + ", " + price(dish) + ", " + photoNote(dish)}>
        <Thumb dish={dish} />
        <div className="m-row-text">
          <span className="m-row-name">{dish.name}</span>
          <span className="m-row-desc m-caption">{dish.desc}</span>
          <span className="m-row-price m-second">{price(dish)}</span>
        </div>
      </button>
      <CompareToggle dish={dish} shortlist={shortlist} onToggle={onToggle} full={full} />
    </div>
  );
}

function PhotoCard({ dish, onOpen }) {
  const { u, price, sourceLabel } = window.MorselData;
  const p = dish.photos[0];
  return (
    <div className="m-card" data-dish-id={dish.id}>
      <button className="m-card-open" onClick={(e) => onOpen(dish.id, e)} aria-label={dish.name + ", " + price(dish)}>
        <div className="m-card-photo" style={{ aspectRatio: "1 / 1" }}>
          <img src={u(p.img, 500)} alt="" />
          <span className="m-tag" data-tone="photo" style={{ position: "absolute", left: 8, bottom: 8 }}>{dish.photos.length > 1 ? dish.photos.length + " photos" : sourceLabel(p.source)}</span>
        </div>
        <div className="m-card-text">
          <span className="m-card-name">{dish.name}</span>
          <span className="m-caption" style={{ color: "var(--ink-2)" }}>{price(dish)}</span>
        </div>
      </button>
    </div>
  );
}

function MenuScreen({ restId, view, setView, shortlist, onToggle, onOpen, onCompare, onBack, sim }) {
  const { restaurant, menu, coverage, compareMax, dish } = window.MorselData;
  const r = restaurant(restId);
  const sections = menu(restId);
  const cov = coverage(restId);
  const full = shortlist.length >= compareMax;
  const [scrollRef, onScroll] = useScrollMemo("menu-" + restId + "-" + view);
  const [toast, setToast] = React.useState("");
  const toastTimer = React.useRef(null);
  const toggle = (id) => {
    const before = shortlist.includes(id);
    const res = onToggle(id);
    const d = dish(id);
    const msg = !res.ok ? "Compare holds " + compareMax + " dishes. Remove one first." : before ? d.name + " removed from compare" : d.name + " added to compare";
    setToast(msg); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(""), 2200);
  };
  const jump = (sid) => {
    const el = scrollRef.current && scrollRef.current.querySelector('[data-section="' + sid + '"]');
    if (el) el.scrollIntoView({ block: "start", behavior: "smooth" });
  };
  const photographed = sections.flatMap((s) => s.dishes).filter((d) => d.photos.length);
  const missing = cov.total - cov.photographed;

  return (
    <div className="m-screen m-fade">
      <div className="m-topbar" style={{ paddingTop: 54 }}>
        <button className="m-iconbtn" aria-label="Back to restaurants" onClick={onBack}><MIcon name="back" /></button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="m-heading" style={{ overflowWrap: "anywhere" }}>{r.name}</h1>
          <div className="m-caption" style={{ color: "var(--ink-2)" }}>{r.hood} · {cov.photographed} of {cov.total} dishes have photos</div>
        </div>
        <div className="m-seg" role="group" aria-label="Menu view">
          <button aria-pressed={view === "menu"} onClick={() => setView("menu")}>Menu</button>
          <button aria-pressed={view === "photos"} onClick={() => setView("photos")}>Photos</button>
        </div>
      </div>
      {view === "menu" && (
        <div className="m-jump" role="navigation" aria-label="Menu sections">
          {sections.map((s) => <button key={s.id} className="m-chip" onClick={() => jump(s.id)}>{s.name}</button>)}
        </div>
      )}
      <div className="m-scroll" ref={scrollRef} onScroll={onScroll}>
        {view === "menu" ? sections.map((s) => (
          <section key={s.id} data-section={s.id} aria-label={s.name}>
            <div className="m-section">
              <h2>{s.name}</h2>
              <div className="m-caption" style={{ color: "var(--ink-3)" }}>{s.dishes.filter((d) => d.photos.length).length} of {s.dishes.length} with photos</div>
            </div>
            <div className="m-rows">
              {s.dishes.map((d) => <DishRow key={d.id} dish={d} shortlist={shortlist} onOpen={onOpen} onToggle={toggle} full={full} />)}
            </div>
          </section>
        )) : (
          <div>
            <div className="m-note m-caption" style={{ marginTop: 12 }}>
              Photos of {cov.photographed} dishes. {missing} {missing === 1 ? "dish has" : "dishes have"} no photo yet and {missing === 1 ? "is" : "are"} only in the menu view.
              {" "}<button style={{ fontWeight: 700, color: "var(--accent)", textDecoration: "underline" }} onClick={() => setView("menu")}>Show the full menu</button>
            </div>
            <div className="m-photo-grid">
              {photographed.map((d) => <PhotoCard key={d.id} dish={d} onOpen={onOpen} />)}
            </div>
          </div>
        )}
        <div style={{ height: 120 }} />
      </div>
      <div aria-live="polite" className="m-caption" style={{ position: "absolute", left: 16, right: 16, bottom: 92, textAlign: "center", pointerEvents: "none" }}>
        {toast && <span className="m-tag" data-tone="on" style={{ whiteSpace: "normal", padding: "8px 14px" }}>{toast}</span>}
      </div>
      {shortlist.length > 0 && (
        <div className="m-comparebar">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="m-caption" style={{ fontWeight: 700 }}>{shortlist.length} of {compareMax} to compare</div>
            <div className="m-caption" style={{ color: "rgba(255,255,255,0.7)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{shortlist.map((id) => dish(id).name).join(" · ")}</div>
          </div>
          <button className="m-btn m-btn-primary" onClick={onCompare}>Compare</button>
        </div>
      )}
    </div>
  );
}
