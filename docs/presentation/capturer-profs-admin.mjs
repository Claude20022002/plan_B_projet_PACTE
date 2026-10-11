// Captures du site pour la vidéo, côté enseignant et côté administration (1920 × 1080, plus deux
// écrans de l'enseignant au format téléphone). Fichiers prof-*.png et admin-*.png dans captures/.
// Prévu pour une plateforme LOCALE sur une base de démonstration jetable : le script ouvre un appel
// et coche des présents. Ne pas le pointer sur la production.
// Identifiants par l'environnement, jamais écrits ici :
//   HESTIM_URL (par ex. http://localhost:5174), PROF_EMAIL, PROF_PASS, ADMIN_EMAIL, ADMIN_PASS
//   HORLOGE (facultatif) : date vue par le navigateur, la même que celle du serveur de captures
// Lancement (depuis frontend/, où Playwright est installé) :
//   node ../docs/presentation/capturer-profs-admin.mjs
import { createRequire } from "module";
import { fileURLToPath } from "url";

const { chromium } = createRequire(`${process.cwd()}/`)("@playwright/test");

const BASE = process.env.HESTIM_URL;
if (!BASE || /finadmintech|hestim\.ma/.test(BASE)) throw new Error("HESTIM_URL doit désigner une plateforme locale de démonstration");
const SORTIE = fileURLToPath(new URL("./captures/", import.meta.url)).replaceAll("\\", "/");
const HORLOGE = process.env.HORLOGE ? new Date(process.env.HORLOGE) : null;
const ECRAN = { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 };
const TELEPHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const PRESENTS = 11; // étudiants cochés avant de capturer l'appel
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const navigateur = await chromium.launch();

/** Session connectée d'un rôle, dans le format demandé (écran ou téléphone). */
async function session(email, motDePasse, format = ECRAN) {
    const contexte = await navigateur.newContext({ ...format, locale: "fr-FR", timezoneId: "UTC", colorScheme: "dark" });
    const page = await contexte.newPage();
    // Le navigateur voit la même date que le serveur de captures (« aujourd'hui », séance en cours)
    if (HORLOGE) await page.clock.setFixedTime(HORLOGE);
    await page.goto(`${BASE}/connexion`, { waitUntil: "networkidle" });
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', motDePasse);
    await Promise.all([page.waitForURL((u) => !u.pathname.startsWith("/connexion"), { timeout: 20000 }), page.click('button[type="submit"]')]);
    await page.waitForLoadState("networkidle");
    return { contexte, page };
}

/** Capture d'une page (`chemin` nul : la page déjà affichée), une fois ses animations finies. */
const photo = async (page, nom, chemin, attente = 2500) => {
    if (chemin) await page.goto(`${BASE}${chemin}`, { waitUntil: "networkidle" });
    await pause(attente);
    await page.screenshot({ path: `${SORTIE}${nom}.png` });
    console.log(`  ${nom}.png`);
};

/** Appel à l'API depuis la page, avec le jeton CSRF de la session (comme le fait le site). */
const api = (page, methode, chemin, corps) =>
    page.evaluate(
        async ({ methode, chemin, corps }) => {
            const jeton = document.cookie.split("; ").find((c) => c.startsWith("csrf_token="))?.split("=")[1];
            const reponse = await fetch(`/api${chemin}`, { method: methode, credentials: "include", headers: { "Content-Type": "application/json", "X-CSRF-Token": decodeURIComponent(jeton ?? "") }, body: corps ? JSON.stringify(corps) : undefined });
            return { statut: reponse.status, donnees: await reponse.json().catch(() => null) };
        },
        { methode, chemin, corps },
    );

// ── Enseignant : son tableau, ses classes, l'appel et sa projection, les activités
let idSeance = null;
{
    const s = await session(process.env.PROF_EMAIL, process.env.PROF_PASS);
    await photo(s.page, "prof-01-tableau", null, 3500);
    await photo(s.page, "prof-02-emploi-du-temps", "/emploi-du-temps/enseignant");
    await photo(s.page, "prof-03-mes-classes", "/mes-classes");

    // La séance du jour (en cours, sinon la première d'aujourd'hui) : c'est elle dont on fait l'appel
    const classes = (await api(s.page, "GET", "/enseignants/mes-classes")).donnees ?? [];
    const aujourdhui = (HORLOGE ?? new Date()).toISOString().slice(0, 10);
    const duJour = classes.map((c) => c.prochaine_seance).filter((p) => p?.date === aujourdhui);
    idSeance = (duJour.find((p) => p.en_cours) ?? duJour[0])?.id_affectation ?? null;
    if (idSeance) {
        // La page ouvre l'appel à son arrivée ; on coche ensuite des présents, comme après des scans
        await s.page.goto(`${BASE}/appel/${idSeance}`, { waitUntil: "networkidle" });
        await pause(1500);
        const liste = (await api(s.page, "GET", `/presences/seances/${idSeance}`)).donnees;
        const attendus = liste?.etudiants ?? [];
        for (const etudiant of attendus.slice(0, PRESENTS)) await api(s.page, "PUT", `/presences/seances/${idSeance}/etudiants/${etudiant.id_user}`, { present: true });
        console.log(`  appel de la séance ${idSeance} : ${Math.min(PRESENTS, attendus.length)} présents sur ${attendus.length}`);
        await photo(s.page, "prof-04-appel", `/appel/${idSeance}`, 3000);
        await photo(s.page, "prof-05-appel-projection", `/appel/${idSeance}/projection`, 3000);
    } else {
        console.log("  (aucune séance aujourd'hui pour cet enseignant : appel non capturé)");
    }
    await photo(s.page, "prof-06-activites", "/jeux");
    await photo(s.page, "prof-07-mes-services", "/mes-services");
    await s.contexte.close();
}

// ── Enseignant sur son téléphone : « Mes classes » et l'appel
{
    const s = await session(process.env.PROF_EMAIL, process.env.PROF_PASS, TELEPHONE);
    await photo(s.page, "prof-08-mes-classes-telephone", "/mes-classes");
    if (idSeance) await photo(s.page, "prof-09-appel-telephone", `/appel/${idSeance}`, 3000);
    await s.contexte.close();
}

// ── Administration : tableau de bord, préparation, génération, emploi du temps du mois, suivi
{
    const s = await session(process.env.ADMIN_EMAIL, process.env.ADMIN_PASS);
    await photo(s.page, "admin-01-tableau", null, 3500);
    await photo(s.page, "admin-02-preparation", "/gestion/preparation");
    await photo(s.page, "admin-03-generation", "/gestion/generation-automatique");
    await photo(s.page, "admin-04-edt-mensuel", "/emploi-du-temps/mensuel", 3500);
    await photo(s.page, "admin-05-suivi", "/gestion/suivi");
    await photo(s.page, "admin-06-emplois-du-temps", "/gestion/emplois-du-temps", 3500);
    await photo(s.page, "admin-07-enseignements", "/gestion/enseignements");
    await photo(s.page, "admin-08-salles", "/gestion/salles");
    await photo(s.page, "admin-09-signalements-presence", "/gestion/signalements-presence");
    await s.contexte.close();
}

await navigateur.close();
console.log(`Captures dans ${SORTIE}`);
