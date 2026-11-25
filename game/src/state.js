// Sizzle & Serve — game state: orders, plate, grill, fryer, score, clock.
// No drawing here; render.js reads this state and paints it.
class Game {
  constructor(seed) {
    this.rng = mulberry32(seed);
    this.screen = "title"; // title | playing | over
    this.reset();
  }

  reset() {
    this.orders = [];
    this.plate = [];
    this.grill = null; // {t: seconds cooking, state: 'cooking'|'ready'|'burnt'}
    this.fryer = null; // {t, state}
    this.score = 0;
    this.served = 0;
    this.mistakes = 0;
    this.timeLeft = CFG.SHIFT_SECONDS;
    this.spawnIn = 2;
    this.nextOrderId = 1;
    this.flash = ""; // short feedback text ("+58", "WRONG ORDER", ...)
    this.flashT = 0;
  }

  start() {
    this.reset();
    this.screen = "playing";
    this.spawnOrder();
  }

  spawnOrder() {
    if (this.orders.length >= CFG.MAX_ORDERS) return;
    const dish = DISHES[Math.floor(this.rng() * DISHES.length)];
    this.orders.push({
      id: this.nextOrderId++,
      dish,
      patience: 1,
      max: CFG.ORDER_PATIENCE,
    });
  }

  // The grill and the fryer are the two timed stations.
  pressGrill() {
    if (this.screen !== "playing") return;
    if (!this.grill) { this.grill = { t: 0, state: "cooking" }; return; }
    if (this.grill.state === "ready") {
      this.plate.push("patty");
      this.grill = null;
    } else if (this.grill.state === "burnt") {
      this.grill = null; // toss the burnt patty
    }
  }

  pressFryer() {
    if (this.screen !== "playing") return;
    if (!this.fryer) { this.fryer = { t: 0, state: "cooking" }; return; }
    if (this.fryer.state === "ready") {
      this.plate.push("fries");
      this.fryer = null;
    } else if (this.fryer.state === "burnt") {
      this.fryer = null;
    }
  }

  addIngredient(id) {
    if (this.screen !== "playing") return;
    if (this.plate.length >= 6) return;
    this.plate.push(id);
  }

  clearPlate() {
    if (this.screen !== "playing") return;
    this.plate = [];
  }

  // Serve the plate: exact multiset match against an open ticket wins.
  serve() {
    if (this.screen !== "playing" || this.plate.length === 0) return;
    const key = [...this.plate].sort().join(",");
    const idx = this.orders.findIndex(
      (o) => [...o.dish.items].sort().join(",") === key
    );
    if (idx >= 0) {
      const order = this.orders[idx];
      const tip = Math.round(order.patience * CFG.SERVE_TIP_MAX);
      const gained = CFG.SERVE_BASE + tip;
      this.score += gained;
      this.served++;
      this.orders.splice(idx, 1);
      this.flash = `+${gained}`;
      this.flashT = 1.2;
    } else {
      this.score = Math.max(0, this.score + CFG.WRONG_SERVE);
      this.mistakes++;
      this.flash = "WRONG ORDER";
      this.flashT = 1.2;
    }
    this.plate = [];
  }

  tick(dt) {
    if (this.screen !== "playing") return;
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.screen = "over";
      return;
    }
    this.spawnIn -= dt;
    if (this.spawnIn <= 0) {
      this.spawnOrder();
      this.spawnIn = CFG.SPAWN_EVERY;
    }
    for (const o of this.orders) o.patience -= dt / o.max;
    const before = this.orders.length;
    this.orders = this.orders.filter((o) => o.patience > 0);
    if (this.orders.length < before) {
      this.score = Math.max(0, this.score + CFG.EXPIRED_ORDER);
      this.flash = "ORDER WALKED OUT";
      this.flashT = 1.2;
    }
    if (this.grill) this.advanceCooker(this.grill, CFG.PATTY_COOK, CFG.PATTY_READY, dt);
    if (this.fryer) this.advanceCooker(this.fryer, CFG.FRIES_COOK, CFG.FRIES_READY, dt);
    if (this.flashT > 0) this.flashT -= dt;
  }

  advanceCooker(c, cookSecs, readySecs, dt) {
    c.t += dt;
    if (c.state === "cooking" && c.t >= cookSecs) c.state = "ready";
    else if (c.state === "ready" && c.t >= cookSecs + readySecs) c.state = "burnt";
  }
}

// Staged scenes for the screenshots (?shot=start|play|end&seed=1).
function stageShot(game, shot) {
  if (shot === "start") {
    game.screen = "title";
    game.spawnOrder();
  } else if (shot === "play") {
    game.screen = "playing";
    game.timeLeft = 78;
    game.score = 120;
    game.served = 2;
    game.plate = ["bun", "patty"];
    game.grill = { t: CFG.PATTY_COOK, state: "ready" };
    game.fryer = { t: 1.5, state: "cooking" };
    game.orders = [
      { id: 1, dish: DISHES[1], patience: 0.62, max: CFG.ORDER_PATIENCE },
      { id: 2, dish: DISHES[3], patience: 0.85, max: CFG.ORDER_PATIENCE },
    ];
    game.flash = "+58";
    game.flashT = 99;
  } else if (shot === "end") {
    game.screen = "over";
    game.timeLeft = 0;
    game.score = 340;
    game.served = 7;
    game.mistakes = 1;
    game.orders = [];
    game.plate = ["bun", "patty", "cheese"];
  }
}
