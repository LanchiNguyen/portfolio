// Morsel — sample data for the visual-menu prototype.
//
// One restaurant is modeled in full: Elder & Ash, a fictional all-day
// neighborhood restaurant in Shaw. Its menu is a fixed list of sections and
// dishes in menu order. Nine more restaurants carry only the dishes that have a
// photo, so the nearby feed has something to show and each leads to a menu. Photos are attached per dish, each with a source:
//   restaurant  a photo the restaurant supplied for its own menu
//   diner       a photo a diner attached to the dish
// Both sources are illustrative fixtures in this prototype. Nothing was
// contributed by anyone; the labels show the provenance the product would carry.
//
// Field contract:
//   price      number in USD. Every dish on this menu lists one.
//   allergens  array of KNOWN allergen keys (nuts, gluten, dairy, shellfish), or
//              null when the menu lists no ingredient information at all.
//   photos     array, possibly empty. A dish with no photos stays in menu order.
//   desc       the menu's own description line.
function u(id, w) {
  return "../images/morsel-photos/" + id + ".webp";
}

// Restaurants near the fixed demo area (Shaw, DC). One has its full menu in
// Morsel; the others have only the dishes that carry a photo, shown as a
// partial menu. Two have no photos at all and stay visible as such.
//   menu   "full"    every section and dish, photographed or not
//          "partial" only photographed dishes; the rest of the menu is not in Morsel
//          "none"    nothing yet
//   mi     straight-line miles from Shaw, a number so sorting never parses labels
const MORSEL_RESTAURANTS = [
  { id: "elder-ash", name: "Elder & Ash", hood: "Shaw", kind: "All-day neighborhood restaurant", menu: "full", mi: 0.4 },
  { id: "hollis", name: "Hollis", hood: "Logan Circle", kind: "Tasting menu", menu: "partial", mi: 0.7 },
  { id: "noodle-object", name: "Noodle Object", hood: "Chinatown", kind: "Noodles", menu: "partial", mi: 0.7 },
  { id: "ember-row", name: "Ember Row", hood: "U Street", kind: "Grill", menu: "partial", mi: 0.6 },
  { id: "early-vote", name: "Early Vote", hood: "Capitol Hill", kind: "Brunch", menu: "partial", mi: 0.9 },
  { id: "sumi", name: "Sumi", hood: "Dupont Circle", kind: "Sushi", menu: "partial", mi: 0.9 },
  { id: "dum-dust", name: "Dum & Dust", hood: "Adams Morgan", kind: "Indian", menu: "partial", mi: 1.0 },
  { id: "paper-lantern", name: "Paper Lantern", hood: "H Street NE", kind: "Ramen", menu: "partial", mi: 1.2 },
  { id: "greenline", name: "Greenline", hood: "Navy Yard", kind: "Bowls and salads", menu: "partial", mi: 1.4 },
  { id: "tide-brine", name: "Tide & Brine", hood: "The Wharf", kind: "Seafood", menu: "partial", mi: 1.6 },
  { id: "quarter-smash", name: "Quarter Smash", hood: "Penn Quarter", kind: "Burgers", menu: "none", mi: 0.8 },
  { id: "slice-theory", name: "Slice Theory", hood: "Adams Morgan", kind: "Pizza", menu: "none", mi: 1.0 }
];
const MORSEL_AREA = { city: "Washington, DC", hood: "Shaw" };

const MORSEL_SECTIONS = [
  { id: "starters", name: "Starters" },
  { id: "pizza", name: "Wood-fired pizza" },
  { id: "mains", name: "Mains" },
  { id: "desserts", name: "Desserts" }
];

