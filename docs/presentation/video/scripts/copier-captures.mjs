// Copie dans public/ les captures et logos utilisés par la vidéo (les originaux restent dans ../captures).
// Usage : npm run assets
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ici = dirname(fileURLToPath(import.meta.url));
const captures = join(ici, "..", "..", "captures");
const frontend = join(ici, "..", "..", "..", "..", "frontend", "public");
const publicDir = join(ici, "..", "public");

const fichiers = [
  "mobile-37-mois.png",
  "mobile-37-mois-clair.png",
  "mobile-36-fiche-verre-clair.png",
  "mobile-39-supports-module-clair.png",
  "mobile-36-fiche-verre.png",
  "mobile-38-tableau.png",
  "mobile-39-supports-module.png",
  "mobile-13-resultats.png",
  "web-09-edt-mensuel.png",
  "web-21-resultats-enseignant.png",
  "web-26-devoir-notes.png",
  // Maquettes de « Une matinée à l'école » : des écrans à venir, pas des captures de l'application
  "maquette-quiz-mobile-illustration.png",
  "maquette-quiz-mobile-video.png",
  "maquette-quiz-projecteur-illustration.png",
  // Captures du 11 octobre 2026 : application (nouvelle barre du bas), enseignant, administration
  "app-01-tableau.png",
  "app-02-fiche-seance.png",
  "app-03c-mois.png",
  "app-04-scanner.png",
  "prof-01-tableau.png",
  "prof-05-appel-projection.png",
  "admin-01-tableau.png",
  "admin-05b-heures-du-mois.png",
  // Captures du 13 octobre 2026 (capturer-video.mjs) : le mois d'une classe, au format officiel
  "admin-04b-edt-mensuel-classe.png",
  "app-07-espaces.png",
  // Le seul jeu de la bibliothèque de jeux aujourd'hui : Terminal Linux
  "mobile-25-terminal-commandes.png",
];

let manquants = 0;
for (const f of fichiers) {
  const src = join(captures, f);
  if (!existsSync(src)) { console.warn(`  manquant : ${f}`); manquants++; continue; }
  const dest = join(publicDir, "captures", f);
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
}
// Formes des quatre réponses d'un quiz : celles de l'application (mobile/src/quiz/formes.js), en blanc
const { FORMES_KAHOOT } = await import(pathToFileURL(join(ici, "..", "..", "..", "..", "mobile", "src", "quiz", "formes.js")).href);
mkdirSync(join(publicDir, "formes"), { recursive: true });
FORMES_KAHOOT.forEach((svg, i) => writeFileSync(join(publicDir, "formes", `${i}.svg`), svg.replaceAll("currentColor", "#FFFFFF")));

mkdirSync(join(publicDir, "logos"), { recursive: true });
copyFileSync(join(frontend, "HESTIM.png"), join(publicDir, "logos", "HESTIM.png"));
console.log(`${fichiers.length - manquants} captures copiées dans public/${manquants ? ` (${manquants} manquantes)` : ""}.`);
