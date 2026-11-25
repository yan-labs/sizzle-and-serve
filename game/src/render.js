// Sizzle & Serve — rendering: the whole kitchen is drawn on one canvas.
// Layout: order board left, assembly plate centre, grill + fryer right,
// ingredient buttons and serve/trash along the bottom.
const INK = "#2b2118";
const WALL = "#f7e8d0";
const BOARD = "#3a2f26";
const CARD = "#fff8ec";
const COUNTER = "#c98f4e";
const GREEN = "#3f9e4d";
const RED = "#c62f26";
const GOLD = "#d4af69";

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, align = "left", weight = "bold") {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(s, x, y);
}

function patienceColor(p) {
  if (p > 0.5) return "#3f9e4d";
  if (p > 0.25) return "#e8a13a";
  return "#c62f26";
}

// Clickable zones, shared with main.js input handling.
function layoutZones() {
  return [
    { id: "bun", x: 24, y: 464, w: 180, h: 150 },
    { id: "lettuce", x: 216, y: 464, w: 180, h: 150 },
    { id: "tomato", x: 408, y: 464, w: 180, h: 150 },
    { id: "cheese", x: 600, y: 464, w: 180, h: 150 },
    { id: "grill", x: 922, y: 84, w: 334, h: 170 },
    { id: "fryer", x: 922, y: 270, w: 334, h: 170 },
    { id: "serve", x: 816, y: 464, w: 220, h: 150 },
    { id: "trash", x: 1048, y: 464, w: 208, h: 150 },
  ];
}

function drawTicket(ctx, order, x, y, w, h) {
  rr(ctx, x, y, w, h, 10);
  ctx.fillStyle = CARD;
  ctx.fill();
  text(ctx, `#${order.id}  ${order.dish.name}`, x + 14, y + 22, 19, INK);
  let cx = x + 14;
  for (const item of order.dish.items) {
    const label = INGREDIENTS[item].label;
    ctx.font = "bold 13px system-ui, sans-serif";
    const tw = ctx.measureText(label).width + 16;
    rr(ctx, cx, y + 42, tw, 24, 12);
    ctx.fillStyle = INGREDIENTS[item].color;
    ctx.fill();
    text(ctx, label, cx + tw / 2, y + 54, 13, "#2b2118", "center");
    cx += tw + 6;
  }
  // Patience bar: how long before the customer walks out.
  rr(ctx, x + 14, y + h - 18, w - 28, 8, 4);
  ctx.fillStyle = "#e5d9c3";
  ctx.fill();
  rr(ctx, x + 14, y + h - 18, (w - 28) * Math.max(0, order.patience), 8, 4);
  ctx.fillStyle = patienceColor(order.patience);
  ctx.fill();
}

