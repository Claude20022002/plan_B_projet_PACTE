// Recapture d'une seule page (1920×1080) avec un compte de démonstration.
// Usage, depuis frontend/ : node ../docs/presentation/capturer-page.mjs <chemin> <nom-du-fichier> [attente-ms]
// Identifiants par l'environnement : EMAIL, PASS ; HESTIM_URL facultatif.
import { createRequire } from "module";
import { fileURLToPath } from "url";

const { chromium } = createRequire(`${process.cwd()}/`)("@playwright/test");
const [chemin, nom, attente = "3000"] = process.argv.slice(2);
const BASE = process.env.HESTIM_URL || "https://planner.finadmintech.fr";
const SORTIE = fileURLToPath(new URL("./captures/", import.meta.url));

const navigateur = await chromium.launch();
const page = await (await navigateur.newContext({ viewport: { width: 1920, height: 1080 }, locale: "fr-FR" })).newPage();
await page.goto(`${BASE}/connexion`, { waitUntil: "networkidle" });
await page.fill('input[name="email"]', process.env.EMAIL);
await page.fill('input[name="password"]', process.env.PASS);
await Promise.all([page.waitForURL((u) => !u.pathname.startsWith("/connexion")), page.click('button[type="submit"]')]);
await page.goto(`${BASE}${chemin}`, { waitUntil: "networkidle" });
await new Promise((r) => setTimeout(r, Number(attente)));
await page.screenshot({ path: `${SORTIE}${nom}.png` });
console.log(`  ${nom}.png`);
await navigateur.close();
