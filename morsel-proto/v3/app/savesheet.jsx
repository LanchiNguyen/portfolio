// Morsel — save-to-collection bottom sheet (appears after hearting a dish)
function SaveSheet({ dish, collections, onToggle, onCreate, onClose }) {
  const { u, dishes } = window.MorselData;
  const [naming, setNaming] = React.useState(false);
  const [name, setName] = React.useState("");
  const [nameErr, setNameErr] = React.useState(false);
  const coverOf = (c) => {
    const first = dishes.find((d) => d.id === c.dishes[0]);
    return first ? u(first.img, 160) : null;
  };
  const create = () => {
    const n = name.trim();
    if (!n) { setNameErr(true); return; }
    onCreate(n); setName(""); setNameErr(false); setNaming(false);
  };
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 60, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <button aria-label="Close" onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(15,9,4,.45)", cursor: "pointer" }}></button>
      <div className="m-rise" style={{ position: "relative", background: "var(--surface)", borderRadius: "calc(var(--r) + 4px) calc(var(--r) + 4px) 0 0", padding: "10px 20px 28px", boxShadow: "var(--shadow-float)" }}>
        <div style={{ width: 36, height: 4, borderRadius: 99, background: "var(--line)", margin: "0 auto 14px" }}></div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <div style={{ width: 46, height: 46, borderRadius: 14, overflow: "hidden", flex: "none", background: "var(--sunken)" }}>
            <img src={u(dish.img, 160)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="m-second" style={{ fontWeight: 800 }}>Saved</div>
            <div className="m-caption" style={{ color: "var(--ink-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{dish.name} · {dish.rest}</div>
          </div>
          <div style={{ color: "var(--accent)", flex: "none" }}><MIcon name="heart" size={22} filled={true} /></div>
        </div>

        <div className="m-micro" style={{ color: "var(--ink-3)", marginBottom: 10 }}>Add to a collection</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 14 }}>
          {collections.map((c) => {
            const on = c.dishes.includes(dish.id);
            return (
              <button key={c.id} onClick={() => onToggle(c.id)} aria-pressed={on} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 6px", borderRadius: 14, minHeight: 52 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, overflow: "hidden", flex: "none", background: "var(--sunken)" }}>
                  {coverOf(c) && <img src={coverOf(c)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                  <div className="m-second" style={{ fontWeight: 700 }}>{c.name}</div>
                  <div className="m-caption" style={{ color: "var(--ink-3)" }}>{c.dishes.length} dish{c.dishes.length === 1 ? "" : "es"}</div>
                </div>
                <div style={{ width: 26, height: 26, borderRadius: 99, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", background: on ? "var(--accent)" : "transparent", border: on ? "none" : "1.5px solid var(--line)", color: "var(--accent-ink)", transition: "all .15s ease" }}>
                  {on && <MIcon name="check" size={14} />}
                </div>
              </button>
            );
          })}

          {naming ? (
            <div style={{ padding: "8px 6px" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input autoFocus value={name} onChange={(e) => { setName(e.target.value); if (e.target.value.trim()) setNameErr(false); }}
                  onKeyDown={(e) => { if (e.key === "Enter") create(); }}
                  aria-label="New collection name" aria-invalid={nameErr}
                  placeholder="Name it — e.g. Rainy day ramen"
                  style={{ flex: 1, minWidth: 0, border: nameErr ? "1.5px solid var(--accent)" : "1.5px solid transparent", outline: "none", background: "var(--sunken)", borderRadius: 12, padding: "12px 14px", font: "inherit", fontSize: 15, color: "var(--ink)" }} />
                <button className="m-btn m-btn-primary" disabled={!name.trim()} style={{ minHeight: 44, padding: "0 18px", fontSize: 14 }} onClick={create}>Create</button>
              </div>
              {nameErr && <div className="m-caption" role="alert" style={{ color: "var(--accent)", fontWeight: 700, marginTop: 6 }}>Give the collection a name first.</div>}
            </div>
          ) : (
            <button onClick={() => setNaming(true)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 6px", borderRadius: 14, minHeight: 52 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px dashed var(--ink-3)", color: "var(--ink-2)" }}>
                <MIcon name="plus" size={17} />
              </div>
              <div className="m-second" style={{ fontWeight: 700, color: "var(--ink-2)" }}>New collection</div>
            </button>
          )}
        </div>

        <button className="m-btn m-btn-quiet" style={{ width: "100%" }} onClick={onClose}>Done</button>
      </div>
    </div>
  );
}

Object.assign(window, { SaveSheet });
