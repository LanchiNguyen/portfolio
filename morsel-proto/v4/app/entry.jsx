// Morsel — "I'm at a restaurant": pick the place from photo cards. No location
// request; the list filters as you type. Places without photos stay listed,
// smaller and plainly labeled, so nobody navigates into an empty menu.
function PickerScreen({ onPick, onBack }) {
  const { restaurants, u, dishes, coverageLabel } = window.MorselData;
  const [q, setQ] = React.useState("");
  const match = (r) => (r.name + " " + r.hood + " " + r.kind).toLowerCase().includes(q.trim().toLowerCase());
  const withPhotos = restaurants.filter((r) => r.menu !== "none" && match(r)).sort((a, b) => a.mi - b.mi);
  const without = restaurants.filter((r) => r.menu === "none" && match(r)).sort((a, b) => a.mi - b.mi);
  return (
    <div className="m-screen m-fade">
      <div className="m-topbar" style={{ paddingTop: 54 }}>
        <button className="m-iconbtn" aria-label="Back" onClick={onBack}><MIcon name="back" /></button>
        <h1 className="m-heading" style={{ flex: 1 }}>Which restaurant are you at?</h1>
      </div>
      <label className="m-field" style={{ marginTop: 6 }}>
        <MIcon name="search" size={20} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or neighborhood" aria-label="Find a restaurant" size={8} />
        {q && <button className="m-caption" style={{ fontWeight: 700, color: "var(--ink-2)", padding: "6px 2px" }} onClick={() => setQ("")}>Clear</button>}
      </label>
      <div className="m-scroll">
        <div className="m-pick-list" role="list">
          {withPhotos.map((r) => {
            const thumbs = dishes.filter((d) => d.rest === r.id && d.photos.length).slice(0, 3);
            return (
              <button key={r.id} role="listitem" className="m-pick" data-rest-id={r.id} onClick={() => onPick(r.id)} aria-label={r.name + ", " + r.hood + ", " + coverageLabel(r.id)}>
                <div className="m-pick-strip" aria-hidden="true">{thumbs.map((d) => <img key={d.id} src={u(d.photos[0].img, 300)} alt="" />)}</div>
                <div className="m-pick-text">
                  <span className="m-row-name">{r.name}</span>
                  <span className="m-caption" style={{ color: "var(--ink-2)" }}>{r.hood} · {r.kind}</span>
                  <span className="m-tag" data-tone={r.menu === "full" ? "on" : undefined} style={{ alignSelf: "flex-start", marginTop: 4 }}>{coverageLabel(r.id)}</span>
                </div>
                <MIcon name="next" size={20} />
              </button>
            );
          })}
          {without.length > 0 && (
            <div className="m-caption" style={{ color: "var(--ink-3)", padding: "10px 4px 0", fontWeight: 700 }}>No menu photos yet</div>
          )}
          {without.map((r) => {
            const label = r.name + ", " + r.hood + ". No menu photos yet.";
            return (
              <div key={r.id} role="listitem" className="m-pick m-pick-none" aria-label={label}>
                <div className="m-pick-text">
                  <span className="m-second" style={{ fontWeight: 700, color: "var(--ink-2)" }}>{r.name}</span>
                  <span className="m-caption" style={{ color: "var(--ink-3)" }}>{r.hood} · {r.kind}</span>
                </div>
              </div>
            );
          })}
          {!withPhotos.length && !without.length && <p className="m-second" style={{ color: "var(--ink-2)", padding: "12px 4px" }}>No restaurant matches “{q.trim()}”.</p>}
        </div>
        <div style={{ height: 110 }} />
      </div>
    </div>
  );
}
