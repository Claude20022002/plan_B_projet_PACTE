// Présentation « HESTIM Planner » pour un public non technique (investisseurs, direction, jury) :
// ce que l'école utilise aujourd'hui, ce que la plateforme apporte, ce que chacun y gagne.
// Usage : NODE_PATH=<dossier contenant pptxgenjs, react-icons, react, react-dom, sharp> node construire-investisseurs.js [sortie.pptx]
// Puis les animations (transitions et apparitions, que pptxgenjs n'écrit pas) : python animer.py <sortie.pptx>
const path = require("path");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const pptxgen = require("pptxgenjs");
const Lu = require("react-icons/lu");
// Outil de la compétence pptx qui écrit les couleurs du thème (chemin modifiable : APPLY_THEME=...)
const { applyTheme } = require(process.env.APPLY_THEME || "C:/Users/clusa/.claude/skills/synced/84d264cd-866e-403c-9dca-00468d42ffa1_15fe0107-fc4f-42d8-ad08-9255a1582756/pptx/scripts/apply_theme.js");

const CAPTURES = path.join(__dirname, "..", "captures");
const CAPTURE = (f) => path.join(CAPTURES, f);
const SORTIE = process.argv[2] || path.join(__dirname, "..", "HESTIM-Planner-presentation.pptx");

// Couleurs HESTIM : marine dominant, blanc ; orange, vert et rouge du logo en accents
const THEME = {
    name: "HESTIM Planner",
    headFontFace: "Barlow Condensed",
    bodyFontFace: "Barlow",
    colors: {
        dk1: "0D1326", lt1: "FFFFFF", dk2: "001861", lt2: "EEF1F8",
        accent1: "F26322", accent2: "137D3F", accent3: "DB1F26",
        accent4: "5F6778", accent5: "DADDE5", accent6: "24397F",
        hlink: "001861", folHlink: "5F6778",
    },
};
const HEX = THEME.colors;

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13,333 × 7,5 po
pres.title = "HESTIM Planner, l'école à l'heure";
pres.author = "Projet PACTE, HESTIM";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
const C = pres.SchemeColor;

// ── Images générées : emblème du logo (12 triangles) et icônes ────────────────────────────
const TRIANGLES = [
    ["001861", "0,0 1,0 1,1"], ["DB1F26", "0,0 0,1 1,1"], ["001861", "1,0 1,1 2,1"], ["F26322", "2,0 3,0 2,1"],
    ["001861", "3,0 3,1 2,1"], ["001861", "2,1 3,1 2,2"], ["137D3F", "2,2 3,2 3,3"], ["F26322", "2,2 2,3 3,3"],
    ["DB1F26", "1,2 2,2 2,3"], ["137D3F", "1,2 1,3 0,3"], ["001861", "0,2 1,2 0,3"], ["001861", "1,1 1,2 0,2"],
];
const svgEmbleme = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 3" width="600" height="600">${TRIANGLES.map(([c, p]) => `<polygon points="${p}" fill="#${c}" stroke="#${c}" stroke-width="0.012" stroke-linejoin="round"/>`).join("")}</svg>`;
const png = async (svg, taille) => "image/png;base64," + (await sharp(Buffer.from(svg)).resize(taille, taille).png().toBuffer()).toString("base64");
const icone = (Composant, couleur) => png(ReactDOMServer.renderToStaticMarkup(React.createElement(Composant, { color: `#${couleur}`, size: 256 })), 256);

