import JSZip from "jszip";
import mammoth from "mammoth";
import { ErreurMetier } from "../planning/enseignements.js";
import { SIGNATURES } from "../../utils/fichiers.js";

/**
 * Texte d'un support de cours, découpé en repères citables (plan docs/plans/quiz-ia.md, lot IA-2) :
 * page d'un PDF, diapositive d'un PowerPoint (notes de l'orateur comprises), partie d'un Word
 * (un Word n'a pas de pages fixes : parties d'environ MOTS_PAR_PARTIE mots).
 * Le fichier n'est lu qu'en mémoire et n'est jamais conservé.
 */

export const TAILLE_MAX = 20 * 1024 * 1024;
// Au-delà, on demande une plage de pages plutôt que de couper le support sans le dire
export const MOTS_MAX = 30000;
const MOTS_MIN = 30;
const MOTS_PAR_PARTIE = 400;
// Archives Office : taille décompressée bornée (protection contre les « bombes zip »)
const DECOMPRESSE_MAX = 200 * 1024 * 1024;
const DIAPOSITIVES_MAX = 500;
const PAGES_MAX = 1000;

const PDF = "application/pdf";
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const PPTX = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
export const TYPES_SUPPORTS = [PDF, DOCX, PPTX];

const compterMots = (texte) => (texte.match(/\S+/g) ?? []).length;
const nettoyer = (texte) =>
    String(texte ?? "")
        .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, " ")
        .replace(/[ \t ]+/g, " ")
        .replace(/\s*\n\s*/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

// ── PDF (pdfjs-dist, chargé à la demande : lourd, et seulement pour cette fonction) ──
const lirePdf = async (contenu) => {
    const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
    // isEvalSupported : jamais d'évaluation de code venu du fichier (CVE-2024-4367)
    const chargement = getDocument({ data: new Uint8Array(contenu), isEvalSupported: false, disableFontFace: true, useSystemFonts: false, verbosity: 0 });
    let document;
    try {
        document = await chargement.promise;
    } catch (erreur) {
        await chargement.destroy();
        if (erreur?.name === "PasswordException") throw new ErreurMetier("Ce PDF est protégé par un mot de passe", 422);
        throw new ErreurMetier("Ce PDF est illisible ou endommagé", 422);
    }
    try {
        if (document.numPages > PAGES_MAX) throw new ErreurMetier(`PDF de plus de ${PAGES_MAX} pages : choisissez un extrait`, 422);
        const unites = [];
        for (let n = 1; n <= document.numPages; n += 1) {
            const page = await document.getPage(n);
            const { items } = await page.getTextContent();
            const texte = items.map((i) => `${i.str}${i.hasEOL ? "\n" : " "}`).join("");
            unites.push({ numero: n, repere: `page ${n}`, texte: nettoyer(texte) });
            page.cleanup();
        }
        return unites;
    } finally {
        await chargement.destroy();
    }
};

// ── Archives Office (DOCX, PPTX) ──
const ouvrirArchive = async (contenu) => {
    let archive;
    try {
        archive = await JSZip.loadAsync(contenu);
    } catch {
        throw new ErreurMetier("Ce document est illisible ou endommagé", 422);
    }
    const total = Object.values(archive.files).reduce((t, f) => t + (f._data?.uncompressedSize ?? 0), 0);
    if (total > DECOMPRESSE_MAX) throw new ErreurMetier("Ce document est trop volumineux une fois décompressé", 413);
    return archive;
};

const ENTITES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
const decoder = (texte) =>
    texte.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, e) =>
        e[0] === "#" ? String.fromCodePoint(e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : ENTITES[e.toLowerCase()]
    );

/** Texte d'une diapositive : un paragraphe (<a:p>) par ligne, les fragments (<a:t>) bout à bout. */
const texteDrawingML = (xml) =>
    xml
        .split(/<\/a:p>/)
        .map((p) => [...p.matchAll(/<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/g)].map((m) => decoder(m[1])).join(""))
        .filter((ligne) => ligne.trim())
        .join("\n");

const numeroDe = (chemin) => Number(/(\d+)\.xml$/.exec(chemin)?.[1] ?? 0);

const lirePptx = async (contenu) => {
    const archive = await ouvrirArchive(contenu);
    const diapositives = Object.keys(archive.files)
        .filter((c) => /^ppt\/slides\/slide\d+\.xml$/.test(c))
        .sort((a, b) => numeroDe(a) - numeroDe(b));
    if (!diapositives.length) throw new ErreurMetier("Cette présentation ne contient aucune diapositive", 422);
    if (diapositives.length > DIAPOSITIVES_MAX) throw new ErreurMetier(`Présentation de plus de ${DIAPOSITIVES_MAX} diapositives : choisissez un extrait`, 422);
    const unites = [];
    for (const chemin of diapositives) {
        const n = numeroDe(chemin);
        const texte = texteDrawingML(await archive.file(chemin).async("string"));
        // Notes de l'orateur : souvent l'explication du cours, utile pour les questions
        const notes = archive.file(`ppt/notesSlides/notesSlide${n}.xml`);
        // (sans la ligne du numéro de diapositive que PowerPoint place dans les notes)
        const texteNotes = notes ? nettoyer(texteDrawingML(await notes.async("string")).replace(/^\d+$/gm, "")) : "";
        unites.push({ numero: n, repere: `diapositive ${n}`, texte: nettoyer([texte, texteNotes && `Notes : ${texteNotes}`].filter(Boolean).join("\n")) });
    }
    return unites;
};