// Menu order is the restaurant's order. It is never re-sorted by photo coverage.
const MORSEL_DISHES = [
  { id: "m01", rest: "elder-ash", section: "starters", name: "Farfalle Salad", price: 12, allergens: ["gluten", "dairy", "nuts"],
    desc: "Cold farfalle with basil pesto, cherry tomatoes and shaved parmesan.",
    photos: [{ img: "1473093295043-cdd812d0e601", source: "restaurant" }] },
  { id: "m02", rest: "elder-ash", section: "starters", name: "Charred Broccolini", price: 9, allergens: ["gluten"],
    desc: "Broccolini from the wood oven with chili breadcrumbs and lemon.",
    photos: [] },

  { id: "m03", rest: "elder-ash", section: "pizza", name: "Pepperoni and Olive", price: 21, allergens: ["gluten", "dairy"],
    desc: "Tomato, mozzarella, pepperoni, black olives, mushrooms and peppers.",
    photos: [{ img: "1604382354936-07c5d9983bd3", source: "restaurant" }] },
  { id: "m04", rest: "elder-ash", section: "pizza", name: "Smoked Chicken and Red Onion", price: 20, allergens: ["gluten", "dairy"],
    desc: "Smoked chicken, red onion, mozzarella and cilantro with a barbecue drizzle. No tomato.",
    photos: [{ img: "1565299624946-b28f40a0ae38", source: "restaurant" }] },
  { id: "m05", rest: "elder-ash", section: "pizza", name: "Margherita", price: 18, allergens: ["gluten", "dairy"],
    desc: "Crushed tomato, fior di latte and basil added after the oven.",
    photos: [] },

  { id: "m06", rest: "elder-ash", section: "mains", name: "Elder Burger", price: 17, allergens: ["gluten", "dairy"],
    desc: "Beef patties, cheddar, lettuce, tomato, pickles and onion on a sesame bun. Fries on the side.",
    photos: [
      { img: "1568901346375-23c9450c58cd", source: "restaurant" },
      { img: "1550317138-10000687a72b", source: "diner" },
      { img: "1571091718767-18b5b1457add", source: "diner" }
    ] },
  { id: "m07", rest: "elder-ash", section: "mains", name: "Hanger Steak", price: 28, allergens: [],
    desc: "Grilled hanger steak with pan jus and charred broccolini.",
    photos: [{ img: "1432139509613-5c4255815697", source: "restaurant" }] },
  { id: "m08", rest: "elder-ash", section: "mains", name: "Penne Pomodoro", price: 18, allergens: ["gluten"],
    desc: "Penne in a slow tomato sauce with garlic, basil and olive oil. No cheese unless asked.",
    photos: [{ img: "1621996346565-e3dbc646d9a9", source: "diner" }] },
  { id: "m09", rest: "elder-ash", section: "mains", name: "Prawn Linguine", price: 24, allergens: ["gluten", "shellfish"],
    desc: "Linguine with prawns, cherry tomatoes, chili and garlic.",
    photos: [{ img: "1563379926898-05f4575a45d8", source: "diner" }] },
  // Fixture: the menu describes this dish without listing ingredients, so the
  // allergen field is null (unknown), not empty (none of the tracked allergens).
  { id: "m10", rest: "elder-ash", section: "mains", name: "Half Roast Chicken", price: 26, allergens: null,
    desc: "Half a roast chicken with pan sauce and the day's vegetables.",
    photos: [] },

  { id: "m11", rest: "elder-ash", section: "desserts", name: "Raspberry Layer Cake", price: 9, allergens: ["gluten", "dairy"],
    desc: "Vanilla sponge, raspberry cream and fresh raspberries, by the slice.",
    photos: [{ img: "1565958011703-44f9829ba187", source: "restaurant" }] },
  { id: "m12", rest: "elder-ash", section: "desserts", name: "Olive Oil Cake", price: 8, allergens: ["gluten"],
    desc: "Olive oil cake with orange zest and a spoon of creme fraiche.",
    photos: [] },

  // Partial menus: only the dishes that carry a photo. Each photo is used once
  // across the whole catalog so no picture stands for two dishes.
  { id: "p01", rest: "hollis", section: "photos", name: "Tasting Plate IV", price: 38, allergens: null,
    desc: "A four-part plate that changes nightly. The menu does not list ingredients.",
    photos: [{ img: "1414235077428-338989a2e8c0", source: "restaurant" }] },
  { id: "p02", rest: "noodle-object", section: "photos", name: "Wok-Fired Garlic Noodles", price: 16, allergens: ["gluten"],
    desc: "Egg noodles tossed with garlic, scallion and soy in a hot wok.",
    photos: [{ img: "1585032226651-759b368d7246", source: "diner" }] },
  { id: "p03", rest: "ember-row", section: "photos", name: "Smoked Ribs, Half Rack", price: 26, allergens: [],
    desc: "Half a rack of smoked pork ribs with pickles, tomato and house sauce.",
    photos: [{ img: "1544025162-d76694265947", source: "restaurant" }] },
  { id: "p04", rest: "ember-row", section: "photos", name: "Steak Salad", price: 22, allergens: ["nuts"],
    desc: "Sliced grilled steak over greens with cashews, red onion and chili.",
    photos: [{ img: "1504674900247-0877df9cc836", source: "diner" }] },
  { id: "p05", rest: "early-vote", section: "photos", name: "Brown Butter Stack", price: 13, allergens: ["gluten", "dairy"],
    desc: "Three buttermilk pancakes with brown butter, banana and warm maple syrup.",
    photos: [{ img: "1567620905732-2d1ec7ab7445", source: "restaurant" }] },
  { id: "p06", rest: "early-vote", section: "photos", name: "Brioche French Toast", price: 14, allergens: ["gluten", "dairy"],
    desc: "Thick-cut brioche in custard with banana, blueberries and syrup.",
    photos: [{ img: "1484723091739-30a097e8f929", source: "diner" }] },
  { id: "p07", rest: "early-vote", section: "photos", name: "Avocado Toast, Soft Egg", price: 12, allergens: ["gluten"],
    desc: "Sourdough, avocado, a soft egg, olive oil and flaky salt.",
    photos: [{ img: "1482049016688-2d3e1b311543", source: "restaurant" }] },
  { id: "p08", rest: "early-vote", section: "photos", name: "Farm Egg Toast", price: 11, allergens: ["gluten"],
    desc: "A fried egg on toast with avocado and chili flakes.",
    photos: [{ img: "1525351484163-7529414344d8", source: "diner" }] },
  { id: "p09", rest: "sumi", section: "photos", name: "Chef's Omakase Rolls", price: 32, allergens: ["shellfish"],
    desc: "Eight pieces chosen by the chef that day. The selection changes; the menu lists shellfish.",
    photos: [{ img: "1579871494447-9811cf80d66c", source: "restaurant" }] },
  { id: "p10", rest: "sumi", section: "photos", name: "Rainbow Roll Flight", price: 26, allergens: ["gluten"],
    desc: "Three maki rolls with tuna, salmon and avocado; soy and tempura crunch on one.",
    photos: [{ img: "1553621042-f6e147245754", source: "diner" }] },
  { id: "p11", rest: "dum-dust", section: "photos", name: "Lamb Biryani, Sealed", price: 21, allergens: ["dairy", "nuts"],
    desc: "Lamb and basmati rice cooked under a pastry seal, finished with fried onion, cashews and yogurt.",
    photos: [{ img: "1589302168068-964664d93dc0", source: "restaurant" }] },
  { id: "p12", rest: "dum-dust", section: "photos", name: "Paneer Tikka Masala", price: 18, allergens: ["dairy", "nuts"],
    desc: "Tandoor-charred paneer in a tomato and cashew cream sauce.",
    photos: [{ img: "1585937421612-70a008356fbe", source: "diner" }] },
  { id: "p13", rest: "dum-dust", section: "photos", name: "Butter Chicken, Naan", price: 19, allergens: ["dairy", "gluten"],
    desc: "Chicken in a buttered tomato sauce with fresh naan.",
    photos: [{ img: "1565557623262-b51c2513a641", source: "restaurant" }] },
  { id: "p14", rest: "dum-dust", section: "photos", name: "Lamb Curry", price: 20, allergens: ["dairy"],
    desc: "Slow-cooked lamb in a red chili and tomato gravy.",
    photos: [{ img: "1455619452474-d2be8b1e70cd", source: "diner" }] },
  { id: "p15", rest: "paper-lantern", section: "photos", name: "Shoyu Ramen No. 4", price: 17, allergens: ["gluten"],
    desc: "Soy-based chicken and pork broth, thin wheat noodles, soft egg, nori and scallion.",
    photos: [{ img: "1569718212165-3a8278d5f624", source: "restaurant" }] },
  { id: "p16", rest: "greenline", section: "photos", name: "Harvest Bowl, Chicken", price: 15, allergens: [],
    desc: "Grilled chicken, egg, avocado, cucumber and rice with a sesame dressing.",
    photos: [{ img: "1546069901-ba9599a7e63c", source: "restaurant" }] },
  { id: "p17", rest: "greenline", section: "photos", name: "Market Bowl", price: 14, allergens: ["nuts"],
    desc: "Chickpeas, roasted vegetables, avocado, cabbage and seeds with a tahini dressing.",
    photos: [{ img: "1512621776951-a57141f2eefd", source: "diner" }] },
  { id: "p18", rest: "greenline", section: "photos", name: "Market Salad", price: 12, allergens: [],
    desc: "Greens, tomato, avocado and seeds with a lemon vinaigrette.",
    photos: [{ img: "1543339308-43e59d6b73a6", source: "restaurant" }] },
  { id: "p19", rest: "tide-brine", section: "photos", name: "Cedar Salmon, Dill Oil", price: 27, allergens: [],
    desc: "Cedar-plank salmon with dill oil, cucumber and greens.",
    photos: [{ img: "1467003909585-2f8a72700288", source: "restaurant" }] }
];

