// best-cooking-game-20261125-0137 — hands in Sizzle & Serve.
// Copies game/ and screenshots/ beside this file to /output and writes
// /output/dossier.json with the kit's vendored library, so the judge reads
// the game, its screenshots and its source exactly as built here.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.
import { cpSync, existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-game.ts";

const here = fileURLToPath(new URL(".", import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

mkdirSync(out, { recursive: true });
cpSync(join(here, "game"), join(out, "game"), { recursive: true });
if (existsSync(join(here, "screenshots"))) {
  cpSync(join(here, "screenshots"), join(out, "screenshots"), { recursive: true });
}

const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
});
writeFileSync(join(out, "dossier.json"), dossier);

const shotBytes = ["1-start.jpg", "2-play.jpg", "3-end.jpg"]
  .map((n) => statSync(join(out, "screenshots", n)).size)
  .join(", ");
console.log(`handed in sizzle-and-serve to ${out} (dossier ${dossier.length} bytes; shots ${shotBytes} bytes)`);
