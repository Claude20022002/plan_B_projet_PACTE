// Captures des jeux et des espaces (plateforme en ligne) pour la vidéo : 1920×1080 + courtes vidéos.
// Identifiants par l'environnement, jamais écrits ici : HESTIM_URL, PROF_EMAIL, PROF_PASS, ETU_EMAIL, ETU_PASS
// Lancement (depuis frontend/, où Playwright est installé) : node ../docs/presentation/capturer-jeux.mjs
import { mkdirSync, renameSync } from "fs";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const { chromium } = createRequire(`${process.cwd()}/`)("@playwright/test");

const BASE = process.env.HESTIM_URL || "https://planner.finadmintech.fr";
const SORTIE = fileURLToPath(new URL("./captures/", import.meta.url)).replaceAll("\\", "/");
mkdirSync(`${SORTIE}video`, { recursive: true });
const TAILLE = { width: 1920, height: 1080 };
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const navigateur = await chromium.launch();

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

const photo = async (page, nom, attente = 1200) => {
    await pause(attente);
    await page.screenshot({ path: `${SORTIE}${nom}.png` });
    console.log(`  ${nom}.png`);
};

// ── Étudiant : scène du joueur, derniers quiz, résultats, terminal, sélecteur d'espaces
{
    const s = await session(process.env.ETU_EMAIL, process.env.ETU_PASS, { video: "web-jeux-etudiant" });
    // Le terminal d'abord : le défi en cours est résolu en vrai (Planner rejoue les commandes)
    // Défi « Revenir d'un cran » : le terminal démarre dans ~/projects, la solution est « cd .. »
    await s.page.goto(`${BASE}/jeux/terminal-linux?defi=navigation-02`, { waitUntil: "networkidle" });
    const saisie = s.page.getByLabel("Commande").first();
    const taper = async (commande, attente = 700) => {
        await saisie.pressSequentially(commande, { delay: 90 });
        await saisie.press("Enter");
        await pause(attente);
    };
    // Des commandes qui n'atteignent pas encore l'objectif, puis celle qui le réussit
    await taper("pwd");
    await taper("ls -la");
    await taper("cat README.md");
    await photo(s.page, "web-18-terminal", 800);
    await taper("cd ..", 300);
    await photo(s.page, "web-18b-terminal-reussite", 1200);

    await s.page.goto(`${BASE}/jeux`, { waitUntil: "networkidle" });
    await photo(s.page, "web-16-jeux-etudiant", 2500);

    await s.page.getByRole("button", { name: "Résultats" }).first().click();
    await s.page.getByRole("dialog").waitFor();
    await photo(s.page, "web-17-resultats-etudiant", 1500);
    await s.page.keyboard.press("Escape");

    await s.page.getByRole("button", { name: "Changer d’espace" }).first().click();
    await photo(s.page, "web-19-espaces", 1000);
    await s.page.keyboard.press("Escape");

    await fermer(s);
}

// ── Enseignant : résultats complets d'un quiz (classement nominatif, équipes, nuage de mots)
{
    const s = await session(process.env.PROF_EMAIL, process.env.PROF_PASS, { video: "web-resultats-enseignant" });
    await s.page.goto(`${BASE}/jeux`, { waitUntil: "networkidle" });
    await photo(s.page, "web-20-jeux-enseignant", 2000);
    await s.page.getByRole("button", { name: "Résultats" }).first().click();
    await s.page.getByRole("dialog").waitFor();
    await photo(s.page, "web-21-resultats-enseignant", 1500);
    // Bas de la fenêtre : le nuage de mots
    await s.page.getByRole("dialog").locator(".MuiDialogContent-root").evaluate((e) => e.scrollTo(0, e.scrollHeight));
    await photo(s.page, "web-22-nuage-de-mots", 1000);
    await fermer(s);
}

await navigateur.close();