const MORSEL_ALLERGENS = ["Nuts", "Gluten", "Dairy", "Shellfish"];
const MORSEL_COMPARE_MAX = 3;

// ---- helpers: every screen formats through these, none invents its own ----
function morselRestaurant(id) {
  return MORSEL_RESTAURANTS.find((r) => r.id === id) || null;
}
function morselDish(id) {
  return MORSEL_DISHES.find((d) => d.id === id) || null;
}
// Sections with their dishes, in menu order, photographed or not. A partial
// menu is one section of photographed dishes; it never claims to be the menu.
function morselMenu(restId) {
  const dishes = MORSEL_DISHES.filter((d) => d.rest === restId);
  const r = morselRestaurant(restId);
  if (r && r.menu === "partial") return dishes.length ? [{ id: "photos", name: "Dishes with photos", dishes }] : [];
  return MORSEL_SECTIONS.map((s) => ({ ...s, dishes: dishes.filter((d) => d.section === s.id) })).filter((s) => s.dishes.length);
}
function morselCoverage(restId) {
  const dishes = MORSEL_DISHES.filter((d) => d.rest === restId);
  return { total: dishes.length, photographed: dishes.filter((d) => d.photos.length > 0).length };
}
// The one-line coverage a restaurant card carries. Short enough for a card tag;
// the menu header spells it out in full.
function morselCoverageLabel(restId) {
  const r = morselRestaurant(restId);
  const c = morselCoverage(restId);
  if (!r || r.menu === "none" || !c.photographed) return "No photos yet";
  if (r.menu === "full") return c.photographed + " of " + c.total + " photographed";
  return c.photographed + " photographed · partial menu";
}
// Photographed dishes near the area, nearest restaurant first, menu order within one.
function morselNearby() {
  const order = MORSEL_RESTAURANTS.slice().sort((a, b) => a.mi - b.mi).map((r) => r.id);
  return MORSEL_DISHES.filter((d) => d.photos.length).slice().sort((a, b) => order.indexOf(a.rest) - order.indexOf(b.rest));
}
function morselDist(restId) {
  const r = morselRestaurant(restId);
  return r ? r.mi + " mi" : "";
}
function morselPrice(d) {
  return "$" + d.price;
}
function morselSourceLabel(source) {
  return source === "diner" ? "Diner photo" : "Restaurant photo";
}
// The one-line photo note on a card: what the thumbnail is, or that there is none.
function morselPhotoNote(d) {
  const n = d.photos.length;
  if (n === 0) return "No photo yet";
  if (n === 1) return morselSourceLabel(d.photos[0].source);
  const diners = d.photos.filter((p) => p.source === "diner").length;
  return n + " photos" + (diners ? " · " + diners + " from diners" : "");
}
// What the menu says about ingredients. Missing information stays visibly missing.
function morselIngredientsLine(d) {
  if (d.allergens === null || d.allergens === undefined) return "Ingredients aren't listed on the menu.";
  if (!d.allergens.length) return "The menu lists none of nuts, gluten, dairy or shellfish.";
  return "The menu lists " + d.allergens.join(", ") + ".";
}

