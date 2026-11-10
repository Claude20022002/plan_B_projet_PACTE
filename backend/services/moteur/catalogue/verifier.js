/**
 * Contrôles du catalogue du moteur de planification. Fonctions pures : elles reçoivent le catalogue
 * chargé et rendent la liste des erreurs (vide si tout va bien). Le test du catalogue les exécute
 * en CI ; `coherenceDesValeurs` servira aussi au moteur de validation, avant chaque calcul.
 */

export const ROLES = ["contexte", "donnee", "regle", "pilotage", "indicateur", "gestion"];
export const FORCES = ["strict", "souple", "sans_objet"];
export const NIVEAUX = /^(G|P|I|GP|GI|PI|GPI)$/;
export const MODIFIABLES = ["non", "plateforme", "etablissement", "responsable", "personne"];
export const VALIDITES = ["permanent", "annee", "periode", "datee", "generation"];
export const ETATS = ["solveur", "saisie", "parametre", "base", "plan", "absent"];
export const TYPES = ["booleen", "entier", "decimal", "pourcentage", "texte", "duree_min", "heure", "date", "jour", "liste_jours", "plage_horaire", "plage_dates", "enum", "liste", "reference", "liste_references", "matrice", "structure", "montant", "distance_km"];
export const TYPES_DEPENDANCE = ["requiert", "derive_de", "active_si", "borne", "exclut", "tension"];
// Ces deux types décident de l'ordre de calcul : un cycle les rendrait impossibles à évaluer
const TYPES_ORDONNES = ["requiert", "derive_de"];
const OPERATEURS = ["<=", ">=", "=", "!=", "contient"];

/**
 * Liste les éléments du référentiel source (docs/ecole/para.txt) avec une référence stable :
 * « 5.33 » (section 5, élément 33), ou « 16A.2 » (section 16, partie A, deuxième puce).
 */
export const extraireSources = (texte) => {
    let section = null;
    let lettre = "";
    let puces = 0;
    const elements = [];
    for (const brute of texte.split(/\r?\n/)) {
        const ligne = brute.trim();
        const titre = ligne.match(/^(\d{1,2})\. (Les grandes|Paramètres|La distinction)/);
        if (titre) {
            section = Number(titre[1]);
            lettre = "";
            puces = 0;
            continue;
        }
        if (section === null || section === 1) continue;
        const partie = ligne.match(/^([A-E])\. /);
        if (partie) {
            lettre = partie[1];
            if ([3, 16, 17, 18].includes(section)) puces = 0;
            continue;
        }
        const numero = ligne.match(/^(\d+)\. (.+)/);
        if (numero) {
            elements.push({ ref: `${section}.${numero[1]}`, texte: numero[2] });
            continue;
        }
        const puce = ligne.match(/^- (.+)/);
        if (puce) {
            puces += 1;
            elements.push({ ref: `${section}${lettre}.${puces}`, texte: puce[1] });
        }
    }
    return elements;
};

// Types dont la valeur se contrôle ici ; les structures et références le seront à la saisie
const CONTROLES_DE_TYPE = {
    booleen: (v) => typeof v === "boolean",
    entier: Number.isInteger,
    decimal: (v) => typeof v === "number",
    pourcentage: (v) => typeof v === "number" && v >= 0 && v <= 100,
    duree_min: (v) => Number.isInteger(v) && v >= 0,
    heure: (v) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v),
    enum: () => true,
};

/** La valeur est-elle du type annoncé ? Une valeur absente l'est toujours : elle n'est pas renseignée. */
export const valeurDuBonType = (p, v) => v === null || v === undefined || (CONTROLES_DE_TYPE[p.type]?.(v) ?? true);

