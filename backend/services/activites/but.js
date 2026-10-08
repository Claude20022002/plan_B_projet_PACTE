import { ErreurMetier } from "../planning/enseignements.js";

/**
 * But d'une activité (quiz, jeu, devoir) choisi par l'enseignant : vérifier la compréhension d'un
 * cours ou d'une notion, ou faire s'entraîner ; et la notion visée, facultative.
 */
export const BUTS = ["verifier", "entrainer"];
export const NOTION_MAX = 120;

/** { but, notion } validés ; `defaut` quand le but n'est pas donné. */
export const butEtNotion = (donnees = {}, defaut) => {
    const { but, notion } = donnees;
    if (but !== undefined && but !== null && but !== "" && !BUTS.includes(but)) throw new ErreurMetier("but : verifier ou entrainer", 400);
    const texte = typeof notion === "string" ? notion.trim() : "";
    if (texte.length > NOTION_MAX) throw new ErreurMetier(`notion : ${NOTION_MAX} caractères au plus`, 400);
    return { but: BUTS.includes(but) ? but : defaut, notion: texte || null };
};
