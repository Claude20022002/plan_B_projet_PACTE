// Deck de 3 slides « HESTIM Planner » (pitch de 3 minutes), charte « panneau des départs ».
const path = require("path");
const pptxgen = require("pptxgenjs");
const { applyTheme } = require("C:/Users/clusa/.claude/skills/synced/7073e5c3-c1b6-49bc-ae64-a5086124f95c_833feeb0-80fa-42de-b146-e532fc01e609/pptx/scripts/apply_theme.js");

const IMG = (f) => path.join(__dirname, "img", f);
const SORTIE = process.argv[2] || path.join(__dirname, "hestim-planner-pitch.pptx");

const THEME = {
    name: "HESTIM Panneau",
    headFontFace: "Barlow Condensed",
    bodyFontFace: "Barlow",
    colors: {
        dk1: "0B0B0D", lt1: "F2F1EC", dk2: "001861", lt2: "A6A6AC",
        accent1: "3FCB74", accent2: "F26322", accent3: "FF5A5F",
        accent4: "212124", accent5: "2C2C30", accent6: "DB1F26",
        hlink: "F2F1EC", folHlink: "A6A6AC",
    },
};

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13,333 × 7,5 po
pres.title = "HESTIM Planner — l'école, à l'heure";
pres.author = "Projet PACTE — HESTIM";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
const C = pres.SchemeColor;

pres.defineSlideMaster({
    title: "PANNEAU",
    background: { color: THEME.colors.dk1 },
    objects: [
        { placeholder: { options: { name: "title", type: "title", x: 1.75, y: 0.42, w: 10.9, h: 0.9, fontFace: THEME.headFontFace, fontSize: 40, bold: true, color: C.background1, align: "left", valign: "middle", margin: 0 }, text: "" } },
        { text: { text: "HESTIM PLANNER · planner.finadmintech.fr", options: { x: 0.6, y: 6.95, w: 6, h: 0.3, fontFace: THEME.headFontFace, fontSize: 11, charSpacing: 2, color: C.background2, margin: 0 } } },
    ],
    slideNumber: { x: 12.2, y: 6.95, w: 0.5, h: 0.3, fontFace: THEME.headFontFace, fontSize: 11, color: C.background2, align: "right" },
});

/** Tuiles à volets : une case sombre par caractère, charnière noire à mi-hauteur. */
function volets(slide, texte, { x, y, w = 0.42, h = 0.56, ecart = 0.05, taille = 26, couleur = C.background1, nom = "volets" }) {
    [...texte].forEach((car, i) => {
        const cx = x + i * (w + ecart);
        if (car === " ") return;
        slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cx, y, w, h, rectRadius: 0.04, fill: { color: C.accent4 }, line: { color: C.accent4 }, objectName: `${nom}-case-${i}` });
        slide.addText(car, { x: cx, y, w, h, align: "center", valign: "middle", fontFace: THEME.headFontFace, fontSize: taille, bold: true, color: couleur, margin: 0, isTextBox: true, objectName: `${nom}-lettre-${i}` });
        slide.addShape(pres.shapes.LINE, { x: cx, y: y + h / 2, w, h: 0, line: { color: "000000", width: 1 }, objectName: `${nom}-charniere-${i}` });
    });
    return x + texte.length * (w + ecart) - ecart;
}

const numeroSlide = (slide, n) => volets(slide, n, { x: 0.6, y: 0.59, w: 0.42, h: 0.56, taille: 26, nom: "numero" });

