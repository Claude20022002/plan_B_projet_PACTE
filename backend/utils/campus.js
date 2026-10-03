/**
 * Campus de HESTIM à Casablanca. Données de référence insérées par la migration 0003 ;
 * l'adresse de Stendhal n'est pas publiée sur hestim.ma : à compléter par l'administration.
 */
export const CAMPUS_HESTIM = [
    { code: "G", nom: "Gandhi", adresse: "293-295 bd Ghandi, quartier Oasis, Casablanca" },
    { code: "ST", nom: "Stendhal", adresse: null },
];

const sansAccents = (texte) => texte.normalize("NFD").replace(/[̀-ͯ]/g, "");

/**
 * Code campus déduit de l'ancien champ libre Salles.batiment.
 * « Gandhi », « Ghandi », « Bâtiment Gandhi » → G ; « Stendhal » → ST ;
 * toute autre valeur → code dérivé du libellé (un campus sera créé pour elle).
 */
export const campusCodeFromBatiment = (batiment) => {
    const libelle = sansAccents(String(batiment || "").trim()).toLowerCase();
    if (!libelle) return "G";
    if (/g(h)?andhi|gh?andi/.test(libelle)) return "G";
    if (libelle.includes("stendhal") || libelle.includes("stendal")) return "ST";
    return libelle
        .replace(/^(batiment|bat\.?|campus)\s+/, "")
        .replace(/[^a-z0-9]+/g, "")
        .toUpperCase()
        .slice(0, 10) || "G";
};
