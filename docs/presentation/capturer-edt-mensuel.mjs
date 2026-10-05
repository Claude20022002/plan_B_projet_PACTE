// Capture de l'EDT du mois (format officiel HESTIM) pour une classe : la page demande d'abord
// de choisir le groupe. Identifiants admin par l'environnement (ADMIN_EMAIL, ADMIN_PASS).
// Lancement depuis frontend/ : node ../docs/presentation/capturer-edt-mensuel.mjs [motif de classe]
import { createRequire } from "module";
import { fileURLToPath } from "url";

const { chromium } = createRequire(`${process.cwd()}/`)("@playwright/test");
const BASE = process.env.HESTIM_URL || "https://planner.finadmintech.fr";
const SORTIE = fileURLToPath(new URL("./captures/", import.meta.url));
const MOTIF = new RegExp(process.argv[2] || "IIIA", "i");

const navigateur = await chromium.launch();
const page = await (await navigateur.newContext({ viewport: { width: 1920, height: 1080 }, locale: "fr-FR" })).newPage();
await page.goto(`${BASE}/connexion`, { waitUntil: "networkidle" });
await page.fill('input[name="email"]', process.env.ADMIN_EMAIL);
await page.fill('input[name="password"]', process.env.ADMIN_PASS);
await Promise.all([page.waitForURL((u) => !u.pathname.startsWith("/connexion")), page.click('button[type="submit"]')]);

await page.goto(`${BASE}/emploi-du-temps/mensuel`, { waitUntil: "networkidle" });
await page.getByRole("combobox").first().click();
const options = page.getByRole("option");
await options.first().waitFor();
const noms = await options.allInnerTexts();
const choix = noms.findIndex((n) => MOTIF.test(n));
console.log(`classe : ${noms[choix >= 0 ? choix : 0]}`);
await options.nth(choix >= 0 ? choix : 0).click();
await page.waitForLoadState("networkidle");
await new Promise((r) => setTimeout(r, 2500));
await page.screenshot({ path: `${SORTIE}web-09-edt-mensuel.png` });
// Version pleine page : le tableau du mois dépasse l'écran
await page.screenshot({ path: `${SORTIE}web-09-edt-mensuel-complet.png`, fullPage: true });
console.log("  web-09-edt-mensuel.png, web-09-edt-mensuel-complet.png");
await navigateur.close();