// ── Slide 1 — Le problème ──────────────────────────────────────────────────
{
    const s = pres.addSlide({ masterName: "PANNEAU" });
    numeroSlide(s, "01");
    s.addText("Tout existe. Rien ne se parle", { placeholder: "title" });

    // Panneau : ce qui se passe aujourd'hui, avec un statut comme sur un tableau des départs
    const X = 0.6, Y = 1.75, W = 7.3;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: X, y: Y, w: W, h: 4.6, rectRadius: 0.06, fill: { color: "121214" }, line: { color: C.text2, width: 3 }, objectName: "panneau-cadre" });
    const colonnes = [[X + 0.3, 2.1, "SUJET"], [X + 2.5, 2.9, "AUJOURD'HUI"], [X + 5.45, 1.6, "STATUT"]];
    colonnes.forEach(([cx, cw, t]) => s.addText(t, { x: cx, y: Y + 0.22, w: cw, h: 0.35, fontFace: THEME.headFontFace, fontSize: 12, bold: true, charSpacing: 3, color: C.background2, margin: 0, isTextBox: true, align: t === "STATUT" ? "right" : "left" }));
    const lignes = [
        ["Emploi du temps", "Tableur, puis PDF, chaque mois", "EN RETARD", C.accent2],
        ["Reports de cours", "Messages WhatsApp", "EN RETARD", C.accent2],
        ["Supports de cours", "Drive, groupes de discussion", "ÉPARPILLÉS", C.accent3],
        ["Quiz en classe", "Kahoot, Wooclap", "RÉSULTATS PERDUS", C.accent3],
    ];
    lignes.forEach(([sujet, outil, statut, couleur], i) => {
        const ly = Y + 0.75 + i * 0.93;
        s.addShape(pres.shapes.LINE, { x: X + 0.25, y: ly, w: W - 0.5, h: 0, line: { color: C.accent5, width: 1 } });
        s.addText(sujet.toUpperCase(), { x: X + 0.3, y: ly + 0.12, w: 2.2, h: 0.65, fontFace: THEME.headFontFace, fontSize: 17, bold: true, color: C.background1, valign: "middle", margin: 0, isTextBox: true });
        s.addText(outil, { x: X + 2.5, y: ly + 0.12, w: 2.95, h: 0.65, fontFace: THEME.bodyFontFace, fontSize: 14, color: C.background2, valign: "middle", margin: 0, isTextBox: true });
        s.addText(statut, { x: X + 5.25, y: ly + 0.12, w: 1.8, h: 0.65, fontFace: THEME.headFontFace, fontSize: 15, bold: true, charSpacing: 1, color: couleur, align: "right", valign: "middle", margin: 0, isTextBox: true });
    });

    // Chiffre clé
    volets(s, "1", { x: 8.55, y: 1.85, w: 0.95, h: 1.25, taille: 66, nom: "chiffre" });
    s.addText("nouvel emploi du temps par mois, préparé à la main", { x: 9.75, y: 1.85, w: 2.95, h: 1.25, fontFace: THEME.headFontFace, fontSize: 22, bold: true, color: C.background1, valign: "middle", margin: 0, isTextBox: true });
    s.addText([
        { text: "11 filières, 2 campus (Gandhi et Stendhal), des séances en demi-journée, des vacataires, le Ramadan, la pause du vendredi.", options: { breakLine: true } },
        { text: "Un report se découvre souvent devant une salle vide.", options: { color: C.background1, bold: true } },
    ], { x: 8.55, y: 3.45, w: 4.15, h: 2.3, fontFace: THEME.bodyFontFace, fontSize: 16, color: C.background2, valign: "top", margin: 0, paraSpaceAfter: 10, isTextBox: true });

    s.addNotes([
        "0:36 – 1:10 · Le problème (après la vidéo d'ouverture).",
        "« Chaque mois, HESTIM publie un nouvel emploi du temps. Il est préparé à la main, dans des tableurs, puis envoyé en PDF. Quand un cours est reporté, l'information circule par WhatsApp, et certains l'apprennent devant une salle vide.",
        "Les supports de cours sont éparpillés entre Drive et les groupes de discussion. Les quiz passent par des sites extérieurs, Kahoot ou Wooclap, et les résultats sont perdus.",
        "Bref : tout existe, mais rien ne se parle. »",
    ].join("\n\n"));
}

