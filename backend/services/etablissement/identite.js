import { ConfigurationEtablissement } from "../../models/index.js";
import { ErreurMetier } from "../planning/enseignements.js";
import { verifierCouleur } from "../../../shared/couleurs.js";

/**
 * Identité et marque de l'école (plan multi-établissements, D-21, lots ME-1 et ME-11) : nom, nom
 * court, couleurs, logo, expéditeur des courriels, modèle de l'EDT du mois. Tout ce que Planner
 * affiche du nom de l'école passe par ici (courriels, agenda, PDF, écrans), au lieu de « HESTIM »
 * écrit en dur. Lecture gardée en mémoire ; tout changement la renouvelle.
 *
 * Une seule école par installation aujourd'hui : la clé du cache sera celle de l'établissement
 * quand il y en aura plusieurs (D-03 : tout état en mémoire est rangé par établissement).
 */

// Valeurs d'une base qui n'aurait pas encore sa ligne (la migration 0055 la crée)
const DEFAUT = { nom: "Planner", nom_court: "Planner", couleur_principale: "#1D4ED8", couleur_accent: "#0E7490", modele_edt: "planner", expediteur_nom: null, adresse_reponse: null, logo_type: null, logo_maj_le: null };

export const MODELES_EDT = ["planner", "hestim"];
const TYPES_LOGO = ["image/png", "image/jpeg", "image/webp"];
export const TAILLE_LOGO_MAX = 512 * 1024;
const COURRIEL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let cache = null;

/** Identité de l'école (objet simple, sans le logo). */
export const identite = async () => {
    if (!cache) {
        const ligne = await ConfigurationEtablissement.findByPk(1);
        cache = ligne ? ligne.get({ plain: true }) : { ...DEFAUT };
    }
    return cache;
};

/** Nom du produit tel que l'école le voit : « HESTIM Planner », « EMSI Planner ». */
export const nomProduit = async () => {
    const { nom_court: nomCourt } = await identite();
    return nomCourt === "Planner" ? "Planner" : `${nomCourt} Planner`;
};

/** Ce que tout visiteur peut lire, avant même de se connecter (page de connexion, application). */
export const identitePublique = async () => {
    const i = await identite();
    return {
        nom: i.nom,
        nom_court: i.nom_court,
        produit: await nomProduit(),
        couleur_principale: i.couleur_principale,
        couleur_accent: i.couleur_accent,
        modele_edt: i.modele_edt,
        // La version change avec le logo : les navigateurs et l'application rechargent l'image
        logo: i.logo_type ? { version: new Date(i.logo_maj_le ?? 0).getTime() } : null,
    };
};

/** Pour le panneau de configuration (administration) : l'identité publique, l'expéditeur et l'adresse de réponse. */
export const identiteComplete = async () => {
    const { expediteur_nom: expediteurNom, adresse_reponse: adresseReponse } = await identite();
    return { ...(await identitePublique()), expediteur_nom: expediteurNom, adresse_reponse: adresseReponse };
};

/** Oublie la lecture gardée en mémoire (après une modification, et dans les tests). */
export const oublierIdentite = () => {
    cache = null;
};

const texte = (valeur, { min = 1, max, champ }) => {
    const propre = String(valeur ?? "").replace(/\s+/g, " ").trim();
    if (propre.length < min || propre.length > max) throw new ErreurMetier(`${champ} : entre ${min} et ${max} caractères`, 400);
    return propre;
};

