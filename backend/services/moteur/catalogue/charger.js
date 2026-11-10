import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Charge le catalogue des paramètres du moteur de planification (docs/conception/moteur-planification).
 * Le catalogue est une donnée : il décrit chaque paramètre, ses valeurs par défaut et ses dépendances.
 * Les valeurs d'une école vivront ailleurs, dans ses versions de paramètres datées (D-07).
 * Les fichiers JSON regroupent les paramètres par groupe : les propriétés communes sont écrites une
 * seule fois (« defauts »), et ce chargeur rend chaque paramètre complet.
 */

const RACINE = path.dirname(fileURLToPath(import.meta.url));

const lireDossier = (dossier) =>
    readdirSync(path.join(RACINE, dossier))
        .filter((f) => f.endsWith(".json"))
        .sort()
        .map((f) => JSON.parse(readFileSync(path.join(RACINE, dossier, f), "utf8")));

// Un paramètre qui n'est pas une règle n'a ni force ni poids : ces deux colonnes sont « sans objet »
const completer = (categorie, groupe, brut) => {
    const p = { ...groupe.defauts, ...brut };
    // La valeur par défaut d'un groupe ne vaut que pour le type du groupe : une durée n'hérite pas d'un « faux »
    if (!("defaut" in brut) && p.type !== groupe.defauts.type) p.defaut = null;
    const estRegle = p.role === "regle";
    return {
        id: `${categorie.code}.${groupe.code}.${p.code}`,
        nom: p.nom,
        description: p.desc,
        categorie: categorie.code,
        groupe: groupe.code,
        role: p.role,
        type: p.type,
        valeurs: p.valeurs ?? null,
        defaut: p.defaut ?? null,
        niveaux: p.niveaux ?? "G",
        cible: p.cible ?? null,
        obligatoire: p.obligatoire ?? false,
        force: estRegle ? p.force : "sans_objet",
        force_reglable: estRegle ? (p.force_reglable ?? false) : false,
        priorite: p.priorite ?? 3,
        poids: estRegle && p.force === "souple" ? p.poids ?? null : null,
        modifiable: p.modifiable ?? "etablissement",
        validite: p.validite ?? "permanent",
        etat: p.etat ?? "absent",
        ref: p.ref ?? null,
        regle_solveur: p.regle_solveur ?? null,
        sources: p.src ? String(p.src).split(/\s+/) : [],
    };
};

/** Les familles du catalogue, chacune avec ses paramètres complets. */
export const chargerFamilles = () =>
    lireDossier("parametres").map((categorie) => ({
        code: categorie.code,
        nom: categorie.nom,
        role: categorie.role,
        groupes: categorie.groupes.map((g) => ({ code: g.code, nom: g.nom, parametres: g.parametres.map((p) => completer(categorie, g, p)) })),
    }));

/** Tous les paramètres, à plat. */
export const chargerParametres = () => chargerFamilles().flatMap((f) => f.groupes.flatMap((g) => g.parametres));

/** Les profils pédagogiques : un réglage de départ du même moteur, jamais un autre générateur. */
export const chargerProfils = () => lireDossier("profils");

/** Les dépendances, une ligne par paire : « vers » peut être écrit en liste dans les fichiers. */
export const chargerDependances = () =>
    lireDossier("dependances").flatMap((fichier) =>
        fichier.dependances.flatMap((d) => [d.vers].flat().map((vers) => ({ ...d, vers, theme: fichier.theme })))
    );
