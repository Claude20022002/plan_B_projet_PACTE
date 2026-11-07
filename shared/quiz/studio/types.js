/**
 * Types de questions du Studio quiz (moteur de quiz natif de Planner, docs/plans/studio-quiz.md).
 * Partagé par le serveur (validation, correction), le site (éditeur, joueur) et l'application.
 *
 * Chaque question a la même enveloppe :
 *   { type, enonce, points, explication?, id_media?, extrait?: { debut, fin }, duree_s?, donnees }
 * et `donnees` dépend du type (décrit dans TYPES ci-dessous). Les identifiants des options
 * (« o1 », « p2 »…) sont stables : les réponses des étudiants et le mélange s'y réfèrent.
 */

export const LIMITES = {
    enonce: 1500,
    option: 300,
    explication: 1500,
    options: { min: 2, max: 8 },
    paires: { min: 2, max: 8 },
    elements: { min: 2, max: 8 },
    trous: { min: 1, max: 10 },
    acceptees: 10,
    reponseLibre: 5000,
    points: { min: 0, max: 100 },
    zones: 6,
    // Temps pour répondre en direct, en secondes (vide : celui de la diffusion) ; mêmes bornes que le direct
    duree: { min: 5, max: 120 },
};

/**
 * Catalogue : `auto` dit si la correction est automatique ; `media` si un média est exigé ;
 * `ia` si l'IA sait écrire ce type (une zone sur une image demande des coordonnées qu'elle n'a pas).
 */
export const TYPES = {
    choix_unique: { auto: true, ia: true, icone: "radio" },
    choix_multiple: { auto: true, ia: true, icone: "check" },
    vrai_faux: { auto: true, ia: true, icone: "toggle" },
    reponse_courte: { auto: true, ia: true, icone: "short" },
    numerique: { auto: true, ia: true, icone: "number" },
    texte_trous: { auto: true, ia: true, icone: "blanks" },
    association: { auto: true, ia: true, icone: "match" },
    ordre: { auto: true, ia: true, icone: "order" },
    zone_image: { auto: true, ia: false, media: "image", icone: "hotspot" },
    reponse_libre: { auto: false, ia: true, icone: "essay" },
};

export const CODES_TYPES = Object.keys(TYPES);
export const TYPES_IA = CODES_TYPES.filter((t) => TYPES[t].ia);
export const TYPES_MEDIAS = ["image", "audio", "video"];

// Repère d'un trou dans le texte : {{1}}, {{2}}…
export const MOTIF_TROU = /\{\{(\d{1,2})\}\}/g;

const estTexte = (v) => typeof v === "string";

/** Texte brut sur une ligne (ou plusieurs si `lignes`), sans balise ; null s'il est vide ou trop long. */
export const texteBrut = (valeur, max, { lignes = false } = {}) => {
    if (!estTexte(valeur)) return null;
    let texte = valeur.replace(/<[^>]*>/g, "");
    texte = lignes ? texte.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim() : texte.replace(/\s+/g, " ").trim();
    return texte && texte.length <= max ? texte : null;
};

const idsUniques = (liste) => new Set(liste.map((e) => e.id)).size === liste.length;
const sansDoublon = (textes) => new Set(textes.map((t) => t.toLowerCase())).size === textes.length;

/** Rend une liste d'éléments { id, texte } propres, avec des ids générés si besoin (préfixe). */
const elementsPropres = (brut, prefixe, { min, max }, libelle) => {
    if (!Array.isArray(brut) || brut.length < min || brut.length > max) throw new Error(`${min} à ${max} ${libelle} attendus`);
    const elements = brut.map((e, i) => {
        const texte = texteBrut(typeof e === "string" ? e : e?.texte, LIMITES.option);
        if (!texte) throw new Error(`${libelle} ${i + 1} vide ou trop long`);
        const id = typeof e?.id === "string" && /^[a-z0-9]{1,8}$/i.test(e.id) ? e.id : `${prefixe}${i + 1}`;
        return { id, texte };
    });
    if (!idsUniques(elements)) throw new Error(`${libelle} : identifiants en double`);
    if (!sansDoublon(elements.map((e) => e.texte))) throw new Error(`${libelle} : deux textes identiques`);
    return elements;
};

const accepteesPropres = (brut, libelle = "Réponses acceptées") => {
    const liste = (Array.isArray(brut) ? brut : [brut]).map((a) => texteBrut(String(a ?? ""), LIMITES.option)).filter(Boolean);
    if (!liste.length) throw new Error(`${libelle} : au moins une`);
    if (liste.length > LIMITES.acceptees) throw new Error(`${libelle} : ${LIMITES.acceptees} au plus`);
    return [...new Set(liste)];
};

const nombre = (v) => (typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v.replace(",", ".")) : NaN);

