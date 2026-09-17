// Morsel — compare: the shortlisted dishes side by side, one column each.
// A way to decide, not a cart: nothing here is ordered.
function CompareScreen({ shortlist, onRemove, onOpen, onBack, onAdd }) {
  const { dish, price, ingredientsLine, compareMax, u, restaurant } = window.MorselData;
  const items = shortlist.map(dish).filter(Boolean);
  const cols = Math.max(1, items.length);
  return (
    <div className="m-screen m-fade">
      <div className="m-topbar" style={{ paddingTop: 54 }}>
        <button className="m-iconbtn" aria-label="Back" onClick={onBack}><MIcon name="back" /></button>
        <div style={{ flex: 1 }}>
          <h1 className="m-heading">Compare</h1>
          <div className="m-caption" style={{ color: "var(--ink-2)" }}>{items.length} of {compareMax} dishes</div>
        </div>
      </div>
      <div className="m-scroll">
        {!items.length && <p className="m-second m-note">Nothing to compare yet. Add up to {compareMax} dishes from a menu or a dish page, and they will sit side by side here.</p>}
        <div className="m-compare-grid" data-n={items.length} style={{ gridTemplateColumns: "repeat(" + cols + ", minmax(0, 1fr))" }}>
          {items.map((d) => {
            const p = d.photos[0];
            return (
              <div key={d.id} className="m-col" data-dish-id={d.id}>
                <button className="m-card-open" onClick={(e) => onOpen(d.id, e)} aria-label={"Open " + d.name}>
                  {p ? (
                    <div className="m-thumb" style={{ width: "100%", height: "auto" }}>
                      <img src={u(p.img, 400)} alt="" />
                      <span className="m-tag" data-tone="photo">{shortSource(d)}</span>
                    </div>
                  ) : (
                    <div className="m-nophoto" aria-hidden="true"><MIcon name="cameraoff" size={18} /><span className="m-caption">No photo yet</span></div>
                  )}
                  <div className="m-col-name" style={{ marginTop: 8 }}>{d.name}</div>
                  <div className="m-caption" style={{ color: "var(--ink-2)" }}>{restaurant(d.rest).name}</div>
                  <div className="m-second" style={{ fontWeight: 700 }}>{price(d)}</div>
                </button>
                <div className="m-caption" style={{ color: "var(--ink-2)" }}>{d.desc}</div>
                <div className="m-caption" style={{ color: "var(--ink-2)" }}>{ingredientsLine(d)}</div>
                <button className="m-btn m-btn-quiet" style={{ marginTop: "auto" }} aria-label={"Remove " + d.name + " from compare"} onClick={() => onRemove(d.id)}><MIcon name="close" size={16} />Remove</button>
              </div>
            );
          })}
        </div>
        <div className="m-actions">
          <button className="m-btn m-btn-primary" onClick={onAdd}>{!items.length ? "Go to the menu" : items.length < compareMax ? "Add another from the menu" : "Back to the menu"}</button>
        </div>

      </div>
    </div>
  );
}
