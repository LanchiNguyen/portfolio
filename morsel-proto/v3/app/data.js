// Morsel — seed data, set in Washington DC.
// Photos: the checked-in portfolio image set; no runtime proxy request.
//
// v3.2 field contract (see the case study, "Make the data model support the promise"):
//   price      number in USD, or null when the menu does not list one. Never a display string.
//   mi         miles from the demo area (Shaw). A number, so filters never parse labels.
//   allergens  array of KNOWN allergen keys, or null when no ingredient information exists.
//              An empty array means "the source lists none of the tracked allergens";
//              null means "we do not know". The two are never treated the same.
//   listed     false when the dish is no longer on the restaurant's menu. Saves keep it.
//   desc       one editorial line. Not a diner quote, not a rating.
// There are no scores, diner counts, reviews, ETAs or walk times in this catalog:
// the prototype has no source for any of them.
function u(id, w) {
  return "../images/morsel-photos/" + id + ".webp";
}

// Every fixture below is illustrative. "Checked" is the fixture date the catalog
// pretends its menu information was last confirmed — shown, never hidden.
const MORSEL_CATALOG_CHECKED = "Sep 2026";

const MORSEL_DISHES = [
  { id: "d01", veg: "veg", allergens: ["gluten","dairy"], img: "1565299624946-b28f40a0ae38", h: 1.25, name: "Margherita, Blistered", rest: "Elder & Ash", hood: "Shaw", price: 19, mi: 0.4, tag: "Pizza",
    desc: "Wood-fired pizza with crushed tomato, fior di latte and basil added after the oven." },
  { id: "d02", veg: null, allergens: ["gluten"], img: "1569718212165-3a8278d5f624", h: 1.3, name: "Shoyu Ramen No. 4", rest: "Paper Lantern", hood: "H Street NE", price: 17, mi: 1.2, tag: "Ramen",
    desc: "Soy-based chicken and pork broth, thin wheat noodles, soft egg, nori and scallion." },
  { id: "d03", veg: "vegan", allergens: [], img: "1546069901-ba9599a7e63c", h: 1.0, name: "Harvest Bowl", rest: "Greenline", hood: "Navy Yard", price: 15, mi: 1.4, tag: "Bowls",
    desc: "Roasted sweet potato, chickpeas, kale and quinoa with a tahini dressing." },
  { id: "d04", veg: null, allergens: ["gluten","dairy"], img: "1568901346375-23c9450c58cd", h: 1.2, name: "Double Stack Smash", rest: "Quarter Smash", hood: "Penn Quarter", price: 14, mi: 0.8, tag: "Burgers",
    desc: "Two smashed beef patties, American cheese, pickles and house sauce on a potato bun." },
  { id: "d05", veg: "veg", allergens: ["gluten","dairy"], img: "1565958011703-44f9829ba187", h: 1.15, name: "Strawberry Cloud Cake", rest: "Buttercream Union", hood: "Georgetown", price: 9, mi: 2.1, tag: "Dessert",
    desc: "Chiffon layers with whipped cream and macerated strawberries, sold by the slice." },
  { id: "d06", veg: "pesc", allergens: ["shellfish","dairy"], img: "1563379926898-05f4575a45d8", h: 0.95, name: "Garlic Butter Prawns", rest: "Tide & Brine", hood: "The Wharf", price: 24, mi: 1.6, tag: "Seafood",
    desc: "Head-on prawns in garlic butter with lemon and parsley, served with grilled bread." },
  { id: "d07", veg: "veg", allergens: ["gluten","dairy"], img: "1567620905732-2d1ec7ab7445", h: 1.25, name: "Brown Butter Stack", rest: "Early Vote", hood: "Capitol Hill", price: 13, mi: 0.9, tag: "Brunch",
    desc: "Three buttermilk pancakes with brown butter and warm maple syrup." },
  { id: "d08", veg: "pesc", allergens: ["shellfish"], img: "1579871494447-9811cf80d66c", h: 0.9, name: "Chef's Omakase Rolls", rest: "Sumi", hood: "Dupont Circle", price: 32, mi: 0.9, tag: "Sushi",
    desc: "Eight pieces chosen by the chef that day. The selection changes; the menu lists shellfish." },
  { id: "d09", veg: null, allergens: [], img: "1544025162-d76694265947", h: 1.1, name: "Hanger Steak, Chimichurri", rest: "Ember Row", hood: "U Street", price: 28, mi: 0.6, tag: "Grill",
    desc: "Grilled hanger steak with chimichurri and charred onion." },
  { id: "d10", veg: "veg", allergens: ["gluten"], img: "1621996346565-e3dbc646d9a9", h: 1.05, name: "Penne Pomodoro", rest: "Elder & Ash", hood: "Shaw", price: 18, mi: 0.4, tag: "Pasta",
    desc: "Penne in a slow tomato sauce with garlic, basil and olive oil. No cheese unless asked." },
  { id: "d11", veg: null, allergens: ["dairy","nuts"], img: "1589302168068-964664d93dc0", h: 1.2, name: "Lamb Biryani, Sealed", rest: "Dum & Dust", hood: "Adams Morgan", price: 21, mi: 1.0, tag: "Indian",
    desc: "Lamb and basmati rice cooked under a pastry seal, finished with fried onion, cashews and yogurt." },
  { id: "d12", veg: "veg", allergens: ["gluten"], img: "1482049016688-2d3e1b311543", h: 0.85, name: "Six-Minute Egg Toast", rest: "Early Vote", hood: "Capitol Hill", price: 11, mi: 0.9, tag: "Brunch",
    desc: "Sourdough toast, soft egg, olive oil and flaky salt." },
  { id: "d13", veg: "pesc", allergens: ["gluten"], img: "1553621042-f6e147245754", h: 1.0, name: "Rainbow Roll Flight", rest: "Sumi", hood: "Dupont Circle", price: 26, mi: 0.9, tag: "Sushi",
    desc: "Three maki rolls with tuna, salmon and avocado; soy and tempura crunch on one." },
  // Fixture: a tasting plate whose ingredients change nightly. The source lists none, so
  // the allergen field is null (unknown), not empty (none of the tracked allergens).
  { id: "d14", veg: null, allergens: null, img: "1414235077428-338989a2e8c0", h: 0.8, name: "Tasting Plate IV", rest: "Hollis", hood: "Logan Circle", price: 38, mi: 0.7, tag: "Fine",
    desc: "A four-part plate that changes nightly. The menu does not list ingredients." },
  { id: "d15", veg: "pesc", allergens: [], img: "1467003909585-2f8a72700288", h: 1.1, name: "Cedar Salmon, Dill Oil", rest: "Tide & Brine", hood: "The Wharf", price: 27, mi: 1.6, tag: "Seafood",
    desc: "Cedar-plank salmon with dill oil, cucumber and new potatoes." },
  { id: "d16", veg: null, allergens: ["gluten","dairy"], img: "1604382354936-07c5d9983bd3", h: 1.3, name: "Nduja Honey Pie", rest: "Slice Theory", hood: "Adams Morgan", price: 22, mi: 1.0, tag: "Pizza",
    desc: "Mozzarella, nduja and hot honey on a naturally leavened crust." },
  { id: "d17", veg: "veg", allergens: ["gluten","dairy"], img: "1484723091739-30a097e8f929", h: 1.05, name: "Brioche French Toast", rest: "Buttercream Union", hood: "Georgetown", price: 14, mi: 2.1, tag: "Brunch",
    desc: "Thick-cut brioche in custard, torched sugar top, seasonal fruit." },
  // Fixture: a combo plate whose contents vary. No ingredient information on the source.
  { id: "d18", veg: null, allergens: null, img: "1571091718767-18b5b1457add", h: 0.95, name: "Late Night Combo", rest: "Quarter Smash", hood: "Penn Quarter", price: 17, mi: 0.8, tag: "Burgers",
    desc: "A burger, fries and a drink. Contents vary by night; the menu does not list ingredients." },
  // Fixture: a dish that has been removed from the menu since it was saved.
  { id: "d19", veg: "vegan", allergens: ["nuts"], listed: false, img: "1512621776951-a57141f2eefd", h: 1.15, name: "Green Goddess Bowl", rest: "Greenline", hood: "Navy Yard", price: 16, mi: 1.4, tag: "Bowls",
    desc: "Greens, avocado, toasted almonds and a herb dressing." },
  { id: "d20", veg: "veg", allergens: ["dairy","nuts"], img: "1585937421612-70a008356fbe", h: 1.0, name: "Paneer Tikka Masala", rest: "Dum & Dust", hood: "Adams Morgan", price: 18, mi: 1.0, tag: "Indian",
    desc: "Tandoor-charred paneer in a tomato and cashew cream sauce." },
  { id: "d21", veg: null, allergens: ["nuts","gluten"], img: "1455619452474-d2be8b1e70cd", h: 1.2, name: "Hand-Pulled Dan Dan", rest: "Noodle Object", hood: "Chinatown", price: 15, mi: 0.7, tag: "Noodles",
    desc: "Hand-pulled wheat noodles, minced pork, sesame and peanut sauce, chili oil." },
  { id: "d22", veg: null, allergens: [], img: "1432139509613-5c4255815697", h: 0.9, name: "Filet, Cherry Gastrique", rest: "Hollis", hood: "Logan Circle", price: 34, mi: 0.7, tag: "Fine",
    desc: "Beef filet with a cherry gastrique and roasted root vegetables." },
  { id: "d23", veg: null, allergens: ["gluten","dairy"], img: "1525351484163-7529414344d8", h: 1.1, name: "Farm Breakfast", rest: "Early Vote", hood: "Capitol Hill", price: 16, mi: 0.9, tag: "Brunch",
    desc: "Two eggs, bacon or sausage, home fries and toast." },
  { id: "d24", veg: "veg", allergens: ["gluten"], img: "1585032226651-759b368d7246", h: 1.25, name: "Wok-Fired Garlic Noodles", rest: "Noodle Object", hood: "Chinatown", price: 16, mi: 0.7, tag: "Noodles",
    desc: "Egg noodles tossed with garlic, scallion and soy in a hot wok." },
  { id: "d25", veg: null, allergens: ["gluten","dairy"], img: "1550317138-10000687a72b", h: 0.85, name: "Pepperoni Cup-n-Char", rest: "Slice Theory", hood: "Adams Morgan", price: 20, mi: 1.0, tag: "Pizza",
    desc: "Natural-casing pepperoni that cups and chars, over mozzarella and tomato." },
  // Fixture: a course whose price is set nightly and not printed on the menu.
  { id: "d26", veg: "vegan", allergens: [], img: "1543339308-43e59d6b73a6", h: 1.0, name: "Garden Course", rest: "Hollis", hood: "Logan Circle", price: null, mi: 0.7, tag: "Fine",
    desc: "A plant-based course built from that week's market vegetables. Priced nightly." }
];

