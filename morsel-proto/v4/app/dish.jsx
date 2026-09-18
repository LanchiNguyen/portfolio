// Morsel — a dish: its photos with their source, then the menu's own words.
// A photo helps picture the food; it does not confirm ingredients or today's
// presentation. The page says so briefly, next to the ingredients line.
function PhotoStrip({ dish }) {
  const { u, sourceLabel } = window.MorselData;
  const [i, setI] = React.useState(0);
  const n = dish.photos.length;
  const touch = React.useRef(null);
  if (!n) {
    return (
      <div className="m-hero-wrap" style={{ paddingTop: 108 }}>
        <div className="m-nophoto m-hero-nophoto" role="img" aria-label="No photo yet for this dish">
          <MIcon name="cameraoff" size={26} />
          <span className="m-body" style={{ fontWeight: 700 }}>No photo yet</span>
          <span className="m-caption">The menu's description is below.</span>
        </div>
      </div>
    );
  }
  const p = dish.photos[i];
  const go = (d) => setI((x) => Math.min(n - 1, Math.max(0, x + d)));
  return (
    <div className="m-strip" role="group" aria-roledescription="photo carousel" aria-label={dish.name + " photos"}
      onKeyDown={(e) => { if (e.key === "ArrowRight") { e.preventDefault(); go(1); } else if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); } }}
      onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => { if (touch.current === null) return; const dx = e.changedTouches[0].clientX - touch.current; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); touch.current = null; }}>
      <img key={p.img} src={u(p.img, 900)} alt={dish.name + ", " + sourceLabel(p.source).toLowerCase()} />
      <div className="m-veil" />
      {n > 1 && i > 0 && <button className="m-glass m-glass-icon m-strip-nav" style={{ left: 12 }} aria-label="Previous photo" onClick={() => go(-1)}><MIcon name="back" size={20} /></button>}
      {n > 1 && i < n - 1 && <button className="m-glass m-glass-icon m-strip-nav" style={{ right: 12 }} aria-label="Next photo" onClick={() => go(1)}><MIcon name="next" size={20} /></button>}
      <div className="m-strip-foot">
        <span className="m-glass" style={{ padding: "6px 12px" }}>{sourceLabel(p.source)}</span>
        {n > 1 && <span className="m-glass" style={{ padding: "6px 12px", gap: 8 }} aria-live="polite"><span className="m-dots" aria-hidden="true">{dish.photos.map((_, k) => <span key={k} data-on={k === i} />)}</span><span>{i + 1} of {n}</span></span>}
      </div>
    </div>
  );
}

function DishScreen({ dishId, shortlist, onToggle, onBack, onCompare, onMenu, backLabel, fromMenu }) {
  const { dish, price, ingredientsLine, sections, compareMax, sourceLabel, restaurant, dist } = window.MorselData;
  const d = dish(dishId);
  const r = restaurant(d.rest);
  const section = sections.find((s) => s.id === d.section);
  const on = shortlist.includes(d.id);
  const full = !on && shortlist.length >= compareMax;
  const diners = d.photos.filter((p) => p.source === "diner").length;
  const rests = d.photos.length - diners;
  const photoLine = !d.photos.length ? "No photo yet. Neither the restaurant nor a diner has added one."
    : d.photos.length === 1 ? sourceLabel(d.photos[0].source) + "."
    : d.photos.length + " photos: " + (rests ? rests + " from the restaurant" : "") + (rests && diners ? ", " : "") + (diners ? diners + " from " + (diners === 1 ? "a diner" : "diners") : "") + ".";
  return (
    <div className="m-screen m-fade">
      <div className="m-scroll">
        <div style={{ position: "relative" }}>
          <PhotoStrip dish={d} />
          <button className="m-glass m-glass-icon m-strip-back" style={{ position: "absolute", left: 12, top: 56 }} aria-label={backLabel} onClick={onBack}><MIcon name="back" size={20} /></button>
        </div>
        <div style={{ padding: "18px 16px 0" }}>
          <div className="m-micro" style={{ color: "var(--accent)" }}>{r.name}{section ? " · " + section.name : ""}</div>
          <h1 className="m-title" style={{ marginTop: 6 }}>{d.name}</h1>
          <div className="m-heading" style={{ marginTop: 6 }}>{price(d)}</div>
          <div className="m-caption" style={{ color: "var(--ink-2)", marginTop: 4 }}>{r.hood} · {dist(d.rest)}</div>
          <p className="m-body" style={{ marginTop: 12 }}>{d.desc}</p>
        </div>
        <div className="m-facts">
          <div className="m-fact"><span className="k">Photos</span><span className="v">{photoLine}<small>Appearance can vary between visits.</small></span></div>
          <div className="m-fact"><span className="k">Ingredients</span><span className="v">{ingredientsLine(d)}<small>Covers nuts, gluten, dairy and shellfish only, not preparation or cross-contact. Ask your server.</small></span></div>
        </div>
        <div className="m-actions">
          <button className="m-btn m-btn-primary" aria-pressed={on} disabled={full} onClick={() => onToggle(d.id)}>
            <MIcon name={on ? "check" : "plus"} size={20} />{on ? "In compare · remove" : "Add to compare"}
          </button>
          {full && <p className="m-caption" style={{ color: "var(--ink-2)", textAlign: "center" }}>Compare holds {compareMax} dishes. Remove one to add this.</p>}
          {!fromMenu && <button className="m-btn m-btn-quiet" onClick={onMenu}>{r.menu === "full" ? "View the full menu" : "View " + r.name + "'s dishes"}</button>}
          {shortlist.length > 0 && <button className="m-btn m-btn-quiet" onClick={onCompare}>Compare {shortlist.length} {shortlist.length === 1 ? "dish" : "dishes"}</button>}
          <button className="m-btn m-btn-quiet" onClick={onBack}>{backLabel}</button>
        </div>
      </div>
    </div>
  );
}
