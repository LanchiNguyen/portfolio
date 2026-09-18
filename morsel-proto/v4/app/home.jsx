// Morsel — Home: photos of dishes near you, and the way into a restaurant.
// Two moments meet here. "I'm at a restaurant" is the at-the-table entry and
// stays one tap from the top; the feed below is for deciding where to go.
// Every dish card leads to its dish page, and from there to the restaurant's menu.
function RestaurantCard({ rest, onOpen }) {
  const { u, coverageLabel, dishes } = window.MorselData;
  const thumbs = dishes.filter((d) => d.rest === rest.id && d.photos.length).slice(0, 3);
  const none = rest.menu === "none" || !thumbs.length;
  return (
    <button className="m-restcard" data-rest-id={rest.id} onClick={() => onOpen(rest.id)} aria-label={rest.name + ", " + rest.hood + ", " + coverageLabel(rest.id)} disabled={none} aria-disabled={none}>
      <div className="m-restcard-strip" aria-hidden="true">
        {thumbs.map((d) => <img key={d.id} src={u(d.photos[0].img, 300)} alt="" />)}
        {!thumbs.length && <div className="m-nophoto" style={{ width: "100%", height: "100%" }}><MIcon name="cameraoff" size={18} /></div>}
      </div>
      <div className="m-restcard-text">
        <span className="m-row-name">{rest.name}</span>
        <span className="m-caption" style={{ color: "var(--ink-2)" }}>{rest.hood} · {rest.mi} mi</span>
        <span className="m-tag" data-tone={none ? undefined : (rest.menu === "full" ? "on" : undefined)} style={{ alignSelf: "flex-start", marginTop: 4 }}>{coverageLabel(rest.id)}</span>
      </div>
    </button>
  );
}

function NearbyDishCard({ dish, onOpen }) {
  const { u, price, restaurant, dist } = window.MorselData;
  const r = restaurant(dish.rest);
  const p = dish.photos[0];
  return (
    <div className="m-card" data-dish-id={dish.id}>
      <button className="m-card-open" onClick={(e) => onOpen(dish.id, e)} aria-label={dish.name + " at " + r.name + ", " + price(dish) + ", " + dist(dish.rest)}>
        <div className="m-card-photo">
          <img src={u(p.img, 500)} alt="" />
          <span className="m-tag" data-tone="photo" style={{ position: "absolute", left: 8, bottom: 8 }}>{shortSource(dish)}</span>
        </div>
        <div className="m-card-text">
          <span className="m-card-name">{dish.name}</span>
          <span className="m-caption" style={{ color: "var(--ink-2)" }}>{r.name} · {r.hood}</span>
          <span className="m-caption" style={{ fontWeight: 700 }}>{price(dish)} <span style={{ color: "var(--ink-3)", fontWeight: 400 }}>· {dist(dish.rest)}</span></span>
        </div>
      </button>
    </div>
  );
}

function HomeScreen({ onPicker, onRestaurant, onOpen }) {
  const { area, nearby, restaurants } = window.MorselData;
  const [scrollRef, onScroll] = useScrollMemo("home");
  const feed = nearby();
  const rests = restaurants.slice().sort((a, b) => a.mi - b.mi);
  return (
    <div className="m-screen m-fade">
      <div className="m-scroll" ref={scrollRef} onScroll={onScroll}>
        <div style={{ padding: "58px 16px 0" }}>
          <div className="m-micro" style={{ color: "var(--accent)" }}>Morsel</div>
          <h1 className="m-title" style={{ marginTop: 6 }}>Near {area.hood}</h1>
          <button className="m-btn m-btn-primary" style={{ width: "100%", marginTop: 14, justifyContent: "space-between", padding: "0 18px 0 22px" }} onClick={onPicker}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}><MIcon name="pin" size={20} />I&rsquo;m at a restaurant</span>
            <MIcon name="next" size={20} />
          </button>
        </div>
        <div className="m-section" style={{ paddingTop: 22 }}>
          <h2>Restaurants</h2>
          <div className="m-caption" style={{ color: "var(--ink-3)" }}>Nearest first. Tap one for its menu.</div>
        </div>
        <div className="m-rail" role="list">
          {rests.map((r) => <div role="listitem" key={r.id}><RestaurantCard rest={r} onOpen={onRestaurant} /></div>)}
        </div>
        <div className="m-section">
          <h2>Dishes with photos</h2>
          <div className="m-caption" style={{ color: "var(--ink-3)" }}>{feed.length} dishes · nearest first</div>
        </div>
        <div className="m-photo-grid">
          {feed.map((d) => <NearbyDishCard key={d.id} dish={d} onOpen={onOpen} />)}
        </div>
      </div>
    </div>
  );
}
