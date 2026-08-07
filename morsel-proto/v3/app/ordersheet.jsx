// Morsel — order sheet: carrier handoff options for a dish/restaurant.
// Morsel never runs its own checkout; it routes you to whoever delivers.
// v3.1 — allergy-conflict dishes repeat their warning here and gate every
// delivery/pickup option behind an explicit acknowledgement. The warning
// stays visible until the handoff completes or the sheet is cancelled.
const MORSEL_CARRIERS = [
  { key: "doordash", name: "DoorDash", tone: "#EB1700", eta: [25, 40], fee: "$2.99" },
  { key: "ubereats", name: "Uber Eats", tone: "#06C167", eta: [30, 45], fee: "$3.49" },
  { key: "grubhub", name: "Grubhub", tone: "#FF8000", eta: [35, 50], fee: "$1.99" }
];

// Deterministic per-restaurant availability — not every spot is on every app.
// Hollis (fine dining) is on none: the sit-down edge case.
function morselCarriersFor(rest) {
  if (rest === "Hollis") return [];
  const n = rest.length;
  const list = MORSEL_CARRIERS.filter((c, i) => (n + i) % 3 !== 1 || i === n % 3);
  return list.length ? list : [MORSEL_CARRIERS[n % 3]];
}

function OrderSheet({ dish, conflict = [], onClose, onPing }) {
  const { u } = window.MorselData;
  // Modal focus management: name the dialog, move focus in on open, trap Tab,
  // close on Escape; the opener restores focus (see DetailScreen).
  const sheetRef = React.useRef(null);
  const titleId = React.useId();
  React.useEffect(() => {
    const node = sheetRef.current;
    if (!node) return;
    const sel = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';
    const focusables = () => [...node.querySelectorAll(sel)].filter((el) => el.offsetWidth > 0 || el.offsetHeight > 0);
    (focusables()[0] || node).focus();
    const onKey = (e) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); return; }
      if (e.key !== "Tab") return;
      const f = focusables();
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || !node.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || !node.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
    };
    node.addEventListener("keydown", onKey);
    return () => node.removeEventListener("keydown", onKey);
  }, [onClose]);
  const carriers = morselCarriersFor(dish.rest);
  const pickupMin = Math.max(8, Math.round(parseFloat(dish.dist) * 18));
  const [failed, setFailed] = React.useState(null); // carrier whose handoff failed
  const [ack, setAck] = React.useState(false); // allergy acknowledgement — never pre-checked
  const needsAck = conflict.length > 0;
  const locked = needsAck && !ack;
  const allergyText = conflict.join(" and ").toLowerCase();
  const tryCarrier = (c) => {
    if ((window.MorselSim || {}).handoffFail) { setFailed(c); return; }
    onPing("Opening " + c.name + "…"); onClose();
  };

  const Row = ({ icon, title, sub, right, onPick, disabled }) => (
    <button onClick={onPick} disabled={disabled} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "11px 6px", borderRadius: 14, minHeight: 56, opacity: disabled ? 0.4 : 1 }}>
      {icon}
      <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
        <div className="m-second" style={{ fontWeight: 700 }}>{title}</div>
        <div className="m-caption" style={{ color: "var(--ink-3)" }}>{sub}</div>
      </div>
      <div className="m-caption" style={{ color: "var(--ink-2)", fontWeight: 700, flex: "none" }}>{right}</div>
      <div style={{ color: "var(--ink-3)", flex: "none", transform: "rotate(180deg)" }}><MIcon name="back" size={14} /></div>
    </button>
  );

  return (
    <div ref={sheetRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} style={{ position: "absolute", inset: 0, zIndex: 60, display: "flex", flexDirection: "column", justifyContent: "flex-end", outline: "none" }}>
      <button aria-label="Close" onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(15,9,4,.45)", cursor: "pointer" }}></button>
      <div className="m-rise" style={{ position: "relative", background: "var(--surface)", borderRadius: "calc(var(--r) + 4px) calc(var(--r) + 4px) 0 0", padding: "10px 20px 28px", boxShadow: "var(--shadow-float)" }}>
        <div style={{ width: 36, height: 4, borderRadius: 99, background: "var(--line)", margin: "0 auto 14px" }}></div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ width: 46, height: 46, borderRadius: 14, overflow: "hidden", flex: "none", background: "var(--sunken)" }}>
            <img src={u(dish.img, 160)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="m-second" id={titleId} style={{ fontWeight: 800 }}>Get it from {dish.rest}</div>
            <div className="m-caption" style={{ color: "var(--ink-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{dish.name} · {dish.price}</div>
          </div>
        </div>

        {needsAck && (
          <div role="alert" style={{ background: "rgba(194,73,43,.10)", border: "1.5px solid var(--accent)", borderRadius: 14, padding: "12px 13px", marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div aria-hidden="true" style={{ color: "var(--accent)", flex: "none", fontWeight: 900, fontSize: 13, width: 20, height: 20, borderRadius: 99, border: "2px solid var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>!</div>
              <div style={{ flex: 1 }}>
                <div className="m-caption" style={{ fontWeight: 800, color: "var(--accent)" }}>Contains {allergyText} — an allergy you flagged</div>
                <div className="m-caption" style={{ color: "var(--ink-2)" }}>Ordering stays locked until you confirm below. Tell the kitchen about your allergy either way — menu data can lag.</div>
              </div>
            </div>
            <button role="checkbox" aria-checked={ack} onClick={() => setAck(!ack)}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", marginTop: 10, minHeight: 44, borderRadius: 12, padding: "4px 2px" }}>
              <span aria-hidden="true" style={{ width: 24, height: 24, borderRadius: 8, flex: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--accent)", background: ack ? "var(--accent)" : "transparent", color: "var(--accent-ink)", transition: "background .15s ease" }}>{ack ? <MIcon name="check" size={14} /> : null}</span>
              <span className="m-caption" style={{ fontWeight: 700, textAlign: "left", flex: 1 }}>I understand this dish contains {allergyText} — unlock ordering</span>
            </button>
          </div>
        )}

        {failed && (
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "rgba(194,73,43,.10)", border: "1.5px solid var(--accent)", borderRadius: 14, padding: "11px 13px", marginBottom: 12 }}>
            <div style={{ color: "var(--accent)", flex: "none", fontWeight: 900, fontSize: 13, width: 20, height: 20, borderRadius: 99, border: "2px solid var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>!</div>
            <div style={{ flex: 1 }}>
              <div className="m-caption" style={{ fontWeight: 800, color: "var(--accent)" }}>Couldn't open {failed.name}</div>
              <div className="m-caption" style={{ color: "var(--ink-2)" }}>It may not be installed. Try again, pick another app, or grab it yourself — pickup never fails.</div>
              <button className="m-caption" style={{ color: "var(--accent)", fontWeight: 800, marginTop: 4, minHeight: 28 }} onClick={() => tryCarrier(failed)}>Try again</button>
            </div>
          </div>
        )}

        <div className="m-micro" style={{ color: "var(--ink-3)", marginBottom: 6 }}>Delivery</div>
        {carriers.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 14 }}>
            {carriers.map((c) => (
              <Row key={c.key} disabled={locked}
                icon={<div style={{ width: 38, height: 38, borderRadius: 12, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", background: c.tone, color: "#fff", fontWeight: 800, fontSize: 16 }}>{c.name[0]}</div>}
                title={c.name} sub={locked ? "Locked — confirm the allergy notice above" : `${c.eta[0]}–${c.eta[1]} min · ${c.fee} fee`} right="Open"
                onPick={() => tryCarrier(c)} />
            ))}
          </div>
        ) : (
          <div style={{ background: "var(--sunken)", borderRadius: 14, padding: "12px 14px", marginBottom: 14 }}>
            <div className="m-second" style={{ fontWeight: 700 }}>Not on delivery apps</div>
            <div className="m-caption" style={{ color: "var(--ink-2)" }}>{dish.rest} is a sit-down room. Pick it up below — or better, go in person.</div>
          </div>
        )}

        <div className="m-micro" style={{ color: "var(--ink-3)", marginBottom: 6 }}>Skip the fees</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Row disabled={locked}
            icon={<div style={{ width: 38, height: 38, borderRadius: 12, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--sunken)", color: "var(--ink-2)" }}><MIcon name="bag" size={18} /></div>}
            title="Pickup" sub={locked ? "Locked — confirm the allergy notice above" : `Ready in ~${pickupMin} min · ${dish.walk}`} right="Free"
            onPick={() => { onPing("Calling it in…"); onClose(); }} />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { OrderSheet, morselCarriersFor });
