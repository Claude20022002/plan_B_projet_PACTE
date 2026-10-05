// Captures du devoir noté (plateforme en ligne) pour la vidéo : 1920×1080.
// Identifiants par l'environnement, jamais écrits ici : HESTIM_URL, PROF_EMAIL, PROF_PASS, ETU_EMAIL, ETU_PASS
// Lancement (depuis frontend/, où Playwright est installé) : node ../docs/presentation/capturer-devoirs.mjs
import { createRequire } from "module";
import { fileURLToPath } from "url";

const { chromium } = createRequire(`${process.cwd()}/`)("@playwright/test");

const BASE = process.env.HESTIM_URL || "https://planner.finadmintech.fr";
const SORTIE = fileURLToPath(new URL("./captures/", import.meta.url)).replaceAll("\\", "/");
const TAILLE = { width: 1920, height: 1080 };
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const navigateur = await chromium.launch();

async function session(email, motDePasse) {
    const contexte = await navigateur.newContext({ viewport: TAILLE, deviceScaleFactor: 1, locale: "fr-FR", colorScheme: "dark" });
    const page = await contexte.newPage();
    await page.goto(`${BASE}/connexion`, { waitUntil: "networkidle" });
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', motDePasse);
    await Promise.all([page.waitForURL((u) => !u.pathname.startsWith("/connexion"), { timeout: 20000 }), page.click('button[type="submit"]')]);
    await page.waitForLoadState("networkidle");
    return { contexte, page };
}

const photo = async (page, nom, attente = 1200) => {
    await pause(attente);
    await page.screenshot({ path: `${SORTIE}${nom}.png` });
    console.log(`  ${nom}.png`);
};

// ── Étudiant : le devoir dans l'espace Jeux, puis la copie notée
{
    const s = await session(process.env.ETU_EMAIL, process.env.ETU_PASS);
    await s.page.goto(`${BASE}/jeux`, { waitUntil: "networkidle" });
    const panneau = s.page.locator("section", { hasText: "Devoirs" }).first();
    await panneau.scrollIntoViewIfNeeded();
    await photo(s.page, "web-23-devoirs-etudiant", 1500);
    await panneau.getByRole("button").first().click();
    await s.page.waitForURL(/\/jeux\/devoirs\//);
    await s.page.waitForLoadState("networkidle");
    await photo(s.page, "web-24-devoir-copie", 1500);
    await s.contexte.close();
}

// ── Enseignant : les notes du devoir
{
    const s = await session(process.env.PROF_EMAIL, process.env.PROF_PASS);
    await s.page.goto(`${BASE}/jeux`, { waitUntil: "networkidle" });
    const panneau = s.page.locator("section", { hasText: "Devoirs" }).first();
    await panneau.scrollIntoViewIfNeeded();
    await photo(s.page, "web-25-devoirs-enseignant", 1500);
    await panneau.getByRole("button", { name: "Notes" }).first().click();
    await s.page.getByRole("dialog").waitFor();
    await photo(s.page, "web-26-devoir-notes", 1500);
    await s.page.keyboard.press("Escape");
    await panneau.getByRole("button", { name: "Donner un devoir" }).click();
    await s.page.getByRole("dialog").waitFor();
    await photo(s.page, "web-27-donner-devoir", 2000);
    await s.contexte.close();
}

await navigateur.close();
