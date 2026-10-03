import { Groupe } from "../../models/index.js";
import { RANG_TYPE_GROUPE } from "../../config/referentiel.js";

/**
 * Groupes emboîtés (promotion ⊃ TD ⊃ TP). Les relations se calculent en mémoire :
 * une filière compte au plus quelques dizaines de groupes.
 */

/** Ancêtres d'un groupe, du parent direct à la promotion. */
export const ancetres = (groupe, parId) => {
    const resultat = [];
    const vus = new Set([groupe.id_groupe]);
    let courant = parId.get(groupe.id_groupe_parent);
    while (courant && !vus.has(courant.id_groupe)) {
        resultat.push(courant);
        vus.add(courant.id_groupe);
        courant = parId.get(courant.id_groupe_parent);
    }
    return resultat;
};

/** Descendants d'un groupe (sous-groupes, puis leurs sous-groupes). */
export const descendants = (groupe, groupes) => {
    const resultat = [];
    const aVisiter = [groupe.id_groupe];
    const vus = new Set(aVisiter);
    while (aVisiter.length) {
        const parent = aVisiter.shift();
        for (const enfant of groupes) {
            if (enfant.id_groupe_parent === parent && !vus.has(enfant.id_groupe)) {
                resultat.push(enfant);
                vus.add(enfant.id_groupe);
                aVisiter.push(enfant.id_groupe);
            }
        }
    }
    return resultat;
};

/**
 * Identifiants des groupes qu'une séance de `idGroupe` occupe aussi : le groupe, ses
 * ancêtres (un TP est pris quand sa promotion a cours) et ses descendants
 * (une promotion est prise quand l'un de ses TP a cours). Sert à la détection de conflits.
 */
export const groupesLies = async (idGroupe, transaction) => {
    const groupe = await Groupe.findByPk(idGroupe, { transaction });
    if (!groupe) return [];
    const groupes = await Groupe.findAll({ where: { id_filiere: groupe.id_filiere }, transaction });
    const parId = new Map(groupes.map((g) => [g.id_groupe, g]));
    return [groupe, ...ancetres(groupe, parId), ...descendants(groupe, groupes)].map((g) => g.id_groupe);
};

/** Vrai si l'un des groupes est l'ancêtre d'un autre (mutualisation impossible : même étudiants). */
export const contientParentEtEnfant = (groupes, tousLesGroupes) => {
    const parId = new Map(tousLesGroupes.map((g) => [g.id_groupe, g]));
    const ids = new Set(groupes.map((g) => g.id_groupe));
    return groupes.some((g) => ancetres(g, parId).some((a) => ids.has(a.id_groupe)));
};

/**
 * Vérifie qu'un parent peut accueillir un enfant : même filière, type strictement plus large
 * (promotion > td > tp), pas de cycle. Retourne un message d'erreur ou null.
 */
export const verifierParent = async ({ id_groupe, id_filiere, type_groupe }, idParent) => {
    if (!idParent) return null;
    const parent = await Groupe.findByPk(idParent);
    if (!parent) return "Groupe parent introuvable";
    if (Number(parent.id_filiere) !== Number(id_filiere)) return "Le groupe parent doit appartenir à la même filière";
    if (RANG_TYPE_GROUPE[parent.type_groupe] >= RANG_TYPE_GROUPE[type_groupe]) {
        return "Le parent doit être plus large : une promotion contient des TD, un TD contient des TP";
    }
    if (id_groupe) {
        const groupes = await Groupe.findAll({ where: { id_filiere } });
        const parId = new Map(groupes.map((g) => [g.id_groupe, g]));
        if (Number(idParent) === Number(id_groupe) || ancetres(parent, parId).some((a) => a.id_groupe === Number(id_groupe))) {
            return "Un groupe ne peut pas être rangé sous l'un de ses propres sous-groupes";
        }
    }
    return null;
};

/** Arbre des groupes d'une filière : promotions → TD → TP, triés par nom. */
export const construireArbre = (groupes) => {
    const noeuds = new Map(groupes.map((g) => [g.id_groupe, { ...g.toJSON(), sous_groupes: [] }]));
    const racines = [];
    for (const noeud of noeuds.values()) {
        const parent = noeuds.get(noeud.id_groupe_parent);
        if (parent) parent.sous_groupes.push(noeud);
        else racines.push(noeud);
    }
    const trier = (liste) => {
        liste.sort((a, b) => (a.annee ?? 0) - (b.annee ?? 0) || a.nom_groupe.localeCompare(b.nom_groupe, "fr"));
        liste.forEach((n) => trier(n.sous_groupes));
        return liste;
    };
    return trier(racines);
};