function drawPlate(ctx, game) {
  const cx = 638, cy = 316;
  // The plate itself.
  ctx.beginPath();
  ctx.ellipse(cx, cy, 215, 88, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#d8cbb2";
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(cx, cy, 175, 66, 0, 0, Math.PI * 2);
  ctx.strokeStyle = "#eee3cd";
  ctx.stroke();
  // Stacked ingredients, bottom to top.
  let y = cy + 34;
  const layers = [...game.plate].reverse();
  for (const item of layers) {
    y -= 26;
    if (item === "bun") {
      rr(ctx, cx - 120, y - 14, 240, 30, 15);
      ctx.fillStyle = INGREDIENTS.bun.color;
      ctx.fill();
    } else if (item === "patty") {
      rr(ctx, cx - 110, y - 12, 220, 26, 13);
      ctx.fillStyle = INGREDIENTS.patty.color;
      ctx.fill();
    } else if (item === "lettuce") {
      rr(ctx, cx - 125, y - 8, 250, 16, 8);
      ctx.fillStyle = INGREDIENTS.lettuce.color;
      ctx.fill();
    } else if (item === "tomato") {
      ctx.beginPath();
      ctx.arc(cx - 55, y, 26, 0, Math.PI * 2);
      ctx.arc(cx + 55, y, 26, 0, Math.PI * 2);
      ctx.fillStyle = INGREDIENTS.tomato.color;
      ctx.fill();
    } else if (item === "cheese") {
      ctx.save();
      ctx.translate(cx, y);
      ctx.rotate(-0.03);
      rr(ctx, -115, -12, 230, 24, 4);
      ctx.fillStyle = INGREDIENTS.cheese.color;
      ctx.fill();
      ctx.restore();
    } else if (item === "fries") {
      for (let i = 0; i < 5; i++) {
        rr(ctx, cx - 90 + i * 38, y - 30, 16, 34, 4);
        ctx.fillStyle = INGREDIENTS.fries.color;
        ctx.fill();
      }
    }
  }
  if (game.plate.length === 0) {
    text(ctx, "EMPTY PLATE — ADD INGREDIENTS", cx, cy - 6, 16, "#b9a888", "center");
  }
}

function drawCooker(ctx, box, title, cooker, cookSecs, readySecs, kind) {
  rr(ctx, box.x, box.y, box.w, box.h, 12);
  ctx.fillStyle = "#4a3a2c";
  ctx.fill();
  text(ctx, title, box.x + 18, box.y + 24, 18, "#f7e8d0");
  const cx = box.x + 70, cy = box.y + 100;
  if (kind === "grill") {
    // Grate lines.
    ctx.strokeStyle = "#6b5844";
    ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(box.x + 20, box.y + 58 + i * 22);
      ctx.lineTo(box.x + 150, box.y + 58 + i * 22);
      ctx.stroke();
    }
    if (cooker) {
      const done = Math.min(1, cooker.t / cookSecs);
      ctx.beginPath();
      ctx.arc(cx, cy, 42, 0, Math.PI * 2);
      ctx.fillStyle = cooker.state === "burnt" ? "#1d1712" : cooker.state === "ready" ? "#7a4a26" : "#c98a7a";
      ctx.fill();
      // Progress ring.
      ctx.beginPath();
      ctx.arc(cx, cy, 46, -Math.PI / 2, -Math.PI / 2 + done * Math.PI * 2);
      ctx.strokeStyle = cooker.state === "burnt" ? "#888" : "#f2c230";
      ctx.lineWidth = 6;
      ctx.stroke();
    }
  } else {
    // Fryer basket.
    rr(ctx, box.x + 24, box.y + 52, 120, 92, 8);
    ctx.fillStyle = "#2e2620";
    ctx.fill();
    ctx.strokeStyle = "#8a7a66";
    ctx.lineWidth = 3;
    ctx.stroke();
    if (cooker) {
      for (let i = 0; i < 5; i++) {
        rr(ctx, box.x + 34 + i * 22, box.y + 34, 12, 52, 3);
        ctx.fillStyle = cooker.state === "burnt" ? "#5a4632" : "#f6d47c";
        ctx.fill();
      }
      const done = Math.min(1, cooker.t / cookSecs);
      rr(ctx, box.x + 170, box.y + 60, 130, 12, 6);
      ctx.fillStyle = "#2e2620";
      ctx.fill();
      rr(ctx, box.x + 170, box.y + 60, 130 * done, 12, 6);
      ctx.fillStyle = "#f2c230";
      ctx.fill();
    }
  }
  const label = !cooker
    ? "CLICK TO START"
    : cooker.state === "cooking" ? "COOKING..."
    : cooker.state === "ready" ? "READY — CLICK TO TAKE IT"
    : "BURNT! CLICK TO TOSS";
  text(ctx, label, box.x + 18, box.y + 152, 14, cooker && cooker.state === "burnt" ? "#ff9d8a" : "#f7e8d0");
}

function drawStationButton(ctx, zone, label, sub, key) {
  rr(ctx, zone.x, zone.y, zone.w, zone.h, 14);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#d8cbb2";
  ctx.stroke();
  text(ctx, label, zone.x + zone.w / 2, zone.y + 52, 24, INK, "center");
  text(ctx, sub, zone.x + zone.w / 2, zone.y + 92, 15, "#8a7a66", "center");
  rr(ctx, zone.x + zone.w / 2 - 16, zone.y + 112, 32, 24, 6);
  ctx.fillStyle = "#efe6d2";
  ctx.fill();
  text(ctx, key, zone.x + zone.w / 2, zone.y + 124, 14, INK, "center");
}