// ── Slide 2 — La solution ──────────────────────────────────────────────────
{
    const s = pres.addSlide({ masterName: "PANNEAU" });
    numeroSlide(s, "02");
    s.addText("Une plateforme, trois promesses", { placeholder: "title" });

    const promesses = [
        ["L'EDT se construit seul", "Un solveur d'optimisation (Timefold) place 2 620 séances en 90 secondes, sous toutes les règles de l'école."],
        ["Chacun voit sa journée", "Un panneau des départs sur le web, et l'application mobile prévient au moindre report."],
        ["Une seule connexion", "Supports du cours depuis la séance ; quiz lancé en un clic, rejoint sans code."],
    ];
    promesses.forEach(([titre, texte], i) => {
        const py = 1.75 + i * 1.58;
        volets(s, String(i + 1), { x: 0.6, y: py, w: 0.5, h: 0.66, taille: 30, couleur: C.accent1, nom: `promesse-${i + 1}` });
        s.addText(titre.toUpperCase(), { x: 1.3, y: py - 0.02, w: 3.25, h: 0.45, fontFace: THEME.headFontFace, fontSize: 19, bold: true, charSpacing: 1, color: C.background1, margin: 0, isTextBox: true });
        s.addText(texte, { x: 1.3, y: py + 0.45, w: 3.25, h: 0.95, fontFace: THEME.bodyFontFace, fontSize: 14, color: C.background2, valign: "top", margin: 0, isTextBox: true });
    });

    // Capture web (tableau enseignant) et téléphone (tableau étudiant), en léger chevauchement
    const web = { x: 4.95, y: 1.75, w: 6.1 };
    web.h = web.w * (612 / 940);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: web.x - 0.06, y: web.y - 0.06, w: web.w + 0.12, h: web.h + 0.12, rectRadius: 0.08, fill: { color: C.accent5 }, line: { color: C.accent5 }, shadow: { type: "outer", color: "000000", blur: 12, offset: 4, angle: 90, opacity: 0.5 }, objectName: "capture-web-cadre" });
    s.addImage({ path: IMG("tableau-enseignant.png"), x: web.x, y: web.y, w: web.w, h: web.h, altText: "Tableau de l'enseignant : panneau des départs avec la séance en vedette et le bouton Lancer un quiz", objectName: "capture-web" });

    const tel = { h: 4.95 };
    tel.w = tel.h * (1080 / 2400);
    tel.x = 12.73 - tel.w;
    tel.y = 1.5;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: tel.x - 0.09, y: tel.y - 0.09, w: tel.w + 0.18, h: tel.h + 0.18, rectRadius: 0.22, fill: { color: "000000" }, line: { color: C.accent5, width: 1.5 }, shadow: { type: "outer", color: "000000", blur: 16, offset: 6, angle: 90, opacity: 0.6 }, objectName: "telephone-cadre" });
    s.addImage({ path: IMG("m-01-tableau.png"), x: tel.x, y: tel.y, w: tel.w, h: tel.h, rounding: false, altText: "Application mobile : prochaine séance, salle, supports du cours et quiz en cours", objectName: "capture-mobile" });

    s.addText("En ligne sur planner.finadmintech.fr : tableau enseignant (web) et application étudiant (Android).", { x: web.x, y: web.y + web.h + 0.22, w: 5.4, h: 0.5, fontFace: THEME.bodyFontFace, fontSize: 11, italic: true, color: C.background2, margin: 0, isTextBox: true });

    s.addNotes([
        "1:10 – 2:25 · La solution (et la démo).",
        "« HESTIM Planner réunit tout cela dans une seule plateforme.",
        "Un : le semestre se construit tout seul. Un solveur d'optimisation, Timefold, place les cours en respectant toutes les règles de l'école : disponibilités des enseignants, salles, campus Gandhi et Stendhal, pause du vendredi, Ramadan. Sur le serveur en ligne, il a déployé 2 620 séances et placé 261 enseignements en 90 secondes, et il signale lui-même ce qui reste à arbitrer.",
        "Deux : chacun voit sa journée en temps réel. L'écran s'inspire des panneaux d'aéroport : la prochaine séance, la salle, et les changements en orange. Sur mobile, l'étudiant est prévenu au moindre report.",
        "Trois : une seule connexion pour tout. Les supports du cours s'ouvrent depuis la séance, et l'enseignant lance un quiz en un clic : ses étudiants sont prévenus et rejoignent la partie sans saisir de code. »",
        "Si le temps le permet (20 s) : montrer l'écran Jeux sur le téléphone, ou ouvrir planner.finadmintech.fr en direct.",
    ].join("\n\n"));
}

