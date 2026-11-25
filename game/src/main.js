// Sizzle & Serve — boot, input and the game loop.
// Reads ?shot=start|play|end&seed=N for staged screenshots; otherwise a
// normal shift starts on the title screen and begins on click.
(function () {
  const params = new URLSearchParams(location.search);
  const seed = Number(params.get("seed") || Date.now() % 2147483647);
  const shot = params.get("shot");

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const game = new Game(seed);
  const zones = layoutZones();

  if (shot) {
    stageShot(game, shot);
  }

  function press(id) {
    if (game.screen === "title") { game.start(); return; }
    if (game.screen === "over") return;
    if (id === "grill") game.pressGrill();
    else if (id === "fryer") game.pressFryer();
    else if (id === "serve") game.serve();
    else if (id === "trash") game.clearPlate();
    else game.addIngredient(id);
  }

  canvas.addEventListener("click", (ev) => {
    const rect = canvas.getBoundingClientRect();
    const x = (ev.clientX - rect.left) * (CFG.W / rect.width);
    const y = (ev.clientY - rect.top) * (CFG.H / rect.height);
    for (const z of zones) {
      if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) {
        press(z.id);
        return;
      }
    }
    if (game.screen === "title") game.start();
  });

  document.addEventListener("keydown", (ev) => {
    const k = ev.key.toLowerCase();
    if (game.screen === "over" && k === "r") { game.start(); return; }
    if (game.screen === "title" && (k === "enter" || k === " ")) { game.start(); return; }
    const byKey = { 1: "bun", 2: "grill", 3: "lettuce", 4: "tomato", 5: "cheese", 6: "fryer" };
    if (byKey[k]) press(byKey[k]);
    else if (k === " ") { ev.preventDefault(); press("serve"); }
    else if (k === "x") press("trash");
  });

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (!shot) game.tick(dt);
    draw(ctx, game);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
