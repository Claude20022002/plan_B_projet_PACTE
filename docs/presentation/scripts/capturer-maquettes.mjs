// Rend en images les maquettes de quiz de docs/presentation/maquettes (question illustrée, extrait
// vidéo) dans docs/presentation/captures, sous un nom qui commence par « maquette- » : ce sont des
// écrans à venir, pas des captures de l'application. La vidéo les signale par « Bientôt ».
// Lancement (depuis frontend/, où Playwright est installé) :
//   node ../docs/presentation/scripts/capturer-maquettes.mjs
import { readFileSync } from "fs";
import { createRequire } from "module";
import { fileURLToPath, pathToFileURL } from "url";
// Formes des quatre réponses : les mêmes que dans l'application et sur le site du quiz
import { FORMES_KAHOOT } from "../../../mobile/src/quiz/formes.js";

const { chromium } = createRequire(`${process.cwd()}/`)("@playwright/test");

const chemin = (relatif) => fileURLToPath(new URL(relatif, import.meta.url));
const MAQUETTES = chemin("../maquettes/");
const SORTIE = chemin("../captures/");
const POLICES = chemin("../../../mobile/node_modules/@expo-google-fonts/");

// Polices de l'application (thème Planner), lues dans ses dépendances : rien n'est téléchargé
const GRAISSES = { 400: "400Regular", 500: "500Medium", 600: "600SemiBold", 700: "700Bold" };
const police = (famille, dossier, prefixe, graisse) =>
    `@font-face { font-family: "${famille}"; font-weight: ${graisse}; src: url("${pathToFileURL(`${POLICES}${dossier}/${GRAISSES[graisse]}/${prefixe}_${GRAISSES[graisse]}.ttf`).href}"); }`;
const CSS_POLICES = Object.keys(GRAISSES)
    .flatMap((graisse) => [police("Barlow Condensed", "barlow-condensed", "BarlowCondensed", graisse), police("Barlow", "barlow", "Barlow", graisse)])
    .join("\n");

// Petites icônes au trait, dessinées ici (les écrans réels utilisent MaterialCommunityIcons)
const icone = (trace, taille = 24, extra = "") =>
    `<svg viewBox="0 0 24 24" width="${taille}" height="${taille}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${trace}</svg>`;
const INSERTIONS = {
    poutre: readFileSync(`${MAQUETTES}poutre.svg`, "utf8"),
    fermer: icone('<path d="M6 6l12 12M18 6L6 18"/>'),
    loupe: icone('<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5M11 8.5v5M8.5 11h5"/>', 16),
    pause: icone('<path d="M8 5v14M16 5v14"/>', 20),
    son: icone('<path d="M4 9v6h4l5 4V5L8 9H4zM16.5 9a4 4 0 010 6M19 6.5a8 8 0 010 11"/>', 20),
    casque: icone('<path d="M4 15v-3a8 8 0 0116 0v3"/><rect x="3" y="14" width="4" height="6" rx="1"/><rect x="17" y="14" width="4" height="6" rx="1"/>', 16),
    // Barre d'état d'un téléphone : l'heure, puis réseau et batterie
    etat: '<span>10:58</span><svg viewBox="0 0 64 12" fill="#fff"><path d="M0 9h3v3H0zM5 6h3v6H5zM10 3h3v9h-3zM15 0h3v12h-3z"/><rect x="36" y="1" width="24" height="10" rx="2.5" fill="none" stroke="#fff"/><rect x="38" y="3" width="17" height="6" rx="1"/><rect x="61" y="4" width="2" height="4" rx="1"/></svg>',
    // Son de l'extrait : 48 barres de hauteurs fixes (pas de hasard, l'image doit être reproductible)
    onde: Array.from({ length: 48 }, (_, i) => `<i class="${i < 19 ? "lu" : ""}" style="height:${20 + Math.round(70 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.45)))}%"></i>`).join(""),
};

const ECRANS = [
    { page: "quiz-mobile-illustration.html", image: "maquette-quiz-mobile-illustration.png", taille: { width: 390, height: 844 }, echelle: 2 },
    { page: "quiz-mobile-video.html", image: "maquette-quiz-mobile-video.png", taille: { width: 390, height: 844 }, echelle: 2 },
    { page: "quiz-projecteur-illustration.html", image: "maquette-quiz-projecteur-illustration.png", taille: { width: 1920, height: 1080 }, echelle: 1 },
];

const navigateur = await chromium.launch();
for (const { page: fichier, image, taille, echelle } of ECRANS) {
    const contexte = await navigateur.newContext({ viewport: taille, deviceScaleFactor: echelle, locale: "fr-FR" });
    const page = await contexte.newPage();
    await page.goto(pathToFileURL(`${MAQUETTES}${fichier}`).href);
    await page.addStyleTag({ content: CSS_POLICES });
    await page.evaluate(
        ({ insertions, formes }) => {
            document.querySelectorAll("[data-insertion]").forEach((el) => { el.innerHTML = insertions[el.dataset.insertion] ?? ""; });
            document.querySelectorAll("[data-forme]").forEach((el) => { el.style.display = "contents"; el.innerHTML = formes[Number(el.dataset.forme)]; });
        },
        { insertions: INSERTIONS, formes: FORMES_KAHOOT },
    );
    await page.evaluate(() => document.fonts.ready);
    // Une maquette qui déborde de son écran serait coupée sans prévenir : on le vérifie
    const deborde = await page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight || document.documentElement.scrollWidth > window.innerWidth);
    if (deborde) throw new Error(`${fichier} déborde de ${taille.width} × ${taille.height}`);
    await page.screenshot({ path: `${SORTIE}${image}` });
    console.log(`  ${image}`);
    await contexte.close();
}
await navigateur.close();
