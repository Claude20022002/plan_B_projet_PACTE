// Copie dans public/ les captures et logos utilisés par la vidéo (les originaux restent dans ../captures).
// Usage : npm run assets
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ici = dirname(fileURLToPath(import.meta.url));
const captures = join(ici, "..", "..", "captures");
const frontend = join(ici, "..", "..", "..", "..", "frontend", "public");
const publicDir = join(ici, "..", "public");

const fichiers = [
  "web-07-preparation.png",
  "web-08-generation.png",
  "web-09-edt-mensuel.png",
  "web-17-resultats-etudiant.png",
  "web-22-nuage-de-mots.png",
  "web-26-devoir-notes.png",
  "mobile-21-tableau-planner-sombre.png",
  "mobile-21-tableau-studylib-clair.png",
  "mobile-23-resultats-planner-sombre.png",
  "mobile-26-terminal-reussite.png",
  "video/web-tableau-etudiant.webm",
];

let manquants = 0;
for (const f of fichiers) {
  const src = join(captures, f);
  if (!existsSync(src)) { console.warn(`  manquant : ${f}`); manquants++; continue; }
  const dest = join(publicDir, "captures", f);
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
}
mkdirSync(join(publicDir, "logos"), { recursive: true });
copyFileSync(join(frontend, "HESTIM.png"), join(publicDir, "logos", "HESTIM.png"));
console.log(`${fichiers.length - manquants} captures copiées dans public/${manquants ? ` (${manquants} manquantes)` : ""}.`);