async function construire() {
    const EMBLEME = await png(svgEmbleme, 600);
    const I = {};
    const icones = {
        mail: Lu.LuMail, pdf: Lu.LuFileText, discussion: Lu.LuMessageCircle, qr: Lu.LuQrCode ?? Lu.LuScan, classe: Lu.LuGraduationCap, livre: Lu.LuBookOpen, manette: Lu.LuGamepad2,
        horloge: Lu.LuClockAlert ?? Lu.LuClock, copie: Lu.LuCopy, cadenas: Lu.LuShieldAlert ?? Lu.LuShield, fleche: Lu.LuArrowRight, coche: Lu.LuCheck,
        ecole: Lu.LuBuilding2, prof: Lu.LuPresentation, etudiant: Lu.LuSmartphone, bouclier: Lu.LuShieldCheck,
    };
    for (const [nom, Composant] of Object.entries(icones)) {
        I[nom] = await icone(Composant, "FFFFFF");
        I[`${nom}Marine`] = await icone(Composant, HEX.dk2);
        I[`${nom}Orange`] = await icone(Composant, HEX.accent1);
    }

    // ── Dispositions : couverture et clôture (marine), contenu (blanc) ─────────────────────
    pres.defineSlideMaster({
        title: "COUVERTURE",
        background: { color: HEX.dk2 },
        objects: [
            { placeholder: { options: { name: "title", type: "title", x: 0.7, y: 3.05, w: 7.2, h: 1.1, fontFace: THEME.headFontFace, fontSize: 60, bold: true, color: C.background1, align: "left", valign: "middle", margin: 0 }, text: "" } },
        ],
    });
    pres.defineSlideMaster({
        title: "CONTENU",
        background: { color: HEX.lt1 },
        margin: [0.4, 0.6, 0.6, 0.6],
        objects: [
            { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.4, w: 12.1, h: 0.8, fontFace: THEME.headFontFace, fontSize: 36, bold: true, color: C.text2, align: "left", valign: "middle", margin: 0 }, text: "" } },
            { image: { data: EMBLEME, x: 0.6, y: 6.98, w: 0.26, h: 0.26 } },
            { text: { text: "HESTIM PLANNER", options: { x: 0.95, y: 6.95, w: 4, h: 0.32, fontFace: THEME.headFontFace, fontSize: 11, bold: true, charSpacing: 2, color: C.accent4, valign: "middle", margin: 0 } } },
        ],
        slideNumber: { x: 12.2, y: 6.95, w: 0.5, h: 0.32, fontFace: THEME.headFontFace, fontSize: 11, color: C.accent4, align: "right" },
    });
    pres.defineSlideMaster({
        title: "CLOTURE",
        background: { color: HEX.dk2 },
        objects: [
            { placeholder: { options: { name: "title", type: "title", x: 0.7, y: 0.5, w: 11.9, h: 0.85, fontFace: THEME.headFontFace, fontSize: 40, bold: true, color: C.background1, align: "left", valign: "middle", margin: 0 }, text: "" } },
        ],
        slideNumber: { x: 12.2, y: 6.95, w: 0.5, h: 0.32, fontFace: THEME.headFontFace, fontSize: 11, color: C.background2, align: "right" },
    });

    /** Téléphone : cadre noir arrondi, capture d'écran de l'application (1080 × 2400) */
    const telephone = (s, fichier, { x, y, h, nom, alt }) => {
        const w = h * (1080 / 2400);
        s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
            x: x - 0.07, y: y - 0.07, w: w + 0.14, h: h + 0.14, rectRadius: 0.18,
            fill: { color: "0B0B0D" }, line: { color: "0B0B0D" },
            shadow: { type: "outer", color: "000000", blur: 14, offset: 5, angle: 90, opacity: 0.35 }, objectName: `${nom}-cadre`,
        });
        s.addImage({ path: CAPTURE(fichier), x, y, w, h, altText: alt, objectName: nom });
        return w;
    };
    /** Icône blanche dans un rond de couleur */
    const pastille = (s, image, { x, y, d = 0.6, couleur = C.text2, nom }) => {
        s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: couleur }, line: { color: couleur }, objectName: `${nom}-rond` });
        s.addImage({ data: image, x: x + d * 0.24, y: y + d * 0.24, w: d * 0.52, h: d * 0.52, objectName: `${nom}-icone` });
    };

    // ── 1. Couverture ───────────────────────────────────────────────────────────────────
    {
        pres.addSection({ title: "Ouverture" });
        const s = pres.addSlide({ masterName: "COUVERTURE", sectionTitle: "Ouverture" });
        s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.7, y: 0.75, w: 1.75, h: 1.75, rectRadius: 0.22, fill: { color: C.background1 }, line: { color: C.background1 }, objectName: "tuile-logo" });
        s.addImage({ data: EMBLEME, x: 0.92, y: 0.97, w: 1.31, h: 1.31, altText: "Emblème HESTIM", objectName: "embleme" });
        s.addText("HESTIM Planner", { placeholder: "title" });
        s.addText("Toute la vie de l'école dans une seule application", { x: 0.7, y: 4.2, w: 7.2, h: 0.95, fontFace: THEME.bodyFontFace, fontSize: 26, color: C.background1, valign: "top", margin: 0, isTextBox: true, objectName: "accroche" });
        s.addText("Emploi du temps · Annonces · Bibliothèque · Activités", { x: 0.7, y: 5.25, w: 7.2, h: 0.45, fontFace: THEME.headFontFace, fontSize: 20, bold: true, charSpacing: 1, color: C.accent1, margin: 0, isTextBox: true, objectName: "services" });
        s.addText("En ligne aujourd'hui · planner.finadmintech.fr", { x: 0.7, y: 6.55, w: 7.2, h: 0.4, fontFace: THEME.bodyFontFace, fontSize: 14, color: C.background2, margin: 0, isTextBox: true, objectName: "adresse" });

        telephone(s, "mobile-37-mois.png", { x: 8.3, y: 1.55, h: 4.95, nom: "telephone-agenda", alt: "Application : le mois en calendrier, chaque jour avec ses cours en couleur" });
        telephone(s, "mobile-38-tableau.png", { x: 10.0, y: 0.85, h: 5.75, nom: "telephone-tableau", alt: "Application : la prochaine séance, sa salle et ses supports de cours" });

        s.addNotes([
            "≈ 20 s.",
            "« Bonjour. Une école, ce sont des centaines de cours chaque mois, des salles qui changent, des annonces, des supports, des devoirs, des quiz… et des étudiants qui doivent savoir, à chaque instant, où aller et quoi préparer.",
            "HESTIM Planner réunit tout cela dans une seule application, sur le téléphone de chaque étudiant et sur l'ordinateur de chaque enseignant. Elle est déjà en ligne. »",
        ].join("\n\n"));
    }

    // ── 2. Aujourd'hui ──────────────────────────────────────────────────────────────────
    {
        pres.addSection({ title: "Le constat" });
        const s = pres.addSlide({ masterName: "CONTENU", sectionTitle: "Le constat" });
        s.addText("Aujourd'hui, l'information de l'école est éparpillée", { placeholder: "title" });

        const outils = [
            ["mail", "Gmail", "Annonces et informations envoyées à tout le monde"],
            ["pdf", "PDF par e-mail", "L'emploi du temps du mois, à re-télécharger à chaque changement"],
            ["classe", "Google Classroom", "Devoirs et échanges avec les enseignants"],
            ["livre", "Moodle", "Cours et supports en ligne"],
            ["manette", "Sites de jeux", "Quiz et jeux externes, en anglais et dans d'autres matières"],
        ];
        const W = 2.45, H = 2.15, G = 0.25;
        outils.forEach(([ic, nom, usage], i) => {
            // Trois cartes en haut, deux centrées en bas
            const ligne = Math.floor(i / 3), decalage = ligne === 1 ? (W + G) / 2 : 0;
            const x = 0.6 + decalage + (i % 3) * (W + G), y = 1.6 + ligne * (H + G);
            s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: W, h: H, rectRadius: 0.12, fill: { color: C.background2 }, line: { color: C.background2 }, objectName: `outil-${i + 1}-carte` });
            pastille(s, I[ic], { x: x + 0.25, y: y + 0.25, d: 0.6, nom: `outil-${i + 1}` });
            s.addText(nom, { x: x + 0.25, y: y + 0.95, w: W - 0.45, h: 0.4, fontFace: THEME.headFontFace, fontSize: 19, bold: true, color: C.text2, valign: "middle", margin: 0, isTextBox: true, objectName: `outil-${i + 1}-nom` });
            s.addText(usage, { x: x + 0.25, y: y + 1.35, w: W - 0.45, h: 0.7, fontFace: THEME.bodyFontFace, fontSize: 13, color: C.accent4, valign: "top", margin: 0, isTextBox: true, objectName: `outil-${i + 1}-usage` });
        });

        // Les conséquences, sur un panneau marine
        const X = 8.85, Y = 1.6, PW = 3.88, PH = 4.55;
        s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: X, y: Y, w: PW, h: PH, rectRadius: 0.12, fill: { color: C.text2 }, line: { color: C.text2 }, objectName: "consequences-panneau" });
        s.addText("5 outils qui ne se parlent pas", { x: X + 0.3, y: Y + 0.25, w: PW - 0.6, h: 0.5, fontFace: THEME.headFontFace, fontSize: 22, bold: true, color: C.accent1, valign: "middle", margin: 0, isTextBox: true, objectName: "consequences-titre" });
        const consequences = [
            ["horlogeOrange", "L'information arrive tard : un report se découvre devant une salle vide."],
            ["copieOrange", "Les équipes saisissent et renvoient la même information plusieurs fois."],
            ["cadenasOrange", "Les données des étudiants sont dispersées chez des services externes."],
        ];
        consequences.forEach(([ic, texte], i) => {
            const y = Y + 1.0 + i * 1.12;
            s.addImage({ data: I[ic], x: X + 0.3, y: y + 0.05, w: 0.38, h: 0.38, objectName: `consequence-${i + 1}-icone` });
            s.addText(texte, { x: X + 0.85, y, w: PW - 1.15, h: 1.0, fontFace: THEME.bodyFontFace, fontSize: 15, color: C.background1, valign: "top", margin: 0, isTextBox: true, objectName: `consequence-${i + 1}` });
        });

        s.addNotes([
            "≈ 35 s.",
            "« Aujourd'hui, l'école travaille avec cinq outils différents. Les informations partent par Gmail, à tout le monde. L'emploi du temps est envoyé en PDF chaque mois, et il faut le re-télécharger à chaque changement. Les devoirs vivent dans Classroom, les cours dans Moodle, et pour jouer en anglais ou réviser, on passe par des sites extérieurs.",
            "Résultat : l'information arrive en retard, les équipes saisissent la même chose plusieurs fois, et les données de nos étudiants sont éparpillées chez des services externes. »",
            "Si on demande : WhatsApp reste le moyen de joindre les parents (absences, retards de paiement) et certains cas particuliers ; la plateforme ne le remplace pas.",
        ].join("\n\n"));
    }

    // ── 3. L'offre ──────────────────────────────────────────────────────────────────────
    {
        pres.addSection({ title: "L'offre" });
        const s = pres.addSlide({ masterName: "CONTENU", sectionTitle: "L'offre" });
        s.addText("Une seule application, quatre services", { placeholder: "title" });
        s.addText("Un seul compte école, sur le téléphone et sur l'ordinateur", { x: 0.6, y: 1.2, w: 12.1, h: 0.4, fontFace: THEME.bodyFontFace, fontSize: 16, color: C.accent4, margin: 0, isTextBox: true, objectName: "sous-titre" });

        const services = [
            ["mobile-37-mois.png", "Emploi du temps vivant", "Toujours à jour, et dans l'agenda du téléphone ou Google Agenda."],
            ["mobile-38-tableau.png", "Annonces et alertes", "Un report, une salle qui change, une annonce : seuls les concernés sont prévenus."],
            ["mobile-39-supports-module.png", "Bibliothèque", "Supports par module, lisibles même hors ligne, retours de stage et idées de projets."],
            ["mobile-13-resultats.png", "Activités", "Quiz, devoirs et jeux choisis par l'enseignant pour vérifier ou s'entraîner."],
        ];
        const CW = 2.75, CG = 0.367;
        services.forEach(([capture, titre, texte], i) => {
            const cx = 0.6 + i * (CW + CG);
            const h = 3.35, w = h * (1080 / 2400);
            telephone(s, capture, { x: cx + (CW - w) / 2, y: 1.85, h, nom: `service-${i + 1}-capture`, alt: `${titre} : ${texte}` });
            s.addText(titre, { x: cx, y: 5.42, w: CW, h: 0.42, fontFace: THEME.headFontFace, fontSize: 20, bold: true, color: C.text2, align: "center", valign: "middle", margin: 0, isTextBox: true, objectName: `service-${i + 1}-titre` });
            s.addText(texte, { x: cx, y: 5.86, w: CW, h: 0.85, fontFace: THEME.bodyFontFace, fontSize: 13, color: C.accent4, align: "center", valign: "top", margin: 0, isTextBox: true, objectName: `service-${i + 1}-texte` });
        });

        s.addNotes([
            "≈ 35 s.",
            "« HESTIM Planner remplace cet éparpillement par une seule application, avec un seul compte.",
            "Quatre services. Un emploi du temps vivant : la semaine, le mois, le détail de chaque cours, toujours à jour, et il s'ajoute même à l'agenda du téléphone. Des annonces et des alertes : un cours reporté, une salle qui change, une information pour une filière ou un groupe, et seuls les étudiants concernés sont prévenus. Une bibliothèque : les supports de chaque module, lisibles même sans connexion, avec les retours de stage des anciens et des idées de projets. Et des activités : quiz, devoirs et jeux, choisis par l'enseignant pour vérifier qu'une notion est comprise ou pour s'entraîner. »",
            "Démonstration possible : ouvrir l'application sur le téléphone (onglets Semaine, Bibliothèque puis Activités).",
        ].join("\n\n"));
    }

    // ── 4. Avant / après ────────────────────────────────────────────────────────────────
    {
        const s = pres.addSlide({ masterName: "CONTENU", sectionTitle: "L'offre" });
        s.addText("Ce que la plateforme remplace", { placeholder: "title" });

        const XG = 0.6, WG = 3.6, XF = 4.42, XD = 5.05, WD = 7.68;
        s.addText("AUJOURD'HUI", { x: XG, y: 1.3, w: WG, h: 0.3, fontFace: THEME.headFontFace, fontSize: 13, bold: true, charSpacing: 3, color: C.accent4, margin: 0, isTextBox: true, objectName: "entete-avant" });
        s.addText("AVEC HESTIM PLANNER", { x: XD, y: 1.3, w: WD, h: 0.3, fontFace: THEME.headFontFace, fontSize: 13, bold: true, charSpacing: 3, color: C.accent2, margin: 0, isTextBox: true, objectName: "entete-apres" });

        const lignes = [
            ["Gmail", "pour les informations", "Des annonces ciblées", " (filière, groupe, classe) et une alerte automatique à chaque report, sur le téléphone des seuls concernés."],
            ["PDF par e-mail", "pour l'emploi du temps", "Un emploi du temps vivant", ", ajouté à l'agenda du téléphone ; le PDF officiel du mois reste disponible."],
            ["Classroom", "pour les devoirs", "Des devoirs en quiz corrigés tout seuls", " ou en fichier à rendre, notés et commentés par l'enseignant."],
            ["Moodle", "pour les cours", "Une bibliothèque rangée par module", " : recherche, lecture sur téléphone, même hors ligne."],
            ["Sites de jeux externes", "pour réviser en jouant", "Des activités choisies par l'enseignant", " : sans publicité ni compte externe, résultats conservés par l'école."],
        ];
        lignes.forEach(([outil, usage, fort, suite], i) => {
            const y = 1.72 + i * 0.97, h = 0.8;
            s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: XG, y, w: WG, h, rectRadius: 0.1, fill: { color: C.background2 }, line: { color: C.background2 }, objectName: `avant-${i + 1}-fond` });
            s.addText([
                { text: outil, options: { bold: true, color: C.text1, fontFace: THEME.headFontFace, fontSize: 18, breakLine: true } },
                { text: usage, options: { color: C.accent4, fontSize: 12 } },
            ], { x: XG + 0.25, y, w: WG - 0.4, h, fontFace: THEME.bodyFontFace, valign: "middle", margin: 0, isTextBox: true, objectName: `avant-${i + 1}` });
            s.addImage({ data: I.flecheMarine, x: XF, y: y + h / 2 - 0.17, w: 0.34, h: 0.34, objectName: `fleche-${i + 1}` });
            pastille(s, I.coche, { x: XD, y: y + h / 2 - 0.21, d: 0.42, couleur: C.accent2, nom: `apres-${i + 1}` });
            s.addText([
                { text: fort, options: { bold: true, color: C.text2 } },
                { text: suite, options: { color: C.text1 } },
            ], { x: XD + 0.6, y, w: WD - 0.6, h, fontFace: THEME.bodyFontFace, fontSize: 15, valign: "middle", margin: 0, isTextBox: true, objectName: `apres-${i + 1}` });
        });

        s.addNotes([
            "≈ 35 s.",
            "« Concrètement, outil par outil. Les informations ne partent plus à tout le monde par Gmail : l'école publie des annonces ciblées, par filière, par groupe ou par classe, et chaque report déclenche une alerte automatique. Le PDF du mois devient un emploi du temps vivant, qui s'ajoute à l'agenda du téléphone, et le PDF officiel reste disponible. Classroom est remplacé par des devoirs en quiz, corrigés tout seuls, ou en fichier à rendre, notés par l'enseignant. Moodle est remplacé par une bibliothèque rangée par module, qu'on lit sur son téléphone, même sans connexion. Et les jeux deviennent des activités choisies par l'enseignant : pas de publicité, pas de compte externe, et l'école garde les résultats. »",
            "Si on demande : WhatsApp reste pour joindre les parents ; l'appel en classe se fait aussi dans l'application, par un QR code que les étudiants scannent.",
        ].join("\n\n"));
    }

    // ── 5. Bénéfices ────────────────────────────────────────────────────────────────────
    {
        pres.addSection({ title: "Les bénéfices" });
        const s = pres.addSlide({ masterName: "CONTENU", sectionTitle: "Les bénéfices" });
        s.addText("Ce que chacun y gagne", { placeholder: "title" });

        const chiffres = [
            ["90 s", "pour proposer l'emploi du temps d'un semestre entier (2 620 séances)"],
            ["1", "compte et une application, au lieu de cinq outils"],
            ["0", "publicité ni compte externe pour les jeux et les quiz"],
        ];
        // Chiffre au-dessus, légende dessous : trois colonnes alignées sur les cartes
        chiffres.forEach(([n, legende], i) => {
            const x = 0.6 + i * 4.13;
            s.addText(n, { x, y: 1.3, w: 3.8, h: 0.9, fontFace: THEME.headFontFace, fontSize: 54, bold: true, color: i === 0 ? C.accent1 : C.text2, valign: "middle", margin: 0, isTextBox: true, objectName: `chiffre-${i + 1}` });
            s.addText(legende, { x, y: 2.2, w: 3.8, h: 0.6, fontFace: THEME.bodyFontFace, fontSize: 14, color: C.accent4, valign: "top", margin: 0, isTextBox: true, objectName: `chiffre-${i + 1}-legende` });
        });

        const publics = [
            ["ecole", "Direction et scolarité", "Le planning du semestre proposé automatiquement, les conflits signalés, les heures et les présences suivies en un coup d'œil."],
            ["prof", "Enseignants", "Leurs cours, l'appel en un QR code, leurs devoirs et leurs activités au même endroit."],
            ["etudiant", "Étudiants", "Leur journée, leurs cours et leurs résultats dans la poche, en français ou en anglais."],
            ["bouclier", "L'école", "Une image moderne et des données hébergées et maîtrisées par l'école."],
        ];
        const W = 2.85, G = 0.233;
        publics.forEach(([ic, titre, texte], i) => {
            const x = 0.6 + i * (W + G), y = 3.1, h = 3.45;
            s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: W, h, rectRadius: 0.12, fill: { color: C.background2 }, line: { color: C.background2 }, objectName: `public-${i + 1}-carte` });
            pastille(s, I[ic], { x: x + 0.28, y: y + 0.3, d: 0.66, nom: `public-${i + 1}` });
            s.addText(titre, { x: x + 0.28, y: y + 1.12, w: W - 0.5, h: 0.45, fontFace: THEME.headFontFace, fontSize: 20, bold: true, color: C.text2, valign: "middle", margin: 0, isTextBox: true, objectName: `public-${i + 1}-titre` });
            s.addText(texte, { x: x + 0.28, y: y + 1.65, w: W - 0.5, h: 1.7, fontFace: THEME.bodyFontFace, fontSize: 14, color: C.text1, valign: "top", margin: 0, isTextBox: true, objectName: `public-${i + 1}-texte` });
        });

        s.addNotes([
            "≈ 35 s.",
            "« Ce que chacun y gagne. Pour la direction et la scolarité : l'emploi du temps d'un semestre entier est proposé automatiquement, 2 620 séances placées en 90 secondes, les conflits sont signalés avant qu'ils ne posent problème, et les présences remontent toutes seules.",
            "Pour les enseignants : l'appel se fait en un QR code, et leurs cours, leurs devoirs et leurs activités sont au même endroit. Pour les étudiants : toute leur vie d'école dans la poche, en français ou en anglais. Et pour l'école : une image moderne, et des données qui restent chez elle. »",
        ].join("\n\n"));
    }

    // ── 6. Clôture ──────────────────────────────────────────────────────────────────────
    {
        pres.addSection({ title: "La suite" });
        const s = pres.addSlide({ masterName: "CLOTURE", sectionTitle: "La suite" });
        s.addText("Déjà en ligne, prêt pour un pilote", { placeholder: "title" });

        s.addText("DISPONIBLE AUJOURD'HUI", { x: 0.7, y: 1.7, w: 5.6, h: 0.4, fontFace: THEME.headFontFace, fontSize: 16, bold: true, charSpacing: 3, color: C.accent1, margin: 0, isTextBox: true, objectName: "disponible-titre" });
        const disponible = [
            "Le site web et l'application iPhone et Android",
            "Les annonces ciblées et l'agenda synchronisé",
            "La bibliothèque, les devoirs et les activités",
            "L'appel en classe par QR code",
        ];
        disponible.forEach((texte, i) => {
            const y = 2.32 + i * 0.88;
            s.addImage({ data: I.cocheOrange, x: 0.7, y: y + 0.1, w: 0.36, h: 0.36, objectName: `disponible-${i + 1}-coche` });
            s.addText(texte, { x: 1.25, y, w: 5.2, h: 0.55, fontFace: THEME.bodyFontFace, fontSize: 17, color: C.background1, valign: "middle", margin: 0, isTextBox: true, objectName: `disponible-${i + 1}` });
        });

        s.addText("LA SUITE", { x: 7.1, y: 1.7, w: 5.5, h: 0.4, fontFace: THEME.headFontFace, fontSize: 16, bold: true, charSpacing: 3, color: C.accent1, margin: 0, isTextBox: true, objectName: "suite-titre" });
        const etapes = [
            "Un pilote d'un semestre, avec une filière",
            "Les notifications sur le téléphone et la publication sur les stores",
            "Toute l'école, puis d'autres établissements",
        ];
        etapes.forEach((texte, i) => {
            const y = 2.3 + i * 1.05;
            s.addShape(pres.shapes.OVAL, { x: 7.1, y, w: 0.58, h: 0.58, fill: { color: C.background1 }, line: { color: C.background1 }, objectName: `etape-${i + 1}-rond` });
            s.addText(String(i + 1), { x: 7.1, y, w: 0.58, h: 0.58, fontFace: THEME.headFontFace, fontSize: 22, bold: true, color: C.text2, align: "center", valign: "middle", margin: 0, isTextBox: true, objectName: `etape-${i + 1}-numero` });
            s.addText(texte, { x: 7.9, y: y - 0.12, w: 4.8, h: 0.82, fontFace: THEME.bodyFontFace, fontSize: 17, color: C.background1, valign: "middle", margin: 0, isTextBox: true, objectName: `etape-${i + 1}` });
        });

        s.addText("HESTIM Planner, l'école à l'heure.", { x: 0.7, y: 5.95, w: 7.5, h: 0.6, fontFace: THEME.headFontFace, fontSize: 30, bold: true, italic: true, color: C.background1, valign: "middle", margin: 0, isTextBox: true, objectName: "signature" });
        s.addText("planner.finadmintech.fr", { x: 8.4, y: 5.95, w: 4.3, h: 0.6, fontFace: THEME.bodyFontFace, fontSize: 18, color: C.background2, align: "right", valign: "middle", margin: 0, isTextBox: true, objectName: "adresse-fin" });

        s.addNotes([
            "≈ 25 s.",
            "« Tout ce que je viens de vous montrer est en ligne aujourd'hui : le site, l'application sur iPhone et Android, les annonces, l'agenda, la bibliothèque, les devoirs, les activités et l'appel par QR code.",
            "Nous proposons de commencer par un pilote d'un semestre avec une filière, d'activer les notifications sur le téléphone et de publier l'application sur les stores, puis d'ouvrir la plateforme à toute l'école, et demain à d'autres établissements.",
            "HESTIM Planner, l'école à l'heure. Merci. »",
        ].join("\n\n"));
    }

    await pres.writeFile({ fileName: SORTIE });
    await applyTheme(SORTIE, THEME);
    console.log(`écrit : ${SORTIE}`);
}

construire().catch((e) => {
    console.error(e);
    process.exit(1);
});
