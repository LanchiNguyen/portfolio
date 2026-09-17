// Morsel — compare: two or three shortlisted dishes side by side. A way to
// decide, not a cart: nothing here is ordered.
function CompareScreen({ shortlist, onRemove, onOpen, onBack }) {
  const { dish, price, ingredientsLine, compareMax, sourceLabel, u } = window.MorselData;
  const items = shortlist.map(dish).filter(Boolean);
  const cols = Math.min(compareMax, Math.max(2, items.length + (items.length < compareMax ? 1 : 0)));
  return (
    <div className="m-screen m-fade">
      <div className="m-topbar" style={{ paddingTop: 54 }}>
        <button className="m-iconbtn" aria-label="Back to menu" onClick={onBack}><MIcon name="back" /></button>
        <div style={{ flex: 1 }}>
          <h1 className="m-heading">Compare</h1>
          <div className="m-caption" style={{ color: "var(--ink-2)" }}>{items.length} of {compareMax} dishes · a shortlist, not an order</div>
        </div>
      </div>
      <div className="m-scroll">
        {!items.length && <p className="m-second m-note">Nothing to compare yet. Add dishes from the menu.</p>}
        <div className="m-compare-grid" style={{ gridTemplateColumns: "repeat(" + cols + ", minmax(0, 1fr))" }}>
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
                  <div className="m-second" style={{ fontWeight: 700 }}>{price(d)}</div>
                </button>
                <div className="m-caption" style={{ color: "var(--ink-2)" }}>{d.desc}</div>
                <div className="m-caption" style={{ color: "var(--ink-2)" }}>{ingredientsLine(d)}</div>
                <button className="m-btn m-btn-quiet" style={{ marginTop: "auto" }} aria-label={"Remove " + d.name + " from compare"} onClick={() => onRemove(d.id)}><MIcon name="close" size={16} />Remove</button>
              </div>
            );
          })}
          {items.length < compareMax && (
            <button className="m-col-add" onClick={onBack}>
              <MIcon name="plus" size={22} />
              <span className="m-caption" style={{ fontWeight: 700 }}>Add another from the menu</span>
            </button>
          )}
        </div>
        <p className="m-note m-caption">Prices and descriptions are the menu's. Photos show one visit's plating and don't show ingredients or portion size.</p>
        <div className="m-actions">
          <button className="m-btn m-btn-primary" onClick={onBack}>Back to menu</button>
        </div>
      </div>
    </div>
  );
}
