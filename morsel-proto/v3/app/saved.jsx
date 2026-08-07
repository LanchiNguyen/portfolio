// Morsel v3 — saved & collections. Saves are never auto-deleted by dietary
// changes; conflicts are kept and warned instead.
function CollectionCover({ col, onOpenCol }) {
  const { u, dishes } = window.MorselData;
  const imgs = col.dishes.map((id) => dishes.find((d) => d.id === id)).filter(Boolean);
  return (
    <button onClick={() => onOpenCol(col)} style={{ display: "flex", flexDirection: "column", gap: 7, textAlign: "left", flex: "none", width: 124 }}>
      {imgs.length ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 2, borderRadius: "calc(var(--r) * 0.8)", overflow: "hidden", aspectRatio: "1", width: "100%" }}>
          {imgs.slice(0, 4).map((d, i) => (
            <div key={d.id + i} style={{ position: "relative", overflow: "hidden", background: "var(--sunken)" }}>
              <img src={u(d.img, 160)} alt={d.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ borderRadius: "calc(var(--r) * 0.8)", aspectRatio: "1", width: "100%", border: "1.5px dashed var(--ink-3)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-3)" }}>
          <MIcon name="plus" size={20} />
        </div>
      )}
      <div>
        <div className="m-caption" style={{ fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{col.name}</div>
        <div className="m-caption" style={{ color: "var(--ink-3)", fontSize: "calc(12px * var(--ts))" }}>{col.dishes.length ? col.dishes.length + " dishes" : "empty — file a save"}</div>
      </div>
    </button>
  );
}

function SavedScreen({ saved, collections, onOpen, onOpenCol, onCreateCol, conflictsOf, locOff }) {
  const { dishes } = window.MorselData;
  const cols = collections || window.MorselData.collections;
  const [sort, setSort] = React.useState("recent");
  const [creating, setCreating] = React.useState(false);
  const [name, setName] = React.useState("");
  const [nameErr, setNameErr] = React.useState(false);
  // v3.1: "Nearest" needs a real or manual location — fall back to Recent
  React.useEffect(() => { if (locOff && sort === "nearest") setSort("recent"); }, [locOff]);
  let savedDishes = dishes.filter((d) => saved.has(d.id));
  if (sort === "nearest") savedDishes = [...savedDishes].sort((a, b) => parseFloat(a.dist) - parseFloat(b.dist));
  const conflicted = conflictsOf ? savedDishes.filter((d) => conflictsOf(d).length > 0) : [];
  const create = () => {
    const n = name.trim();
    if (!n) { setNameErr(true); return; }
    onCreateCol(n); setName(""); setNameErr(false); setCreating(false);
  };
  return (
    <div className="m-screen m-fade" style={{ background: "var(--paper)" }}>
      <div style={{ padding: "64px 16px 6px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div className="m-display" style={{ fontSize: "calc(32px * var(--ts))" }}>Saved</div>
        <button className="m-btn m-btn-quiet" style={{ minHeight: 44, width: 44, padding: 0 }} aria-label="New collection" aria-expanded={creating} onClick={() => { setCreating(!creating); setNameErr(false); }}>
          <MIcon name="plus" size={18} />
        </button>
      </div>
      <div className="m-scroll" style={{ padding: "10px 0 120px" }}>
        {creating && (
          <div style={{ padding: "2px 16px 14px" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input autoFocus value={name} onChange={(e) => { setName(e.target.value); if (e.target.value.trim()) setNameErr(false); }}
                onKeyDown={(e) => { if (e.key === "Enter") create(); }}
                aria-label="Collection name" aria-invalid={nameErr}
                placeholder="Name a collection — e.g. Rainy day ramen"
                style={{ flex: 1, minWidth: 0, border: nameErr ? "1.5px solid var(--accent)" : "1.5px solid transparent", outline: "none", background: "var(--sunken)", borderRadius: 12, padding: "12px 14px", font: "inherit", fontSize: "calc(15px * var(--ts))", color: "var(--ink)" }} />
              <button className="m-btn m-btn-primary" disabled={!name.trim()} style={{ minHeight: 44, padding: "0 18px", fontSize: "calc(14px * var(--ts))" }} onClick={create}>Create</button>
            </div>
            {nameErr && <div className="m-caption" role="alert" style={{ color: "var(--accent)", fontWeight: 700, marginTop: 6 }}>Give the collection a name first.</div>}
          </div>
        )}
        {cols.length > 0 && (
          <div style={{ display: "flex", gap: 12, overflowX: "auto", scrollbarWidth: "none", padding: "0 16px 20px" }}>
            {cols.map((c) => <CollectionCover key={c.id} col={c} onOpenCol={onOpenCol} />)}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, padding: "0 16px" }}>
          <div className="m-heading" style={{ whiteSpace: "nowrap" }}>All saves</div>
          {savedDishes.length > 1 && (
            <div role="radiogroup" aria-label="Sort saves" style={{ display: "flex", gap: 2, background: "var(--sunken)", borderRadius: 99, padding: 3 }}>
              {[{ k: "recent", l: "Recent" }, { k: "nearest", l: "Nearest" }].map((o) => {
                const off = o.k === "nearest" && locOff;
                return (
                <button key={o.k} onClick={() => setSort(o.k)} role="radio" aria-checked={sort === o.k} disabled={off}
                  title={off ? "Needs a location — set one from the feed header" : undefined}
                  style={{ borderRadius: 99, padding: "6px 14px", fontSize: "calc(13px * var(--ts))", fontWeight: 700, minHeight: 30,
                    background: sort === o.k ? "var(--surface)" : "transparent",
                    color: sort === o.k ? "var(--ink)" : "var(--ink-3)",
                    opacity: off ? 0.4 : 1,
                    boxShadow: sort === o.k ? "0 1px 3px rgba(20,12,5,.12)" : "none",
                    transition: "all .15s ease" }}>{o.l}</button>
                );
              })}
            </div>
          )}
        </div>
        {locOff && savedDishes.length > 1 && (
          <div className="m-caption" style={{ color: "var(--ink-3)", padding: "0 16px 12px", marginTop: -6 }}>
            Nearest is off while location is unavailable — set a location from the feed header to enable it.
          </div>
        )}
        {conflicted.length > 0 && (
          <div className="m-caption" style={{ color: "var(--ink-2)", padding: "0 16px 12px" }}>
            <span style={{ color: "var(--accent)", fontWeight: 800 }}>! </span>
            {conflicted.length} save{conflicted.length === 1 ? "" : "s"} conflict with your allergy settings — kept and flagged, never auto-deleted.
          </div>
        )}
        {savedDishes.length ? (
          <FeedGrid dishes={savedDishes} cols={2} onOpen={onOpen}
            label={sort === "nearest" ? ((d) => d.dist) : null}
            flag={conflictsOf} />
        ) : (
          <div style={{ margin: "0 16px", borderRadius: "var(--r)", background: "var(--sunken)", padding: "28px 24px", textAlign: "center" }}>
            <div style={{ color: "var(--accent)", display: "flex", justifyContent: "center", marginBottom: 10 }}><MIcon name="heart" size={28} /></div>
            <div className="m-second" style={{ fontWeight: 700, marginBottom: 4 }}>Nothing saved yet</div>
            <div className="m-caption" style={{ color: "var(--ink-2)" }}>Tap the heart on any dish that makes you stop scrolling.</div>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { SavedScreen });