// Featured dishes for the feed hero — an editorial pick for this demo, not a ranking.
const MORSEL_HERO_IDS = ["d08", "d01", "d11", "d16", "d04"];

const MORSEL_CUISINES = [
  { key: "pizza",   label: "Pizza",   img: "1565299624946-b28f40a0ae38" },
  { key: "sushi",   label: "Sushi",   img: "1579871494447-9811cf80d66c" },
  { key: "noodles", label: "Noodles", img: "1569718212165-3a8278d5f624" },
  { key: "brunch",  label: "Brunch",  img: "1567620905732-2d1ec7ab7445" },
  { key: "burgers", label: "Burgers", img: "1568901346375-23c9450c58cd" },
  { key: "indian",  label: "Indian",  img: "1565557623262-b51c2513a641" },
  { key: "seafood", label: "Seafood", img: "1563379926898-05f4575a45d8" },
  { key: "dessert", label: "Dessert", img: "1565958011703-44f9829ba187" },
  { key: "bowls",   label: "Bowls",   img: "1546069901-ba9599a7e63c" },
  { key: "fine",    label: "Fine",    img: "1414235077428-338989a2e8c0" },
  { key: "grill",   label: "Grill",   img: "1544025162-d76694265947" },
  { key: "pasta",   label: "Pasta",   img: "1473093295043-cdd812d0e601" }
];

