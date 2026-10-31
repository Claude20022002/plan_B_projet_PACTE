// Captures pour la vidéo : la Bibliothèque (StudyLib, sous /biblio) et les écrans de l'enseignant,
// sur la plateforme de démonstration en ligne. Navigation et photos seulement : rien n'est modifié.
// Identifiants dans docs/presentation/.env.captures (ignoré par git), jamais dans ce fichier :
//   HESTIM_URL=https://…      (facultatif)
//   PROF_EMAIL=…  PROF_PASS=…  ETU_EMAIL=…  ETU_PASS=…
// Lancement (depuis frontend/, où Playwright est installé) :
//   node ../docs/presentation/capturer-bibliotheque-prof.mjs
// Sortie : captures/prof2-*.png, biblio-*.png, etu2-*.png en 1920 × 1080 ; prof2-tel-*, biblio-tel-* et
// etu2-*-telephone au format téléphone (390 × 844, densité 2 : images de 780 × 1688).
import { existsSync, readFileSync } from "fs";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const { chromium } = createRequire(`${process.cwd()}/`)("@playwright/test");

const ENV = fileURLToPath(new URL("./.env.captures", import.meta.url));
if (existsSync(ENV)) {
    // Deux écritures acceptées : PROF_EMAIL=… (une par variable), ou des paires « enseignant_demo = … »
    // suivies de « password_enseignant_demo = … » (le premier compte enseignant, l'étudiant de 4A IIIA
    // s'il existe, sinon le premier étudiant ; le compte d'administration n'est jamais utilisé).
    const paires = [];
    for (const ligne of readFileSync(ENV, "utf8").split(/\r?\n/)) {
        const m = ligne.match(/^\s*([A-Za-z_-]+)\s*=\s*(.*?)\s*$/);
        if (m) paires.push([m[1], m[2].replace(/^["']|["']$/g, "")]);
    }
    for (const [cle, valeur] of paires) if (/^[A-Z_]+$/.test(cle) && !process.env[cle]) process.env[cle] = valeur;
    const compte = (nom) => {
        const i = paires.findIndex(([k]) => k === nom);
        return i >= 0 && paires[i + 1]?.[0] === `password_${nom}` ? [paires[i][1], paires[i + 1][1]] : null;
    };
    const enseignant = compte("enseignant_demo");
    const etudiant = compte("etudiant-iiia_demo") ?? compte("etudiant_demo");
    if (enseignant && !process.env.PROF_EMAIL) [process.env.PROF_EMAIL, process.env.PROF_PASS] = enseignant;
    if (etudiant && !process.env.ETU_EMAIL) [process.env.ETU_EMAIL, process.env.ETU_PASS] = etudiant;
}
const { PROF_EMAIL, PROF_PASS, ETU_EMAIL, ETU_PASS } = process.env;
if (!PROF_EMAIL || !PROF_PASS) throw new Error("PROF_EMAIL et PROF_PASS manquent (docs/presentation/.env.captures)");
const BASE = (process.env.HESTIM_URL || "https://planner.finadmintech.fr").replace(/\/$/, "");
const SORTIE = fileURLToPath(new URL("./captures/", import.meta.url)).replaceAll("\\", "/");
const ECRAN = { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 };
const TELEPHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const bilan = [];

const navigateur = await chromium.launch();

async function session(email, motDePasse, format = ECRAN) {
    const contexte = await navigateur.newContext({ ...format, locale: "fr-FR", colorScheme: "light" });
    const page = await contexte.newPage();
    await page.goto(`${BASE}/connexion`, { waitUntil: "networkidle" });
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', motDePasse);
    await Promise.all([page.waitForURL((u) => !u.pathname.startsWith("/connexion"), { timeout: 30000 }), page.click('button[type="submit"]')]);
    await page.waitForLoadState("networkidle");
    return { contexte, page };
}

/** Va à une adresse (ou reste sur la page), attend, photographie ; une erreur n'arrête pas la suite. */
async function photo(page, nom, chemin, attente = 2500) {
    try {
        if (chemin) await page.goto(`${BASE}${chemin}`, { waitUntil: "networkidle", timeout: 30000 });
        await pause(attente);
        if (/\/connexion|\/login/.test(page.url())) throw new Error("renvoyé vers la connexion");
        await page.screenshot({ path: `${SORTIE}${nom}.png` });
        bilan.push(`  ok      ${nom}  ${chemin ?? "(même page)"}`);
    } catch (e) {
        bilan.push(`  ÉCHEC   ${nom}  ${chemin ?? ""} : ${e.message.split("\n")[0]}`);
    }
}

/** Premier lien de la page dont l'adresse correspond au motif (une classe, un document…). */
async function premierLien(page, motif) {
    const liens = await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href")));
    return liens.find((h) => motif.test(h)) ?? null;
}

/** Ouvre la première classe de « Mes classes » : par son lien s'il y en a un, sinon en cliquant sa carte. */
async function ouvrirClasse(page) {
    await page.goto(`${BASE}/mes-classes`, { waitUntil: "networkidle" });
    const lien = await premierLien(page, /^\/mes-classes\/\d+\/\d+/);
    if (lien) return lien;
    const carte = page.getByText(/étudiants/).first();
    await carte.click();
    await page.waitForURL(/\/mes-classes\/\d+\/\d+/, { timeout: 15000 });
    await page.waitForLoadState("networkidle");
    return new URL(page.url()).pathname;
}

/** L'espace d'une classe : supports, puis les onglets Appel et Élèves. */
async function espaceClasse(page, prefixe) {
    try {
        const classe = await ouvrirClasse(page);
        await photo(page, `${prefixe}-03-classe-supports`, classe, 3000);
        for (const [nom, tab] of [["04-classe-appel", /appel/i], ["05-classe-eleves", /élèves/i]]) {
            try { await onglet(page, tab); await photo(page, `${prefixe}-${nom}`, null); } catch (e) { bilan.push(`  ÉCHEC   ${prefixe}-${nom} : ${e.message.split("\n")[0]}`); }
        }
    } catch (e) {
        bilan.push(`  ÉCHEC   ${prefixe}-03..05 : ${e.message.split("\n")[0]}`);
    }
}

async function onglet(page, nom) {
    const o = page.getByRole("tab", { name: nom });
    if (await o.count()) await o.first().click();
    else await page.getByText(nom, { exact: true }).first().click();
    await page.waitForLoadState("networkidle");
}

// ── Enseignant : Planner ─────────────────────────────────────────────────────
const prof = await session(PROF_EMAIL, PROF_PASS);
// SEULEMENT=classe : refait seulement l'espace d'une classe (ordinateur et téléphone)
if (process.env.SEULEMENT === "classe") {
    await espaceClasse(prof.page, "prof2");
    const tel = await session(PROF_EMAIL, PROF_PASS, TELEPHONE);
    await espaceClasse(tel.page, "prof2-tel");
    await navigateur.close();
    console.log(bilan.join("\n"));
    process.exit(0);
}
await photo(prof.page, "prof2-01-tableau", "/dashboard/enseignant");
await photo(prof.page, "prof2-02-mes-classes", "/mes-classes");
await espaceClasse(prof.page, "prof2");
await photo(prof.page, "prof2-06-mon-service", "/mes-services");
await photo(prof.page, "prof2-07-mes-quiz", "/studio-quiz");
const quiz = await premierLien(prof.page, /^\/studio-quiz\/\d+$/);
if (quiz) await photo(prof.page, "prof2-08-quiz-editeur", quiz, 3000);

// ── Enseignant : la Bibliothèque (connexion unique, même session) ────────────
await photo(prof.page, "biblio-01-documents", "/biblio/documents", 3500);
// Premier document de la liste : lien absolu ou relatif, avec ou sans le préfixe /biblio
let doc = await premierLien(prof.page, /\/documents\/\d+/);
if (doc) {
    doc = doc.startsWith("http") ? new URL(doc).pathname : doc;
    if (!doc.startsWith("/biblio")) doc = `/biblio${doc}`;
    await photo(prof.page, "biblio-02-document", doc, 3500);
}
await photo(prof.page, "biblio-03-supports-modules", "/biblio/modules/supports", 3500);
await photo(prof.page, "biblio-04-stages", "/biblio/internship-reviews", 3500);
await photo(prof.page, "biblio-05-projets", "/biblio/project-ideas", 3500);
await photo(prof.page, "biblio-06-evenements", "/biblio/events", 3500);
await photo(prof.page, "biblio-07-filieres", "/biblio/filieres", 3500);
await photo(prof.page, "biblio-08-moderation", "/biblio/moderation/documents", 3500);
await prof.contexte.close();

// ── Enseignant au format téléphone : il n'a pas d'application, il utilise le site sur son téléphone ──
const profTel = await session(PROF_EMAIL, PROF_PASS, TELEPHONE);
await photo(profTel.page, "prof2-tel-01-tableau", "/dashboard/enseignant");
await photo(profTel.page, "prof2-tel-02-mes-classes", "/mes-classes");
await espaceClasse(profTel.page, "prof2-tel");
await photo(profTel.page, "prof2-tel-05-mes-quiz", "/studio-quiz");
await photo(profTel.page, "biblio-tel-01-documents", "/biblio/documents", 3500);
if (doc) await photo(profTel.page, "biblio-tel-02-document", doc, 3500);
await photo(profTel.page, "biblio-tel-03-supports-modules", "/biblio/modules/supports", 3500);
await photo(profTel.page, "biblio-tel-04-stages", "/biblio/internship-reviews", 3500);
await photo(profTel.page, "biblio-tel-05-projets", "/biblio/project-ideas", 3500);
await profTel.contexte.close();

// ── Étudiant : Mes cours et la Bibliothèque ──────────────────────────────────
if (ETU_EMAIL && ETU_PASS) {
    const etu = await session(ETU_EMAIL, ETU_PASS);
    await photo(etu.page, "etu2-01-mes-cours", "/mes-cours");
    const cours = await premierLien(etu.page, /^\/mes-cours\/\d+\/\d+/);
    if (cours) await photo(etu.page, "etu2-02-cours", cours, 3000);
    await photo(etu.page, "etu2-03-biblio-documents", "/biblio/documents", 3500);
    await photo(etu.page, "etu2-04-biblio-stages", "/biblio/internship-reviews", 3500);
    await photo(etu.page, "etu2-05-biblio-projets", "/biblio/project-ideas", 3500);
    await etu.contexte.close();

    const tel = await session(ETU_EMAIL, ETU_PASS, TELEPHONE);
    await photo(tel.page, "etu2-06-biblio-telephone", "/biblio/documents", 3500);
    await photo(tel.page, "etu2-07-mes-cours-telephone", "/mes-cours", 3000);
    await photo(tel.page, "etu2-08-stages-telephone", "/biblio/internship-reviews", 3500);
    await photo(tel.page, "etu2-09-projets-telephone", "/biblio/project-ideas", 3500);
    await tel.contexte.close();
} else bilan.push("  (pas de compte étudiant : captures etu2-* sautées)");

await navigateur.close();
console.log(`Captures dans ${SORTIE}\n${bilan.join("\n")}`);