function draw(ctx, game) {
  // Wall, floor, counter.
  ctx.fillStyle = WALL;
  ctx.fillRect(0, 0, CFG.W, CFG.H);
  ctx.fillStyle = "#e8d3ae";
  ctx.fillRect(0, 640, CFG.W, 160);
  ctx.fillStyle = COUNTER;
  ctx.fillRect(0, 640, CFG.W, 14);

  // Top bar.
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, CFG.W, 64);
  text(ctx, "SIZZLE & SERVE", 24, 34, 28, "#f7e8d0");
  const mm = String(Math.floor(game.timeLeft / 60)).padStart(2, "0");
  const ss = String(Math.floor(game.timeLeft % 60)).padStart(2, "0");
  text(ctx, `${mm}:${ss}`, CFG.W / 2, 34, 30, game.timeLeft <= 15 ? "#ff9d8a" : "#f7e8d0", "center");
  text(ctx, `SCORE ${game.score}   •   SERVED ${game.served}`, CFG.W - 24, 34, 20, GOLD, "right");

  // Order board.
  rr(ctx, 24, 84, 330, 360, 12);
  ctx.fillStyle = BOARD;
  ctx.fill();
  text(ctx, "ORDER BOARD", 40, 110, 20, GOLD);
  text(ctx, `${game.orders.length}/${CFG.MAX_ORDERS} TICKETS`, 338, 110, 14, "#b9a888", "right");
  game.orders.forEach((o, i) => drawTicket(ctx, o, 40, 130 + i * 108, 298, 96));
  if (game.orders.length === 0) {
    text(ctx, "NO ORDERS — MORE COMING", 189, 240, 16, "#b9a888", "center");
  }

  // Assembly plate.
  text(ctx, "YOUR PLATE", 378, 110, 20, INK);
  text(ctx, "MATCH A TICKET, THEN SERVE", 378, 138, 14, "#8a7a66");
  drawPlate(ctx, game);
  if (game.flashT > 0) {
    text(ctx, game.flash, 638, 448, 24, game.flash.startsWith("+") ? GREEN : RED, "center");
  }

  // Grill + fryer.
  drawCooker(ctx, { x: 922, y: 84, w: 334, h: 170 }, "GRILL", game.grill, CFG.PATTY_COOK, CFG.PATTY_READY, "grill");
  drawCooker(ctx, { x: 922, y: 270, w: 334, h: 170 }, "FRYER", game.fryer, CFG.FRIES_COOK, CFG.FRIES_READY, "fryer");

  // Ingredient buttons + serve / trash.
  drawStationButton(ctx, { x: 24, y: 464, w: 180, h: 150 }, "BUN", "BOTTOM + TOP", "1");
  drawStationButton(ctx, { x: 216, y: 464, w: 180, h: 150 }, "LETTUCE", "FRESH + CRISP", "3");
  drawStationButton(ctx, { x: 408, y: 464, w: 180, h: 150 }, "TOMATO", "SLICED", "4");
  drawStationButton(ctx, { x: 600, y: 464, w: 180, h: 150 }, "CHEESE", "MELTY", "5");
  rr(ctx, 816, 464, 220, 150, 14);
  ctx.fillStyle = GREEN;
  ctx.fill();
  text(ctx, "SERVE", 926, 522, 34, "#ffffff", "center");
  text(ctx, "SPACE", 926, 566, 15, "#d8f0dc", "center");
  rr(ctx, 1048, 464, 208, 150, 14);
  ctx.fillStyle = "#8a7a66";
  ctx.fill();
  text(ctx, "TRASH", 1152, 522, 28, "#ffffff", "center");
  text(ctx, "CLEAR PLATE  •  X", 1152, 566, 15, "#efe6d2", "center");

  // Hint bar.
  text(ctx, "CLICK A STATION OR PRESS 1–6  •  PATTIES AND FRIES TAKE TIME — BURNT FOOD GOES IN THE BIN  •  SERVE BEFORE THE TICKET'S PATIENCE RUNS OUT", 24, 690, 16, "#8a7a66");

  // Overlays.
  if (game.screen === "title") {
    ctx.fillStyle = "rgba(43,33,24,0.82)";
    ctx.fillRect(0, 0, CFG.W, CFG.H);
    text(ctx, "SIZZLE & SERVE", CFG.W / 2, 260, 64, "#f7e8d0", "center");
    text(ctx, "A 2-MINUTE DINER SHIFT", CFG.W / 2, 320, 24, GOLD, "center");
    text(ctx, "READ THE TICKETS. BUILD THE DISH ON YOUR PLATE.", CFG.W / 2, 380, 20, "#f7e8d0", "center");
    text(ctx, "COOK PATTIES ON THE GRILL, FRY THE FRIES, SERVE IT RIGHT.", CFG.W / 2, 412, 20, "#f7e8d0", "center");
    text(ctx, "CLICK TO START", CFG.W / 2, 500, 30, "#ffffff", "center");
  } else if (game.screen === "over") {
    ctx.fillStyle = "rgba(43,33,24,0.85)";
    ctx.fillRect(0, 0, CFG.W, CFG.H);
    text(ctx, "SHIFT OVER", CFG.W / 2, 280, 56, "#f7e8d0", "center");
    text(ctx, `SCORE  ${game.score}`, CFG.W / 2, 360, 34, GOLD, "center");
    text(ctx, `${game.served} DISHES SERVED  •  ${game.mistakes} MISTAKE${game.mistakes === 1 ? "" : "S"}`, CFG.W / 2, 414, 22, "#f7e8d0", "center");
    text(ctx, "PRESS R TO PLAY AGAIN", CFG.W / 2, 490, 24, "#ffffff", "center");
  }
}
