// Morsel — collection detail: a named shelf of saved dishes
function CollectionScreen({ col, onBack, onOpen, conflictsOf }) {
  const { dishes } = window.MorselData;
  const items = col.dishes.map((id) => dishes.find((d) => d.id === id)).filter(Boolean);
  const hoods = [...new Set(items.map((d) => d.hood))];
  return (
    <div className="m-screen m-fade" style={{ background: "var(--paper)" }}>
      <div style={{ padding: "58px 16px 6px", display: "flex", gap: 10, alignItems: "flex-start" }}>
        <button className="m-btn m-btn-quiet" style={{ flex: "none", width: 46, minHeight: 46, padding: 0 }} aria-label="Back" onClick={onBack}>
          <MIcon name="back" size={18} />
        </button>
        <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
          <div className="m-title" style={{ fontSize: 26 }}>{col.name}</div>
          <div className="m-caption" style={{ color: "var(--ink-3)", marginTop: 3 }}>
            {items.length} dish{items.length === 1 ? "" : "es"} · {hoods.slice(0, 3).join(" · ")}
          </div>
        </div>
      </div>
      <div className="m-scroll" style={{ paddingTop: 12, paddingBottom: 40 }}>
        {items.length ? (
          <FeedGrid dishes={items} cols={2} onOpen={onOpen} flag={conflictsOf} />
        ) : (
          <div style={{ margin: "20px 16px", borderRadius: "var(--r)", background: "var(--sunken)", padding: "28px 24px", textAlign: "center" }}>
            <div className="m-second" style={{ fontWeight: 700, marginBottom: 4 }}>Empty shelf</div>
            <div className="m-caption" style={{ color: "var(--ink-2)" }}>Save a dish and file it here.</div>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { CollectionScreen });
