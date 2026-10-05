// Captures web de la plateforme en ligne pour la présentation (images 1920×1080 + courtes vidéos).
// Les identifiants de démonstration arrivent par l'environnement, jamais écrits dans ce fichier :
//   HESTIM_URL, ADMIN_EMAIL, ADMIN_PASS, PROF_EMAIL, PROF_PASS, ETU_EMAIL, ETU_PASS
// Lancement (depuis frontend/, où Playwright est installé) : node ../docs/presentation/capturer-web.mjs
import { mkdirSync, renameSync } from "fs";
import { createRequire } from "module";
import { fileURLToPath } from "url";

// Playwright est installé dans frontend/ (lancer le script depuis ce dossier)
const { chromium } = createRequire(`${process.cwd()}/`)("@playwright/test");

const BASE = process.env.HESTIM_URL || "https://planner.finadmintech.fr";
// fileURLToPath : décode les espaces du chemin (« Github Project »), qu'URL.pathname laisse en %20
const SORTIE = fileURLToPath(new URL("./captures/", import.meta.url)).replaceAll("\\", "/");
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
    // ClassQuiz : connexion unique de bout en bout (déjà connecté à Planner → aucun mot de passe)
    const quiz = BASE.replace("://planner.", "://quiz.");
    await s.page.goto(`${quiz}/account/login`, { waitUntil: "networkidle" });
    await photo(s.page, "web-14-classquiz-connexion", null, 1200);
    const bouton = s.page.locator('a[href="/api/v1/users/oauth/custom/login"]').first();
    if (await bouton.count()) {
        // Planner → retour sur ClassQuiz (/oauth/custom/auth), qui renvoie vers le tableau de bord
        const retour = s.page.waitForResponse((r) => r.url().includes("/api/v1/users/oauth/custom/auth"), { timeout: 30000 });
        await bouton.click();
        await retour;
        await s.page.waitForURL((u) => u.pathname.startsWith("/dashboard"), { timeout: 30000 });
        await s.page.waitForLoadState("networkidle");
        await photo(s.page, "web-15-classquiz-dashboard", null, 2000);
    } else {
        console.log("  (bouton « HESTIM Planner » introuvable sur la page de connexion ClassQuiz)");
    }
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

await navigateur.close();
console.log(`Captures dans ${SORTIE}`);
