// Morsel — browsing filters: menu price per dish, distance from the demo area.
// These narrow browsing only. Dietary settings are a separate tier and are never
// touched from here. There is no "open now": the catalog has no hours model, and a
// switch that pretends otherwise would be a promise the data cannot keep.
const MORSEL_FILTER_DEFAULTS = { price: [], maxMi: 99 };

const MORSEL_PRICE_BANDS = [
  { b: 1, t: "Under $15", test: (p) => p < 15 },
  { b: 2, t: "$15–24", test: (p) => p >= 15 && p <= 24 },
  { b: 3, t: "$25 and up", test: (p) => p >= 25 }
];

// A dish with no listed price cannot be confirmed inside any budget, so a price
// filter sets it aside rather than guessing. The count of set-aside dishes is
// reported to the diner, never silently dropped.
function morselInBudget(d, f) {
  if (!f.price.length) return true;
  if (d.price === null || d.price === undefined) return false;
  return f.price.some((b) => MORSEL_PRICE_BANDS.find((x) => x.b === b).test(d.price));
}

function applyMorselFilters(dishes, f) {
  if (!f) return dishes;
  return dishes.filter((d) => morselInBudget(d, f) && d.mi <= f.maxMi);
}

// Dishes a price filter set aside because they carry no listed price.
function morselUnpriced(dishes, f) {
  if (!f || !f.price.length) return [];
  return dishes.filter((d) => (d.price === null || d.price === undefined) && d.mi <= f.maxMi);
}

function morselFilterCount(f) {
  if (!f) return 0;
  return (f.price.length ? 1 : 0) + (f.maxMi < 99 ? 1 : 0);
}

// Short labels for the active-constraint bar the feed and search share.
function morselFilterChips(f) {
  const chips = [];
  if (f && f.price.length) chips.push({ key: "price", t: [...f.price].sort().map((b) => MORSEL_PRICE_BANDS.find((x) => x.b === b).t).join(" · ") });
  if (f && f.maxMi < 99) chips.push({ key: "dist", t: "within " + f.maxMi + " mi" });
  return chips;
}

const MI_STOPS = [
  { mi: 0.5, label: "0.5 mi" },
  { mi: 1.0, label: "1 mi" },
  { mi: 1.5, label: "1.5 mi" },
  { mi: 99, label: "Any distance" }
];

function FiltersSheet({ filters, prefs, onChange, onClose }) {
  const { dishes, partition } = window.MorselData;
  const f = filters;
  // count against the same recommendable pool the feed shows, so the number matches
  const pool = partition(dishes, prefs).match;
  const n = applyMorselFilters(pool, f).length;
  const unpriced = morselUnpriced(pool, f).length;
  const togglePrice = (b) => onChange({ ...f, price: f.price.includes(b) ? f.price.filter((x) => x !== b) : [...f.price, b] });
  const active = morselFilterCount(f) > 0;

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 60, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <button aria-label="Close" onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(15,9,4,.45)", cursor: "pointer" }}></button>
      <div className="m-rise" role="dialog" aria-label="Narrow it down" style={{ position: "relative", background: "var(--surface)", borderRadius: "calc(var(--r) + 4px) calc(var(--r) + 4px) 0 0", padding: "10px 20px 28px", boxShadow: "var(--shadow-float)" }}>
        <div style={{ width: 36, height: 4, borderRadius: 99, background: "var(--line)", margin: "0 auto 14px" }}></div>

        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18 }}>
          <div className="m-heading">Narrow it down</div>
          {active && (
            <button className="m-caption" style={{ color: "var(--accent)", fontWeight: 700 }}
              onClick={() => onChange({ ...MORSEL_FILTER_DEFAULTS, price: [] })}>Clear browsing filters</button>
          )}
        </div>

        <div className="m-micro" style={{ color: "var(--ink-3)", marginBottom: 4 }}>Menu price per dish</div>
        <div className="m-caption" style={{ color: "var(--ink-3)", marginBottom: 10 }}>Excludes tax, tip and extras.</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {MORSEL_PRICE_BANDS.map((p) => (
            <button key={p.b} className="m-chip" data-on={f.price.includes(p.b)} aria-pressed={f.price.includes(p.b)} onClick={() => togglePrice(p.b)}
              style={{ flex: 1, justifyContent: "center", padding: "9px 6px", minHeight: 48, fontSize: 14, whiteSpace: "nowrap" }}>
              {p.t}
            </button>
          ))}
        </div>

        <div className="m-micro" id="mi-label" style={{ color: "var(--ink-3)", marginBottom: 4 }}>Distance from Shaw</div>
        <div className="m-caption" style={{ color: "var(--ink-3)", marginBottom: 10 }}>Straight-line distance from the demo area.</div>
        <div role="radiogroup" aria-labelledby="mi-label" style={{ display: "flex", gap: 8, marginBottom: 22 }}>
          {MI_STOPS.map((s) => (
            <button key={s.mi} className="m-chip" data-on={f.maxMi === s.mi} role="radio" aria-checked={f.maxMi === s.mi} onClick={() => onChange({ ...f, maxMi: s.mi })}
              style={{ flex: 1, justifyContent: "center", padding: "9px 6px", minHeight: 48, fontSize: 14, whiteSpace: "nowrap" }}>
              {s.label}
            </button>
          ))}
        </div>

        <button className="m-btn m-btn-primary" style={{ width: "100%" }} disabled={n === 0} onClick={onClose}>
          {n === 0 ? "No matches — loosen a filter" : `Show ${n} dish${n === 1 ? "" : "es"}`}
        </button>
        <div className="m-caption" style={{ color: "var(--ink-3)", marginTop: 10, textAlign: "center" }}>
          {unpriced > 0 ? `${unpriced} dish${unpriced === 1 ? " has" : "es have"} no listed price and ${unpriced === 1 ? "is" : "are"} set aside while a price filter is on. ` : ""}
          Clearing these filters keeps your dietary settings.
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { FiltersSheet, applyMorselFilters, morselFilterCount, morselFilterChips, morselUnpriced, MORSEL_FILTER_DEFAULTS, MORSEL_PRICE_BANDS });