/** Propriétés d'un paramètre : les valeurs admises, la cohérence entre rôle, force et poids. */
export const verifierParametres = (parametres) => {
    const erreurs = [];
    const vus = new Set();
    for (const p of parametres) {
        const e = (m) => erreurs.push(`${p.id} : ${m}`);
        if (vus.has(p.id)) e("identifiant en double");
        vus.add(p.id);
        if (!/^[A-Z]{3}\.[A-Z_]+\.[A-Z0-9_]+$/.test(p.id)) e("identifiant mal formé");
        if (!p.nom) e("nom manquant");
        if (!p.description) e("description manquante");
        if (!ROLES.includes(p.role)) e(`rôle inconnu : ${p.role}`);
        if (!TYPES.includes(p.type)) e(`type inconnu : ${p.type}`);
        if (!valeurDuBonType(p, p.defaut)) e(`valeur par défaut du mauvais type : ${p.defaut}`);
        if (p.type === "enum" && !p.valeurs?.length) e("une énumération doit lister ses valeurs");
        if (p.type === "enum" && p.defaut !== null && !p.valeurs?.includes(p.defaut)) e(`valeur par défaut hors liste : ${p.defaut}`);
        if (!NIVEAUX.test(p.niveaux)) e(`niveau inconnu : ${p.niveaux}`);
        if (/I/.test(p.niveaux) && !p.cible) e("le niveau individuel doit dire sa cible (enseignant, groupe, salle...)");
        if (!MODIFIABLES.includes(p.modifiable)) e(`modification inconnue : ${p.modifiable}`);
        if (!VALIDITES.includes(p.validite)) e(`validité inconnue : ${p.validite}`);
        if (!ETATS.includes(p.etat)) e(`état inconnu : ${p.etat}`);
        if (!(p.priorite >= 1 && p.priorite <= 5)) e(`priorité hors de 1 à 5 : ${p.priorite}`);
        if (!FORCES.includes(p.force)) e(`force inconnue : ${p.force}`);
        if (p.role === "regle" && p.force === "sans_objet") e("une règle est stricte ou souple");
        if (p.force === "souple" && !(p.poids > 0)) e("une règle souple doit avoir un poids");
        if (p.force === "strict" && p.poids !== null) e("une règle stricte n'a pas de poids");
        if (p.regle_solveur && p.etat !== "solveur") e("une règle du solveur a l'état « solveur »");
    }
    return erreurs;
};

/** Chaque élément du référentiel source est repris par un paramètre, et aucun paramètre ne cite un élément inconnu. */
export const verifierCouverture = (parametres, elements) => {
    const connus = new Set(elements.map((x) => x.ref));
    const cites = new Set(parametres.flatMap((p) => p.sources));
    const erreurs = elements.filter((x) => !cites.has(x.ref)).map((x) => `source non reprise : ${x.ref} ${x.texte}`);
    for (const p of parametres) {
        for (const s of p.sources) if (!connus.has(s)) erreurs.push(`${p.id} : source inconnue ${s}`);
    }
    return erreurs;
};

/**
 * Rang de calcul de chaque paramètre : 0 s'il ne dépend de rien, sinon un de plus que ce dont il
 * dépend. Un paramètre pris dans un cycle n'a pas de rang : il est listé dans `cycle`.
 */
export const rangsDeCalcul = (parametres, dependances) => {
    const entrees = new Map(parametres.map((p) => [p.id, []]));
    for (const d of dependances.filter((x) => TYPES_ORDONNES.includes(x.type))) entrees.get(d.de)?.push(d.vers);
    const rangs = new Map();
    let restants = [...entrees.keys()];
    for (let progres = true; progres && restants.length; ) {
        progres = false;
        const suivants = [];
        for (const id of restants) {
            if (entrees.get(id).every((x) => rangs.has(x) || !entrees.has(x))) {
                rangs.set(id, Math.max(-1, ...entrees.get(id).map((x) => rangs.get(x) ?? -1)) + 1);
                progres = true;
            } else suivants.push(id);
        }
        restants = suivants;
    }
    return { rangs, cycle: restants };
};