// ---- shortlist: a small set to compare, never a cart ----
// Pure functions so the rule lives in one place and can be tested without a UI.
function morselShortlistAdd(list, id) {
  if (list.includes(id)) return { list, ok: true, reason: "already" };
  if (list.length >= MORSEL_COMPARE_MAX) return { list, ok: false, reason: "full" };
  if (!morselDish(id)) return { list, ok: false, reason: "unknown" };
  return { list: list.concat(id), ok: true, reason: "added" };
}
function morselShortlistRemove(list, id) {
  return list.filter((x) => x !== id);
}
function morselShortlistToggle(list, id) {
  return list.includes(id) ? { list: morselShortlistRemove(list, id), ok: true, reason: "removed" } : morselShortlistAdd(list, id);
}

window.MorselData = {
  u, restaurants: MORSEL_RESTAURANTS, sections: MORSEL_SECTIONS, dishes: MORSEL_DISHES, allergens: MORSEL_ALLERGENS,
  compareMax: MORSEL_COMPARE_MAX, area: MORSEL_AREA,
  restaurant: morselRestaurant, dish: morselDish, menu: morselMenu, coverage: morselCoverage, coverageLabel: morselCoverageLabel,
  nearby: morselNearby, dist: morselDist,
  price: morselPrice, sourceLabel: morselSourceLabel, photoNote: morselPhotoNote, ingredientsLine: morselIngredientsLine,
  shortlistAdd: morselShortlistAdd, shortlistRemove: morselShortlistRemove, shortlistToggle: morselShortlistToggle
};
