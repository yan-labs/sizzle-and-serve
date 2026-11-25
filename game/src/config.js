// Sizzle & Serve — configuration: dishes, stations, timings, palette.
// Everything the other modules read lives here, so tuning is one file.
const CFG = {
  W: 1280,
  H: 800,
  SHIFT_SECONDS: 120,
  MAX_ORDERS: 3,
  SPAWN_EVERY: 10,
  ORDER_PATIENCE: 45,
  PATTY_COOK: 4,
  PATTY_READY: 4,
  FRIES_COOK: 3,
  FRIES_READY: 5,
  SERVE_BASE: 40,
  SERVE_TIP_MAX: 30,
  WRONG_SERVE: -10,
  EXPIRED_ORDER: -5,
};

// Ingredients: id, label, colour used on the plate and in ticket chips.
const INGREDIENTS = {
  bun: { label: "BUN", color: "#e8b25c" },
  patty: { label: "PATTY", color: "#8a5a33" },
  lettuce: { label: "LETTUCE", color: "#5da24a" },
  tomato: { label: "TOMATO", color: "#d94f3d" },
  cheese: { label: "CHEESE", color: "#f2c230" },
  fries: { label: "FRIES", color: "#f6d47c" },
};

// Dishes: the menu. An order is satisfied when the plate holds exactly
// these ingredients (order does not matter, counts do).
const DISHES = [
  { name: "CLASSIC BURGER", items: ["bun", "patty", "lettuce"] },
  { name: "CHEESEBURGER", items: ["bun", "patty", "cheese"] },
  { name: "GARDEN SALAD", items: ["lettuce", "tomato"] },
  { name: "LOADED FRIES", items: ["fries", "cheese"] },
  { name: "DOUBLE STACK", items: ["bun", "patty", "patty", "cheese"] },
];

// Stations, left to right along the counter. key = keyboard shortcut.
const STATIONS = [
  { id: "bun", key: "1" },
  { id: "grill", key: "2" },
  { id: "lettuce", key: "3" },
  { id: "tomato", key: "4" },
  { id: "cheese", key: "5" },
  { id: "fryer", key: "6" },
];

// Deterministic RNG so ?shot= renders the same scene every time.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
