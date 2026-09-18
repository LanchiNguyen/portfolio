// Morsel — shared pieces: icons, scroll memo, photo thumbnail and the "no photo" block.
const MIcon = ({ name, size = 22, filled = false }) => {
  const s = { width: size, height: size, flex: "none" };
  const k = { fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round" };
  const paths = {
    search: <g {...k}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></g>,
    back: <path {...k} d="M14.5 5L8 12l6.5 7" />,
    next: <path {...k} d="M9.5 5L16 12l-6.5 7" />,
    check: <path {...k} strokeWidth="2.4" d="M5 12.5l4.5 4.5L19 7.5" />,
    plus: <path {...k} strokeWidth="2.2" d="M12 5v14M5 12h14" />,
    close: <path {...k} strokeWidth="2.2" d="M6 6l12 12M18 6L6 18" />,
    camera: <g {...k}><path d="M4 8.5h3.2l1.6-2.5h6.4l1.6 2.5H20v10H4z" /><circle cx="12" cy="13.2" r="3.2" /></g>,
    cameraoff: <g {...k}><path d="M4 8.5h3.2l1.6-2.5h6.4l1.6 2.5H20v10H4z" /><path d="M5 5l14 14" /></g>,
    pin: <g {...k}><path d="M12 21s-6.5-5.4-6.5-10.3C5.5 7 8.4 4 12 4s6.5 3 6.5 6.7C18.5 15.6 12 21 12 21z" /><circle cx="12" cy="10.5" r="2.3" /></g>,
    compare: <g {...k}><rect x="4" y="5" width="6.5" height="14" rx="1.5" /><rect x="13.5" y="5" width="6.5" height="14" rx="1.5" /></g>,
    grid: <g {...k}><rect x="4" y="4" width="7" height="9" rx="1.5" /><rect x="13" y="4" width="7" height="5" rx="1.5" /><rect x="13" y="11" width="7" height="9" rx="1.5" /><rect x="4" y="15" width="7" height="5" rx="1.5" /></g>,
    menu: <g {...k}><path d="M5 7h14M5 12h14M5 17h9" /></g>,
    info: <g {...k}><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8v.5" /></g>
  };
  return <svg viewBox="0 0 24 24" style={s} aria-hidden="true">{paths[name] || null}</svg>;
};

// Scroll position memo: Back returns to where the diner was in the menu.
const MORSEL_SCROLL = {};
function useScrollMemo(key) {
  const ref = React.useRef(null);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (el && MORSEL_SCROLL[key]) el.scrollTop = MORSEL_SCROLL[key];
  }, [key]);
  const onScroll = (e) => { MORSEL_SCROLL[key] = e.currentTarget.scrollTop; };
  return [ref, onScroll];
}

// A dish thumbnail: the first photo with its source, or the no-photo block.
// The block is the same size as a photo so an unphotographed dish keeps its
// place and its weight in the menu.
// Short source words on small thumbnails ("Restaurant", "Diner"); the full
// label ("Restaurant photo") is on the photo itself in the dish view.
function shortSource(dish) {
  const n = dish.photos.length;
  if (n > 1) return n + " photos";
  return dish.photos[0].source === "diner" ? "Diner" : "Restaurant";
}
function Thumb({ dish, size = 104, tag = true }) {
  const { u } = window.MorselData;
  const p = dish.photos[0];
  if (!p) {
    return (
      <div className="m-thumb m-nophoto" style={{ width: size, height: size }} aria-hidden="true">
        <MIcon name="cameraoff" size={20} />
        <span className="m-caption">No photo yet</span>
      </div>
    );
  }
  return (
    <div className="m-thumb" style={{ width: size, height: size }}>
      <img src={u(p.img, 400)} alt="" />
      {tag && <span className="m-tag" data-tone="photo">{shortSource(dish)}</span>}
    </div>
  );
}
