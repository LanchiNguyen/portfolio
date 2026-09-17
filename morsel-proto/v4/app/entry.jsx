// Morsel — restaurant entry: pick the place you're at. No location request;
// the list is short and filters as you type.
function EntryScreen({ onPick }) {
  const { restaurants, coverage } = window.MorselData;
  const [q, setQ] = React.useState("");
  const list = restaurants.filter((r) => (r.name + " " + r.hood + " " + r.kind).toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <div className="m-screen m-fade">
      <div style={{ padding: "58px 20px 0" }}>
        <div className="m-micro" style={{ color: "var(--accent)" }}>Morsel</div>
        <h1 className="m-title" style={{ marginTop: 8 }}>Which restaurant are you at?</h1>
        <p className="m-second" style={{ color: "var(--ink-2)", marginTop: 8 }}>Pick the place to see its menu with photos of the dishes.</p>
      </div>
      <label className="m-field" style={{ marginTop: 16 }}>
        <MIcon name="search" size={20} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Restaurant name or neighborhood" aria-label="Find a restaurant" size={8} />
        {q && <button className="m-caption" style={{ fontWeight: 700, color: "var(--ink-2)", padding: "6px 2px" }} onClick={() => setQ("")}>Clear</button>}
      </label>
      <div className="m-scroll">
        <div className="m-rest-list" role="list">
          {list.map((r) => {
            const c = r.visual ? coverage(r.id) : null;
            return (
              <button key={r.id} role="listitem" className="m-rest-row" data-rest-id={r.id} onClick={() => onPick(r.id)}>
                <div className="m-rest-text">
                  <span className="m-body" style={{ fontWeight: 700 }}>{r.name}</span>
                  <span className="m-caption" style={{ color: "var(--ink-2)" }}>{r.hood} · {r.kind}</span>
                  <span className="m-caption" style={{ color: c ? "var(--ink)" : "var(--ink-3)", fontWeight: 600, marginTop: 2 }}>
                    {c ? c.photographed + " of " + c.total + " dishes photographed" : "No menu photos yet"}
                  </span>
                </div>
                <MIcon name="next" size={20} />
              </button>
            );
          })}
          {!list.length && <p className="m-second" style={{ color: "var(--ink-2)", padding: "12px 4px" }}>No restaurant matches “{q.trim()}”.</p>}
        </div>
      </div>
    </div>
  );
}

// A restaurant the prototype has no menu for. Honest, and a way back.
function NoMenuScreen({ restId, onBack }) {
  const { restaurant } = window.MorselData;
  const r = restaurant(restId) || { name: "This restaurant", hood: "" };
  return (
    <div className="m-screen m-fade">
      <div className="m-topbar" style={{ paddingTop: 54 }}>
        <button className="m-iconbtn" aria-label="Back to restaurants" onClick={onBack}><MIcon name="back" /></button>
      </div>
      <div style={{ padding: "16px 20px" }}>
        <h1 className="m-heading">No menu photos for {r.name} yet.</h1>
        <p className="m-second" style={{ color: "var(--ink-2)", marginTop: 10 }}>This prototype has one restaurant's menu with photos. {r.name} would appear here once its menu and photos were added.</p>
        <div className="m-actions" style={{ padding: "22px 0 0" }}>
          <button className="m-btn m-btn-primary" onClick={onBack}>Choose another restaurant</button>
        </div>
      </div>
    </div>
  );
}