const lireDocx = async (contenu) => {
    await ouvrirArchive(contenu);
    let texte;
    try {
        ({ value: texte } = await mammoth.extractRawText({ buffer: contenu }));
    } catch {
        throw new ErreurMetier("Ce document Word est illisible ou endommagé", 422);
    }
    // Pas de pages dans un Word : des parties de ~MOTS_PAR_PARTIE mots, coupées entre deux paragraphes
    const parties = [];
    let courante = [];
    let mots = 0;
    for (const paragraphe of nettoyer(texte).split("\n").filter(Boolean)) {
        courante.push(paragraphe);
        mots += compterMots(paragraphe);
        if (mots >= MOTS_PAR_PARTIE) {
            parties.push(courante.join("\n"));
            courante = [];
            mots = 0;
        }
    }
    if (courante.length) parties.push(courante.join("\n"));
    return parties.map((t, i) => ({ numero: i + 1, repere: `partie ${i + 1}`, texte: t }));
};

/** « 3-10 », « 5 », « 1-3, 8 » → numéros retenus ; vide : tout. */
export const lirePlage = (plage, max) => {
    const texte = String(plage ?? "").trim();
    if (!texte) return null;
    const numeros = new Set();
    for (const morceau of texte.split(/[,;]/).map((m) => m.trim()).filter(Boolean)) {
        const m = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(morceau);
        if (!m) throw new ErreurMetier(`Plage invalide : « ${morceau} » (exemple : 3-10, 12)`, 400);
        const [debut, fin] = [Number(m[1]), Number(m[2] ?? m[1])];
        if (debut < 1 || fin < debut || fin > max) throw new ErreurMetier(`Plage hors du document : « ${morceau} » (1 à ${max})`, 400);
        for (let n = debut; n <= fin; n += 1) numeros.add(n);
    }
    return numeros;
};

const LECTEURS = { [PDF]: lirePdf, [DOCX]: lireDocx, [PPTX]: lirePptx };

/**
 * @param {{ contenu: Buffer, type: string, nom?: string }} fichier
 * @param {{ plage?: string }} options plage de pages, diapositives ou parties (« 3-10, 12 »)
 * @returns {Promise<{ format: string, total: number, unites: { numero, repere, texte }[], mots: number }>}
 */
export const extraireSupport = async ({ contenu, type, nom }, { plage } = {}) => {
    const typeMime = String(type ?? "").split(";")[0].trim().toLowerCase();
    if (!LECTEURS[typeMime]) {
        const ancien = /\.(doc|ppt)$/i.test(String(nom ?? ""));
        throw new ErreurMetier(ancien ? "Ancien format Office (.doc, .ppt) : enregistrez le document en .docx ou .pptx" : "Support : PDF, Word (.docx) ou PowerPoint (.pptx) seulement", 415);
    }
    if (!Buffer.isBuffer(contenu) || !contenu.length) throw new ErreurMetier("Fichier vide", 400);
    if (contenu.length > TAILLE_MAX) throw new ErreurMetier(`Support : ${TAILLE_MAX / 1024 / 1024} Mo au plus`, 413);
    if (!SIGNATURES[typeMime](contenu)) throw new ErreurMetier("Le contenu du fichier ne correspond pas à son type", 415);

    const toutes = await LECTEURS[typeMime](contenu);
    const retenus = lirePlage(plage, toutes.length);
    const unites = toutes.filter((u) => u.texte && (!retenus || retenus.has(u.numero)));
    const mots = unites.reduce((t, u) => t + compterMots(u.texte), 0);
    if (mots < MOTS_MIN) {
        throw new ErreurMetier(
            typeMime === PDF ? "Ce PDF ne contient pas de texte lisible (document scanné ?) : utilisez la version d'origine du support" : "Ce support ne contient presque pas de texte",
            422
        );
    }
    if (mots > MOTS_MAX) throw new ErreurMetier(`Support trop long (${mots} mots) : choisissez une plage de ${typeMime === PPTX ? "diapositives" : "pages"}`, 413);
    return { format: { [PDF]: "pdf", [DOCX]: "docx", [PPTX]: "pptx" }[typeMime], total: toutes.length, unites, mots };
};