/** Identifiants connus, types et opérateurs admis, aucun cycle, et chaque règle dit ce qu'elle lit. */
export const verifierDependances = (parametres, dependances) => {
    const ids = new Set(parametres.map((p) => p.id));
    const erreurs = [];
    for (const d of dependances) {
        const nom = `${d.type} ${d.de} -> ${d.vers}`;
        if (!TYPES_DEPENDANCE.includes(d.type)) erreurs.push(`type de dépendance inconnu : ${nom}`);
        if (!ids.has(d.de)) erreurs.push(`paramètre inconnu à gauche : ${nom}`);
        if (!ids.has(d.vers)) erreurs.push(`paramètre inconnu à droite : ${nom}`);
        if (d.de === d.vers) erreurs.push(`dépendance sur lui-même : ${nom}`);
        if (["active_si", "borne"].includes(d.type) && !OPERATEURS.includes(d.op)) erreurs.push(`opérateur manquant : ${nom}`);
    }
    const { cycle } = rangsDeCalcul(parametres, dependances);
    if (cycle.length) erreurs.push(`cycle de dépendances : ${cycle.join(", ")}`);
    const lisent = new Set(dependances.filter((d) => d.type === "requiert").map((d) => d.de));
    for (const p of parametres.filter((x) => x.role === "regle" && !lisent.has(x.id))) erreurs.push(`règle sans entrée : ${p.id}`);
    return erreurs;
};

const compare = (a, op, b) => {
    if (op === "<=") return a <= b;
    if (op === ">=") return a >= b;
    if (op === "=") return a === b;
    if (op === "!=") return a !== b;
    return [a].flat().includes(b);
};

// Un absent ne viole rien : la règle ne s'applique pas tant que la valeur n'est pas renseignée
const renseigne = (v) => v !== null && v !== undefined;

/**
 * Cohérence d'un jeu de valeurs : les bornes entre paramètres et les exclusions sont-elles tenues ?
 * @param {Map<string, *>} valeurs valeur retenue de chaque paramètre
 */
export const coherenceDesValeurs = (valeurs, dependances) => {
    const erreurs = [];
    for (const d of dependances) {
        const a = valeurs.get(d.de);
        const b = valeurs.get(d.vers);
        if (d.type === "borne" && renseigne(a) && renseigne(b) && !compare(a, d.op, b)) erreurs.push(`${d.de} (${a}) doit être ${d.op} ${d.vers} (${b})`);
        if (d.type === "exclut" && a === true && b === true) erreurs.push(`${d.de} et ${d.vers} s'excluent`);
    }
    return erreurs;
};

/** Valeurs d'un profil posées sur les valeurs par défaut du catalogue. */
export const valeursDuProfil = (profil, parametres) => {
    const valeurs = new Map(parametres.map((p) => [p.id, p.defaut]));
    for (const [id, reglage] of Object.entries(profil.reglages)) if ("valeur" in reglage) valeurs.set(id, reglage.valeur);
    return valeurs;
};

/** Un profil ne règle que des paramètres connus, et ne change la force que là où le catalogue l'admet. */
export const verifierProfil = (profil, parametres, dependances) => {
    const parId = new Map(parametres.map((p) => [p.id, p]));
    const erreurs = [];
    for (const [id, reglage] of Object.entries(profil.reglages)) {
        const p = parId.get(id);
        if (!p) {
            erreurs.push(`${profil.code} : paramètre inconnu ${id}`);
            continue;
        }
        if (!valeurDuBonType(p, reglage.valeur)) erreurs.push(`${profil.code} : ${id} du mauvais type : ${reglage.valeur}`);
        if (p.type === "enum" && "valeur" in reglage && reglage.valeur !== null && !p.valeurs.includes(reglage.valeur)) erreurs.push(`${profil.code} : ${id} hors liste : ${reglage.valeur}`);
        if ("force" in reglage && !p.force_reglable) erreurs.push(`${profil.code} : la force de ${id} n'est pas réglable`);
        if ("poids" in reglage && (reglage.force ?? p.force) !== "souple") erreurs.push(`${profil.code} : ${id} n'est pas souple, il n'a pas de poids`);
        // Une règle stricte n'a pas de poids au catalogue : l'assouplir sans en donner un la rendrait sans effet
        if (p.force_reglable && reglage.force === "souple" && !(reglage.poids > 0) && !(p.poids > 0)) erreurs.push(`${profil.code} : ${id} devient souple sans poids`);
    }
    return [...erreurs, ...coherenceDesValeurs(valeursDuProfil(profil, parametres), dependances).map((m) => `${profil.code} : ${m}`)];
};
