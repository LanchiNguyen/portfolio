// Morsel — sample data for the visual-menu prototype.
//
// One restaurant is modeled in full: Elder & Ash, a fictional all-day
// neighborhood restaurant in Shaw. Its menu is a fixed list of sections and
// dishes in menu order. Photos are attached per dish, each with a source:
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

const MORSEL_RESTAURANTS = [
  { id: "elder-ash", name: "Elder & Ash", hood: "Shaw", kind: "All-day neighborhood restaurant", visual: true },
  { id: "paper-lantern", name: "Paper Lantern", hood: "H Street NE", kind: "Ramen", visual: false },
  { id: "sumi", name: "Sumi", hood: "Dupont Circle", kind: "Sushi", visual: false },
  { id: "dum-dust", name: "Dum & Dust", hood: "Adams Morgan", kind: "Indian", visual: false },
  { id: "hollis", name: "Hollis", hood: "Logan Circle", kind: "Tasting menu", visual: false }
];

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
    photos: [] }
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
// Sections with their dishes, in menu order, photographed or not.
function morselMenu(restId) {
  const dishes = MORSEL_DISHES.filter((d) => d.rest === restId);
  return MORSEL_SECTIONS.map((s) => ({ ...s, dishes: dishes.filter((d) => d.section === s.id) })).filter((s) => s.dishes.length);
}
function morselCoverage(restId) {
  const dishes = MORSEL_DISHES.filter((d) => d.rest === restId);
  return { total: dishes.length, photographed: dishes.filter((d) => d.photos.length > 0).length };
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
  compareMax: MORSEL_COMPARE_MAX,
  restaurant: morselRestaurant, dish: morselDish, menu: morselMenu, coverage: morselCoverage,
  price: morselPrice, sourceLabel: morselSourceLabel, photoNote: morselPhotoNote, ingredientsLine: morselIngredientsLine,
  shortlistAdd: morselShortlistAdd, shortlistRemove: morselShortlistRemove, shortlistToggle: morselShortlistToggle
};
