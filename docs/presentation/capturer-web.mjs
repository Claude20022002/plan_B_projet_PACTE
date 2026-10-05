// Captures web de la plateforme en ligne pour la présentation (images 1920×1080 + courtes vidéos).
// Les identifiants de démonstration arrivent par l'environnement, jamais écrits dans ce fichier :
//   HESTIM_URL, ADMIN_EMAIL, ADMIN_PASS, PROF_EMAIL, PROF_PASS, ETU_EMAIL, ETU_PASS
// Lancement (depuis frontend/, où Playwright est installé) : node ../docs/presentation/capturer-web.mjs
import { mkdirSync, renameSync } from "fs";
import { chromium } from "playwright";

const BASE = process.env.HESTIM_URL || "https://planner.finadmintech.fr";
const SORTIE = new URL("./captures/", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
mkdirSync(`${SORTIE}video`, { recursive: true });
const TAILLE = { width: 1920, height: 1080 };
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

const navigateur = await chromium.launch();

/** Une session par rôle ; `video` enregistre toute la session (webm), renommée à la fin. */
async function session(email, motDePasse, { video = null } = {}) {
    const contexte = await navigateur.newContext({
        viewport: TAILLE,
        deviceScaleFactor: 1,
        locale: "fr-FR",
        colorScheme: "dark",
        ...(video ? { recordVideo: { dir: `${SORTIE}video`, size: TAILLE } } : {}),
    });
    const page = await contexte.newPage();
    await page.goto(`${BASE}/connexion`, { waitUntil: "networkidle" });
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', motDePasse);
    await Promise.all([page.waitForURL((u) => !u.pathname.startsWith("/connexion"), { timeout: 20000 }), page.click('button[type="submit"]')]);
    await page.waitForLoadState("networkidle");
    return { contexte, page, video };
}

async function fermer({ contexte, page, video }) {
    const chemin = video ? await page.video()?.path() : null;
    await contexte.close();
    if (chemin) renameSync(chemin, `${SORTIE}video/${video}.webm`);
}

const photo = async (page, nom, chemin, attente = 1500) => {
    if (chemin) await page.goto(`${BASE}${chemin}`, { waitUntil: "networkidle" });
    await pause(attente); // animations des volets terminées
    await page.screenshot({ path: `${SORTIE}${nom}.png` });
    console.log(`  ${nom}.png`);
};

// ── Page de connexion (sans compte)
{
    const contexte = await navigateur.newContext({ viewport: TAILLE, locale: "fr-FR", colorScheme: "dark" });
    const page = await contexte.newPage();
    await page.goto(`${BASE}/connexion`, { waitUntil: "networkidle" });
    await photo(page, "web-01-connexion", null, 800);
    await contexte.close();
}

// ── Étudiant : le panneau des départs (vidéo des volets qui tournent)
{
    const s = await session(process.env.ETU_EMAIL, process.env.ETU_PASS, { video: "web-tableau-etudiant" });
    await pause(4000);
    await photo(s.page, "web-02-tableau-etudiant", null, 500);
    await photo(s.page, "web-03-semaine-etudiant", "/emploi-du-temps/etudiant", 2500);
    await fermer(s);
}

// ── Enseignant : séance en vedette, « Lancer un quiz », supports du cours
{
    const s = await session(process.env.PROF_EMAIL, process.env.PROF_PASS, { video: "web-tableau-enseignant" });
    await pause(3500);
    await photo(s.page, "web-04-tableau-enseignant", null, 500);
    await photo(s.page, "web-05-mes-services", "/mes-services", 2000);
    await fermer(s);
}

// ── Administration : génération automatique (Timefold), EDT du mois, préparation, suivi
{
    const s = await session(process.env.ADMIN_EMAIL, process.env.ADMIN_PASS, { video: "web-admin" });
    await photo(s.page, "web-06-dashboard-admin", null, 2500);
    await photo(s.page, "web-07-preparation", "/gestion/preparation", 2500);
    await photo(s.page, "web-08-generation", "/gestion/generation-automatique", 2500);
    await photo(s.page, "web-09-edt-mensuel", "/emploi-du-temps/mensuel", 3500);
    await photo(s.page, "web-10-suivi", "/gestion/suivi", 2500);
    await photo(s.page, "web-11-enseignements", "/gestion/enseignements", 2500);
    await photo(s.page, "web-12-salles", "/gestion/salles", 2000);
    // Bibliothèque StudyLib (connexion unique : même session)
    await photo(s.page, "web-13-bibliotheque", "/biblio/documents", 3500);
    await fermer(s);
}

// ── ClassQuiz (sous-domaine quiz.) : page d'accueil et connexion « HESTIM Planner »
{
    const contexte = await navigateur.newContext({ viewport: TAILLE, locale: "fr-FR", colorScheme: "dark" });
    const page = await contexte.newPage();
    const quiz = BASE.replace("://planner.", "://quiz.");
    await page.goto(`${quiz}/account/login`, { waitUntil: "networkidle" });
    await photo(page, "web-14-classquiz-connexion", null, 1500);
    await contexte.close();
}

await navigateur.close();
console.log(`Captures dans ${SORTIE}`);