/** Validation des données propres à chaque type ; lève une Error au message affichable. */
const VALIDATEURS = {
    choix_unique: (d) => {
        const options = elementsPropres(d.options, "o", LIMITES.options, "Option");
        const bonne = options.find((o) => o.id === d.bonne)?.id;
        if (!bonne) throw new Error("Choisissez la bonne réponse");
        return { options, bonne };
    },
    choix_multiple: (d) => {
        const options = elementsPropres(d.options, "o", LIMITES.options, "Option");
        const bonnes = [...new Set((Array.isArray(d.bonnes) ? d.bonnes : []).filter((id) => options.some((o) => o.id === id)))];
        if (bonnes.length < 1) throw new Error("Cochez au moins une bonne réponse");
        if (bonnes.length === options.length) throw new Error("Il faut au moins une mauvaise réponse");
        return { options, bonnes, annoncer_nombre: d.annoncer_nombre !== false };
    },
    vrai_faux: (d) => {
        if (typeof d.reponse !== "boolean") throw new Error("Choisissez vrai ou faux");
        return { reponse: d.reponse };
    },
    reponse_courte: (d) => ({
        acceptees: accepteesPropres(d.acceptees),
        casse: d.casse === true,
        accents: d.accents === true,
        fautes: d.fautes === true,
    }),
    numerique: (d) => {
        const valeur = nombre(d.valeur);
        const tolerance = d.tolerance === undefined || d.tolerance === null || d.tolerance === "" ? 0 : nombre(d.tolerance);
        if (!Number.isFinite(valeur)) throw new Error("Valeur attendue : un nombre");
        if (!Number.isFinite(tolerance) || tolerance < 0) throw new Error("Tolérance : un nombre positif");
        const unite = d.unite ? texteBrut(String(d.unite), 20) : null;
        return { valeur, tolerance, unite };
    },
    texte_trous: (d) => {
        const texte = texteBrut(d.texte, LIMITES.enonce, { lignes: true });
        if (!texte) throw new Error("Texte à trous manquant");
        const reperes = [...new Set([...texte.matchAll(MOTIF_TROU)].map((m) => m[1]))];
        if (reperes.length < LIMITES.trous.min || reperes.length > LIMITES.trous.max) throw new Error(`Placez de ${LIMITES.trous.min} à ${LIMITES.trous.max} trous ({{1}}, {{2}}…)`);
        const trous = reperes.map((id) => {
            const brut = (Array.isArray(d.trous) ? d.trous : []).find((t) => String(t?.id) === id);
            if (!brut) throw new Error(`Trou {{${id}}} : réponse manquante`);
            const acceptees = accepteesPropres(brut.acceptees, `Trou {{${id}}}`);
            // Liste déroulante facultative : elle doit contenir une réponse acceptée
            const options = Array.isArray(brut.options) && brut.options.length ? accepteesPropres(brut.options, `Trou {{${id}}}, liste`) : null;
            if (options && !options.some((o) => acceptees.some((a) => a.toLowerCase() === o.toLowerCase()))) throw new Error(`Trou {{${id}}} : la liste doit contenir la bonne réponse`);
            return { id, acceptees, ...(options ? { options } : {}) };
        });
        return { texte, trous, casse: d.casse === true, accents: d.accents === true };
    },
    association: (d) => {
        if (!Array.isArray(d.paires) || d.paires.length < LIMITES.paires.min || d.paires.length > LIMITES.paires.max) throw new Error(`${LIMITES.paires.min} à ${LIMITES.paires.max} paires attendues`);
        const paires = d.paires.map((p, i) => {
            const gauche = texteBrut(p?.gauche, LIMITES.option);
            const droite = texteBrut(p?.droite, LIMITES.option);
            if (!gauche || !droite) throw new Error(`Paire ${i + 1} incomplète`);
            const id = typeof p.id === "string" && /^[a-z0-9]{1,8}$/i.test(p.id) ? p.id : `p${i + 1}`;
            return { id, gauche, droite };
        });
        if (!idsUniques(paires)) throw new Error("Paires : identifiants en double");
        if (!sansDoublon(paires.map((p) => p.gauche)) || !sansDoublon(paires.map((p) => p.droite))) throw new Error("Paires : deux textes identiques");
        const distracteurs = (Array.isArray(d.distracteurs) ? d.distracteurs : []).map((t) => texteBrut(String(t ?? ""), LIMITES.option)).filter(Boolean).slice(0, 4);
        return { paires, distracteurs };
    },
    ordre: (d) => ({ elements: elementsPropres(d.elements, "e", LIMITES.elements, "Élément") }),
    zone_image: (d) => {
        const zones = (Array.isArray(d.zones) ? d.zones : []).map((z) => ({ x: nombre(z?.x), y: nombre(z?.y), l: nombre(z?.l), h: nombre(z?.h) }));
        if (!zones.length || zones.length > LIMITES.zones) throw new Error(`Tracez de 1 à ${LIMITES.zones} zones justes sur l'image`);
        for (const z of zones) {
            const ok = [z.x, z.y, z.l, z.h].every(Number.isFinite) && z.x >= 0 && z.y >= 0 && z.l > 0 && z.h > 0 && z.x + z.l <= 100.01 && z.y + z.h <= 100.01;
            if (!ok) throw new Error("Zone hors de l'image");
        }
        return { zones: zones.map((z) => Object.fromEntries(Object.entries(z).map(([k, v]) => [k, Math.round(v * 100) / 100]))) };
    },
    reponse_libre: (d) => ({
        corrige: d.corrige ? texteBrut(String(d.corrige), LIMITES.explication, { lignes: true }) : null,
        longueur_max: Number.isInteger(d.longueur_max) && d.longueur_max >= 50 && d.longueur_max <= LIMITES.reponseLibre ? d.longueur_max : 1500,
    }),
};

