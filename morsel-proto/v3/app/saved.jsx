// Morsel v3.2 — saved & collections. Saves are a memory surface, not a
// recommendation surface: everything the diner saved stays visible, with its
// state explained — a listed conflict, missing ingredient information, or a dish
// that has left the menu. Nothing is auto-deleted by a settings change.
// "Recent" sorts by the real save time. Older saves that predate timestamps keep
// their catalog order after the timestamped ones; they are not pretended to be new.
function CollectionCover({ col, onOpenCol }) {
  const { u, dishes } = window.MorselData;
  const imgs = col.dishes.map((id) => dishes.find((d) => d.id === id)).filter(Boolean);
  return (
    <button onClick={() => onOpenCol(col)} style={{ display: "flex", flexDirection: "column", gap: 7, textAlign: "left", flex: "none", width: 124 }}>
      {imgs.length ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 2, borderRadius: "calc(var(--r) * 0.8)", overflow: "hidden", aspectRatio: "1", width: "100%" }}>
          {imgs.slice(0, 4).map((d, i) => (
            <div key={d.id + i} style={{ position: "relative", overflow: "hidden", background: "var(--sunken)" }}>
              <img src={u(d.img, 160)} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
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
        <div className="m-caption" style={{ color: "var(--ink-3)", fontSize: "calc(12px * var(--ts))" }}>{col.dishes.length ? col.dishes.length + " dish" + (col.dishes.length === 1 ? "" : "es") : "empty — file a save"}</div>
      </div>
    </button>
  );
}

// The explanatory line above a set of saved cards: how many carry which state.
function SavedStateNote({ items, prefs }) {
  const { dietState } = window.MorselData;
  const conflicts = items.filter((d) => dietState(d, prefs).state === "conflict").length;
  const unknown = items.filter((d) => dietState(d, prefs).state === "unknown").length;
  const unlisted = items.filter((d) => d.listed === false).length;
  if (!conflicts && !unknown && !unlisted) return null;
  const parts = [];
  if (conflicts) parts.push(`${conflicts} list${conflicts === 1 ? "s" : ""} an allergen you avoid`);
  if (unknown) parts.push(`${unknown} ${unknown === 1 ? "has" : "have"} no ingredient information`);
  if (unlisted) parts.push(`${unlisted} ${unlisted === 1 ? "is" : "are"} no longer on the menu`);
  return (
    <div className="m-caption" style={{ color: "var(--ink-2)", padding: "0 16px 12px" }}>
      {conflicts > 0 && <span style={{ color: "var(--accent)", fontWeight: 800 }}>! </span>}
      {parts.join("; ")}. All kept and labeled; nothing is removed by a settings change.
    </div>
  );
}

function SavedScreen({ saved, savedAt, collections, onOpen, onOpenCol, onCreateCol, prefs, onToggleSave }) {
  const { dishes } = window.MorselData;
  const cols = collections || window.MorselData.collections;
  const [sort, setSort] = React.useState("recent");
  const [creating, setCreating] = React.useState(false);
  const [name, setName] = React.useState("");
  const [nameErr, setNameErr] = React.useState(false);
  const [scrollRef, onScroll] = useScrollMemo("saved");
  const at = savedAt || {};
  let savedDishes = dishes.filter((d) => saved.has(d.id));
  if (sort === "nearest") savedDishes = [...savedDishes].sort((a, b) => a.mi - b.mi || (a.id < b.id ? -1 : 1));
  else savedDishes = [...savedDishes].sort((a, b) => {
    const ta = at[a.id] || 0, tb = at[b.id] || 0;
    if (ta && tb) return tb - ta;          // newest first
    if (ta || tb) return ta ? -1 : 1;      // timestamped saves ahead of legacy ones
    return 0;                              // legacy saves keep catalog order
  });
  const untimed = savedDishes.filter((d) => !at[d.id]).length;
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
      <div className="m-scroll" ref={scrollRef} onScroll={onScroll} style={{ padding: "10px 0 120px" }}>
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, padding: "0 16px" }}>
          <div className="m-heading" style={{ whiteSpace: "nowrap" }}>All saves</div>
          {savedDishes.length > 1 && (
            <div role="radiogroup" aria-label="Sort saves" style={{ display: "flex", gap: 2, background: "var(--sunken)", borderRadius: 99, padding: 3 }}>
              {[{ k: "recent", l: "Recent" }, { k: "nearest", l: "Nearest" }].map((o) => (
                <button key={o.k} onClick={() => setSort(o.k)} role="radio" aria-checked={sort === o.k}
                  style={{ borderRadius: 99, padding: "6px 14px", fontSize: "calc(13px * var(--ts))", fontWeight: 700, minHeight: 30,
                    background: sort === o.k ? "var(--surface)" : "transparent",
                    color: sort === o.k ? "var(--ink)" : "var(--ink-3)",
                    boxShadow: sort === o.k ? "0 1px 3px rgba(20,12,5,.12)" : "none",
                    transition: "all .15s ease" }}>{o.l}</button>
              ))}
            </div>
          )}
        </div>
        {savedDishes.length > 1 && (
          <div className="m-caption" style={{ color: "var(--ink-3)", padding: "0 16px 10px" }}>
            {sort === "nearest" ? "By distance from Shaw (demo)." : untimed ? `Newest first. ${untimed} save${untimed === 1 ? "" : "s"} from before save times were recorded ${untimed === 1 ? "sits" : "sit"} last, in catalog order.` : "Newest first."}
          </div>
        )}
        <SavedStateNote items={savedDishes} prefs={prefs} />
        {savedDishes.length ? (
          <FeedGrid dishes={savedDishes} cols={2} onOpen={onOpen} saved={saved} onToggleSave={onToggleSave} prefs={prefs} />
        ) : (
          <div style={{ margin: "0 16px", borderRadius: "var(--r)", background: "var(--sunken)", padding: "28px 24px", textAlign: "center" }}>
            <div style={{ color: "var(--accent)", display: "flex", justifyContent: "center", marginBottom: 10 }}><MIcon name="heart" size={28} /></div>
            <div className="m-second" style={{ fontWeight: 700, marginBottom: 4 }}>Nothing saved yet</div>
            <div className="m-caption" style={{ color: "var(--ink-2)" }}>Tap the heart on any dish you might want later.</div>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { SavedScreen, SavedStateNote });