/** Modifie l'identité (administration) ; seuls les champs fournis changent. Rend l'identité publique. */
export const modifierIdentite = async (donnees = {}) => {
    const champs = {};
    if ("nom" in donnees) champs.nom = texte(donnees.nom, { min: 2, max: 150, champ: "Nom de l'école" });
    if ("nom_court" in donnees) champs.nom_court = texte(donnees.nom_court, { min: 2, max: 30, champ: "Nom court" });
    for (const [champ, usage] of [["couleur_principale", "principale"], ["couleur_accent", "accent"]]) {
        if (!(champ in donnees)) continue;
        const verdict = verifierCouleur(donnees[champ], usage);
        if (!verdict.valide) throw new ErreurMetier(verdict.message, 400, "COULEUR_ILLISIBLE");
        champs[champ] = donnees[champ].toUpperCase();
    }
    if ("expediteur_nom" in donnees) champs.expediteur_nom = donnees.expediteur_nom ? texte(donnees.expediteur_nom, { max: 100, champ: "Nom de l'expéditeur" }) : null;
    if ("adresse_reponse" in donnees) {
        const adresse = String(donnees.adresse_reponse ?? "").trim();
        if (adresse && !COURRIEL.test(adresse)) throw new ErreurMetier("Adresse de réponse invalide", 400);
        champs.adresse_reponse = adresse || null;
    }
    if ("modele_edt" in donnees) {
        if (!MODELES_EDT.includes(donnees.modele_edt)) throw new ErreurMetier(`Modèle d'EDT : ${MODELES_EDT.join(" ou ")}`, 400);
        champs.modele_edt = donnees.modele_edt;
    }
    if (!Object.keys(champs).length) throw new ErreurMetier("Rien à modifier", 400);
    const [ligne] = await ConfigurationEtablissement.findOrCreate({ where: { id: 1 }, defaults: { id: 1, ...DEFAUT } });
    await ligne.update(champs);
    oublierIdentite();
    return identitePublique();
};

/** Type réel d'une image d'après ses premiers octets (jamais d'après son nom ni ce que dit le client). */
const typeReel = (octets) => {
    if (octets.length >= 8 && octets.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
    if (octets.length >= 3 && octets[0] === 0xff && octets[1] === 0xd8 && octets[2] === 0xff) return "image/jpeg";
    if (octets.length >= 12 && octets.subarray(0, 4).toString("latin1") === "RIFF" && octets.subarray(8, 12).toString("latin1") === "WEBP") return "image/webp";
    return null;
};

/**
 * Date du nouveau logo, au moins une seconde après la précédente : la colonne est à la seconde, et
 * la version du logo (que le site, les navigateurs et l'application gardent en cache) doit changer
 * même si deux logos sont envoyés dans la même seconde.
 */
const dateSuivante = (precedente) => {
    const maintenant = new Date();
    const plancher = precedente ? (Math.floor(new Date(precedente).getTime() / 1000) + 1) * 1000 : 0;
    return maintenant.getTime() >= plancher ? maintenant : new Date(plancher);
};

/**
 * Remplace le logo. PNG, JPEG ou WebP, 512 Ko au plus. Le SVG est refusé : il peut contenir du
 * script, et un logo s'affiche sur toutes les pages.
 */
export const enregistrerLogo = async (octets) => {
    if (!Buffer.isBuffer(octets) || !octets.length) throw new ErreurMetier("Envoyez une image (PNG, JPEG ou WebP)", 400);
    if (octets.length > TAILLE_LOGO_MAX) throw new ErreurMetier("Logo trop lourd : 512 Ko au plus", 413);
    const type = typeReel(octets);
    if (!TYPES_LOGO.includes(type)) throw new ErreurMetier("Format refusé : PNG, JPEG ou WebP seulement", 415);
    const [ligne] = await ConfigurationEtablissement.findOrCreate({ where: { id: 1 }, defaults: { id: 1, ...DEFAUT } });
    await ligne.update({ logo: octets, logo_type: type, logo_maj_le: dateSuivante(ligne.logo_maj_le) });
    oublierIdentite();
    return identitePublique();
};

/** Retire le logo de l'école (le site et l'application affichent alors celui de Planner). */
export const retirerLogo = async () => {
    await ConfigurationEtablissement.update({ logo: null, logo_type: null, logo_maj_le: new Date() }, { where: { id: 1 } });
    oublierIdentite();
    return identitePublique();
};

/** Le logo, ou null. */
export const lireLogo = async () => {
    const ligne = await ConfigurationEtablissement.scope("avecLogo").findByPk(1, { attributes: ["logo", "logo_type", "logo_maj_le"] });
    return ligne?.logo ? { contenu: ligne.logo, type: ligne.logo_type, maj: ligne.logo_maj_le } : null;
};