// ── Slide 3 — Ce que ça change ─────────────────────────────────────────────
{
    const s = pres.addSlide({ masterName: "PANNEAU" });
    numeroSlide(s, "03");
    s.addText("En ligne aujourd'hui", { placeholder: "title" });

    const chiffres = [
        ["2620", "séances générées et déployées sur le semestre"],
        ["82", "supports de cours importés depuis Drive"],
        ["442", "tests automatiques sur les six services"],
    ];
    chiffres.forEach(([n, legende], i) => {
        const cy = 1.8 + i * 1.42;
        const fin = volets(s, n, { x: 0.6, y: cy, w: 0.62, h: 0.84, taille: 40, nom: `chiffre-${i + 1}` });
        s.addText(legende, { x: Math.max(fin + 0.3, 3.55), y: cy, w: 3.3, h: 0.84, fontFace: THEME.bodyFontFace, fontSize: 16, color: C.background1, valign: "middle", margin: 0, isTextBox: true });
    });

    // Architecture : six services, une connexion
    const X = 7.55, W = 5.18;
    s.addText("SIX SERVICES, UNE CONNEXION", { x: X, y: 1.75, w: W, h: 0.4, fontFace: THEME.headFontFace, fontSize: 16, bold: true, charSpacing: 3, color: C.background2, margin: 0, isTextBox: true });
    const services = [
        ["Planner", "Node.js, API et règles"],
        ["Web", "React, panneau des départs"],
        ["Solveur", "Java, Timefold"],
        ["Bibliothèque", "Laravel (StudyLib)"],
        ["Jeux", "ClassQuiz, OpenID Connect"],
        ["Mobile", "Expo, React Native"],
    ];
    services.forEach(([nom, techno], i) => {
        const ry = 2.25 + i * 0.6;
        s.addShape(pres.shapes.LINE, { x: X, y: ry, w: W, h: 0, line: { color: C.accent5, width: 1 } });
        s.addText(nom.toUpperCase(), { x: X, y: ry + 0.06, w: 1.7, h: 0.48, fontFace: THEME.headFontFace, fontSize: 16, bold: true, color: C.background1, valign: "middle", margin: 0, isTextBox: true });
        s.addText(techno, { x: X + 1.75, y: ry + 0.06, w: 2.35, h: 0.48, fontFace: THEME.bodyFontFace, fontSize: 13, color: C.background2, valign: "middle", margin: 0, isTextBox: true });
        s.addText("EN LIGNE", { x: X + 4.05, y: ry + 0.06, w: 1.13, h: 0.48, fontFace: THEME.headFontFace, fontSize: 13, bold: true, charSpacing: 1, color: C.accent1, align: "right", valign: "middle", margin: 0, isTextBox: true });
    });

    // L'adresse, en volets
    volets(s, "PLANNER.FINADMINTECH.FR", { x: 0.6, y: 6.12, w: 0.36, h: 0.5, ecart: 0.04, taille: 20, nom: "adresse" });
    s.addText("L'école, à l'heure.", { x: 9.9, y: 6.12, w: 2.83, h: 0.5, fontFace: THEME.headFontFace, fontSize: 22, bold: true, italic: true, color: C.background1, align: "right", valign: "middle", margin: 0, isTextBox: true });

    s.addNotes([
        "2:25 – 3:00 · Ce que ça change.",
        "« Pour la scolarité, des heures gagnées chaque mois et un emploi du temps sans conflit. Pour les enseignants, un service suivi et des quiz intégrés. Pour les étudiants, la bonne information, au bon moment, dans leur poche.",
        "Le projet est en ligne aujourd'hui, à l'adresse planner.finadmintech.fr. Il est construit comme une vraie plateforme : six services qui se parlent, une connexion unique sécurisée, et plus de 440 tests automatiques.",
        "HESTIM Planner : l'école, à l'heure. Merci. »",
    ].join("\n\n"));
}

(async () => {
    await pres.writeFile({ fileName: SORTIE });
    await applyTheme(SORTIE, THEME);
    console.log(`écrit : ${SORTIE}`);
})();