const MORSEL_COLLECTIONS = [
  { id: "c1", name: "Date night", dishes: ["d14", "d22", "d08", "d26"] },
  { id: "c2", name: "Cheap eats", dishes: ["d12", "d04", "d21", "d25"] },
  { id: "c3", name: "Hill brunch", dishes: ["d07", "d17", "d23", "d12"] }
];

// Where the next step goes, per restaurant. The label is chosen from what is
// actually known about the destination — never from a universal "Order" template.
//   menu   a restaurant menu page (dish-level landing not available)
//   dish   a dish-level page on the restaurant's site
//   none   no online destination we can point to; the restaurant is contact-only
// `checked` is the fixture date the link was last confirmed. Buttercream Union is
// deliberately stale so the "last checked" caveat has something real to say.
const MORSEL_DESTINATIONS = {
  "Elder & Ash":       { kind: "menu", host: "elderandash.example", checked: "Sep 2026" },
  "Paper Lantern":     { kind: "menu", host: "paperlantern.example", checked: "Sep 2026" },
  "Greenline":         { kind: "dish", host: "greenline.example", checked: "Sep 2026" },
  "Quarter Smash":     { kind: "menu", host: "quartersmash.example", checked: "Sep 2026" },
  "Buttercream Union": { kind: "menu", host: "buttercreamunion.example", checked: "May 2026" },
  "Tide & Brine":      { kind: "menu", host: "tideandbrine.example", checked: "Sep 2026" },
  "Early Vote":        { kind: "menu", host: "earlyvote.example", checked: "Sep 2026" },
  "Sumi":              { kind: "dish", host: "sumidc.example", checked: "Sep 2026" },
  "Ember Row":         { kind: "menu", host: "emberrow.example", checked: "Sep 2026" },
  "Dum & Dust":        { kind: "menu", host: "dumanddust.example", checked: "Sep 2026" },
  "Hollis":            { kind: "none", phone: "(202) 555-0140" },
  "Slice Theory":      { kind: "menu", host: "slicetheory.example", checked: "Sep 2026" },
  "Noodle Object":     { kind: "menu", host: "noodleobject.example", checked: "Sep 2026" }
};