/**
 * Valide et normalise une question complète (éditeur, IA, import).
 * @returns {{ ok: true, question: object } | { ok: false, raison: string }}
 */
export const validerQuestion = (q) => {
    try {
        if (!q || typeof q !== "object") throw new Error("Question illisible");
        if (!TYPES[q.type]) throw new Error("Type de question inconnu");
        const enonce = texteBrut(q.enonce, LIMITES.enonce, { lignes: true });
        if (!enonce || enonce.length < 3) throw new Error("Énoncé manquant ou trop long");
        const points = q.points === undefined || q.points === null ? 1 : nombre(q.points);
        if (!Number.isFinite(points) || points < LIMITES.points.min || points > LIMITES.points.max) throw new Error(`Points : de ${LIMITES.points.min} à ${LIMITES.points.max}`);
        const explication = q.explication ? texteBrut(q.explication, LIMITES.explication, { lignes: true }) : null;
        if (q.explication && !explication) throw new Error("Explication trop longue");
        const idMedia = q.id_media === undefined || q.id_media === null || q.id_media === "" ? null : Number(q.id_media);
        if (idMedia !== null && !Number.isInteger(idMedia)) throw new Error("Média invalide");
        if (TYPES[q.type].media && idMedia === null) throw new Error("Ajoutez l'image sur laquelle cliquer");
        let extrait = null;
        if (q.extrait && (q.extrait.debut !== undefined || q.extrait.fin !== undefined)) {
            const debut = nombre(q.extrait.debut ?? 0);
            const fin = q.extrait.fin === null || q.extrait.fin === undefined || q.extrait.fin === "" ? null : nombre(q.extrait.fin);
            if (!Number.isFinite(debut) || debut < 0 || (fin !== null && (!Number.isFinite(fin) || fin <= debut))) throw new Error("Extrait : la fin doit suivre le début");
            extrait = { debut: Math.round(debut * 10) / 10, fin: fin === null ? null : Math.round(fin * 10) / 10 };
        }
        const dureeS = q.duree_s === undefined || q.duree_s === null || q.duree_s === "" ? null : Math.round(nombre(q.duree_s));
        if (dureeS !== null && (!Number.isFinite(dureeS) || dureeS < LIMITES.duree.min || dureeS > LIMITES.duree.max)) throw new Error(`Durée : de ${LIMITES.duree.min} à ${LIMITES.duree.max} secondes`);
        const donnees = VALIDATEURS[q.type](q.donnees ?? {});
        return { ok: true, question: { type: q.type, enonce, points: Math.round(points * 100) / 100, explication, id_media: idMedia, extrait, duree_s: dureeS, donnees } };
    } catch (erreur) {
        return { ok: false, raison: erreur.message };
    }
};

/** Question vide d'un type, prête pour l'éditeur. */
export const questionVide = (type) => {
    const base = { type, enonce: "", points: 1, explication: "", id_media: null, extrait: null, duree_s: null };
    const options = [
        { id: "o1", texte: "" },
        { id: "o2", texte: "" },
        { id: "o3", texte: "" },
        { id: "o4", texte: "" },
    ];
    const donnees = {
        choix_unique: { options, bonne: null },
        choix_multiple: { options, bonnes: [], annoncer_nombre: true },
        vrai_faux: { reponse: true },
        reponse_courte: { acceptees: [""], casse: false, accents: false, fautes: false },
        numerique: { valeur: "", tolerance: 0, unite: "" },
        texte_trous: { texte: "", trous: [], casse: false, accents: false },
        association: { paires: [1, 2, 3].map((n) => ({ id: `p${n}`, gauche: "", droite: "" })), distracteurs: [] },
        ordre: { elements: [1, 2, 3, 4].map((n) => ({ id: `e${n}`, texte: "" })) },
        zone_image: { zones: [] },
        reponse_libre: { corrige: "", longueur_max: 1500 },
    }[type];
    return { ...base, donnees };
};
