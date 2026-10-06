// Rendu d'images fixes aux temps clés pour contrôler la mise en page (équivalent de plusieurs `npx remotion still`).
// Usage : node scripts/verifier.mjs [HestimPlanner|HestimPlannerVertical] [secondes...]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ici = dirname(fileURLToPath(import.meta.url));
const [id = "HestimPlanner", ...args] = process.argv.slice(2);
const secondes = args.length ? args.map(Number) : [0, 3, 7, 12, 17, 22, 27, 32, 35];
const sortie = join(ici, "..", "out", "stills");
mkdirSync(sortie, { recursive: true });

const serveUrl = await bundle({ entryPoint: join(ici, "..", "src", "index.ts") });
const composition = await selectComposition({ serveUrl, id });
for (const s of secondes) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(s * composition.fps));
  const output = join(sortie, `${id}-${String(s).replace(".", "_")}s.png`);
  await renderStill({ composition, serveUrl, frame, output });
  console.log(`  ${s} s → ${output}`);
}