// Three tiers, three different promises:
//   Taste RE-RANKS. Lifestyle FILTERS. Allergies EXCLUDE known conflicts and set unknowns apart.
const MORSEL_LIFESTYLES = ["Vegetarian", "Vegan", "Pescatarian"];
const MORSEL_ALLERGENS = ["Nuts", "Gluten", "Dairy", "Shellfish"];

// ---- the one shared dietary classifier ----
// Returns the dish's state relative to the diner's settings. Every surface calls
// this; none re-derives it. What each surface DOES with the state is policy:
//   feed / search / hero / related strips  -> recommend only "match"; list "unknown"
//                                             separately, excluded from the count;
//                                             never show "conflict"
//   saves / collections                    -> show everything, flag conflict + unknown
//   restaurant menu                        -> show everything for context, flagged,
//                                             never presented as a recommendation
//   { state: "match" | "unknown" | "conflict" | "lifestyle", conflicts: [allergen labels] }
function morselDietState(d, prefs) {
  if (!prefs) return { state: "match", conflicts: [] };
  const ls = prefs.lifestyle;
  if (ls === "Vegetarian" && !(d.veg === "veg" || d.veg === "vegan")) return { state: "lifestyle", conflicts: [] };
  if (ls === "Vegan" && d.veg !== "vegan") return { state: "lifestyle", conflicts: [] };
  if (ls === "Pescatarian" && !d.veg) return { state: "lifestyle", conflicts: [] };
  const al = prefs.allergies || [];
  if (!al.length) return { state: "match", conflicts: [] };
  if (d.allergens === null || d.allergens === undefined) return { state: "unknown", conflicts: [] };
  const hits = al.filter((a) => d.allergens.includes(a.toLowerCase()));
  if (hits.length) return { state: "conflict", conflicts: hits };
  return { state: "match", conflicts: [] };
}

// Partition a list by that state. Lifestyle mismatches are dropped silently: they are
// a filter the diner chose, not a safety question.
function morselPartition(dishes, prefs) {
  const out = { match: [], unknown: [], conflict: [] };
  dishes.forEach((d) => {
    const s = morselDietState(d, prefs).state;
    if (s === "lifestyle") return;
    out[s].push(d);
  });
  return out;
}

// Convenience for surfaces that only recommend.
function applyDietPrefs(dishes, prefs) {
  return morselPartition(dishes, prefs).match;
}

// ---- display helpers: formatting lives here so no screen invents its own ----
function morselPrice(d) {
  return d.price === null || d.price === undefined ? null : "$" + d.price;
}
function morselDist(d) {
  return d.mi + " mi";
}
function morselDestination(rest) {
  return MORSEL_DESTINATIONS[rest] || { kind: "none" };
}
// The label for the one primary next step, chosen from the destination.
function morselNextStepLabel(rest) {
  const dest = morselDestination(rest);
  if (dest.kind === "dish") return "View dish on menu";
  if (dest.kind === "menu") return "View restaurant menu";
  return "Check with restaurant";
}

// Honest coverage: the prototype is seeded with DC dishes ONLY.
// Any other city gets a no-coverage state, never mismatched content.
const MORSEL_COVERED = ["Washington, DC"];
const MORSEL_DEMO_AREA = { city: "Washington, DC", hood: "Shaw" };

// Taste affinity: cuisine-tag weights inferred from onboarding taps.
// Used as a moderate, deterministic ranking boost. NEVER a filter.
function morselAffinity(pickedIds) {
  const w = {};
  (pickedIds || []).forEach((id) => {
    const d = MORSEL_DISHES.find((x) => x.id === id);
    if (d) w[d.tag] = (w[d.tag] || 0) + 1;
  });
  return w;
}

window.MorselData = {
  u, dishes: MORSEL_DISHES, heroIds: MORSEL_HERO_IDS, cuisines: MORSEL_CUISINES, collections: MORSEL_COLLECTIONS,
  lifestyles: MORSEL_LIFESTYLES, allergens: MORSEL_ALLERGENS, destinations: MORSEL_DESTINATIONS,
  dietState: morselDietState, partition: morselPartition, applyDietPrefs,
  price: morselPrice, dist: morselDist, destination: morselDestination, nextStepLabel: morselNextStepLabel,
  covered: MORSEL_COVERED, demoArea: MORSEL_DEMO_AREA, checked: MORSEL_CATALOG_CHECKED, affinity: morselAffinity
};
