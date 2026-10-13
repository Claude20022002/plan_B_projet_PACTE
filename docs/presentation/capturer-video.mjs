// Captures du site propres à la vidéo, en complément de capturer-profs-admin.mjs (mêmes réglages,
// même plateforme LOCALE de démonstration) :
//   admin-04b-edt-mensuel-classe.png   l'emploi du temps du mois d'une classe, au format officiel
//   etudiant-01-tableau-telephone.png  le tableau de l'étudiante, sur le site au format téléphone
// Identifiants par l'environnement, jamais écrits ici :
//   HESTIM_URL, ADMIN_EMAIL, ADMIN_PASS, ETUDIANT_EMAIL, ETUDIANT_PASS, HORLOGE (facultatif)
//   CLASSE (facultatif) : la classe dont on montre le mois, « 4A IIIA » par défaut
// L'administration doit pouvoir entrer sans double authentification : lancer le serveur de captures
// avec MFA_ADMINS_OBLIGATOIRE=false (jamais en production).
// Lancement (depuis frontend/, où Playwright est installé) :
//   node ../docs/presentation/capturer-video.mjs
import { createRequire } from "module";
import { fileURLToPath } from "url";

const { chromium } = createRequire(`${process.cwd()}/`)("@playwright/test");

const BASE = process.env.HESTIM_URL;
if (!BASE || /finadmintech|hestim\.ma/.test(BASE)) throw new Error("HESTIM_URL doit désigner une plateforme locale de démonstration");
const SORTIE = fileURLToPath(new URL("./captures/", import.meta.url)).replaceAll("\\", "/");
const HORLOGE = process.env.HORLOGE ? new Date(process.env.HORLOGE) : null;
const CLASSE = process.env.CLASSE || "4A IIIA";
const ECRAN = { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 };
const TELEPHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const navigateur = await chromium.launch();

async function session(email, motDePasse, format = ECRAN) {
    const contexte = await navigateur.newContext({ ...format, locale: "fr-FR", timezoneId: "UTC", colorScheme: "dark" });
    const page = await contexte.newPage();
    if (HORLOGE) await page.clock.setFixedTime(HORLOGE);
    await page.goto(`${BASE}/connexion`, { waitUntil: "networkidle" });
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', motDePasse);
    await Promise.all([page.waitForURL((u) => !u.pathname.startsWith("/connexion"), { timeout: 20000 }), page.click('button[type="submit"]')]);
    await page.waitForLoadState("networkidle");
    return { contexte, page };
}

const photo = async (page, nom, attente = 2500) => {
    await pause(attente);
    await page.screenshot({ path: `${SORTIE}${nom}.png` });
    console.log(`  ${nom}.png`);
};

// ── Administration : le mois d'une classe, tel qu'il s'imprime
{
    const s = await session(process.env.ADMIN_EMAIL, process.env.ADMIN_PASS);
    await s.page.goto(`${BASE}/emploi-du-temps/mensuel`, { waitUntil: "networkidle" });
    const classe = s.page.getByRole("combobox", { name: /classe/i });
    await classe.click();
    await classe.fill(CLASSE);
    await s.page.getByRole("option", { name: CLASSE }).first().click();
    await s.page.waitForLoadState("networkidle");
    await photo(s.page, "admin-04b-edt-mensuel-classe", 3500);
    await s.contexte.close();
}

// ── Étudiante : son tableau, sur le site au format téléphone
if (process.env.ETUDIANT_EMAIL) {
    const s = await session(process.env.ETUDIANT_EMAIL, process.env.ETUDIANT_PASS, TELEPHONE);
    await photo(s.page, "etudiant-01-tableau-telephone", 3500);
    await s.contexte.close();
}

await navigateur.close();
console.log(`Captures dans ${SORTIE}`);
