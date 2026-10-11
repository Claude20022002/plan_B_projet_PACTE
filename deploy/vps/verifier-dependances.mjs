// Une mise à jour « par superposition » ne remplace que le code : les dépendances npm restent
// celles de l'image du backend. Ce contrôle (lot R-3) compare ce que le code attend
// (package-lock.json du paquet) à ce qui est installé dans l'image (node_modules/.package-lock.json,
// écrit par npm à l'installation). S'il manque un module ou si une version diffère, il faut
// reconstruire l'image et la charger sur le serveur avant d'appliquer le paquet (DEPLOIEMENT.md).
// Lecture seule. Code de sortie : 0 si tout concorde, 1 sinon, 2 si un fichier est illisible.
// Usage : node verifier-dependances.mjs <package-lock.json attendu> <.package-lock.json installé> [modules superposés…]
//   « modules superposés » : modules que le paquet apporte lui-même dans backend/node_modules.
import fs from "fs";

const [cheminAttendu, cheminInstalle, ...superposes] = process.argv.slice(2);
const lire = (chemin) => {
    try {
        return JSON.parse(fs.readFileSync(chemin, "utf8")).packages ?? {};
    } catch (erreur) {
        console.error(`Fichier illisible : ${chemin} (${erreur.message})`);
        process.exit(2);
    }
};
const attendus = lire(cheminAttendu);
const installes = lire(cheminInstalle);
const apportes = new Set(superposes.map((m) => `node_modules/${m}`));

const manquants = [];
const differents = [];
for (const [chemin, paquet] of Object.entries(attendus)) {
    // La racine du projet et les modules de développement ne sont pas dans l'image de production
    if (!chemin.startsWith("node_modules/") || paquet.dev || apportes.has(chemin)) continue;
    const installe = installes[chemin];
    if (!installe) {
        // Facultatif ou pair : absent selon la plate-forme, ce n'est pas une erreur
        if (!paquet.optional && !paquet.devOptional && !paquet.peer) manquants.push(`${chemin.slice(13)}@${paquet.version}`);
    } else if (installe.version !== paquet.version) {
        differents.push(`${chemin.slice(13)} : ${installe.version} dans l'image, ${paquet.version} attendue`);
    }
}

if (!manquants.length && !differents.length) {
    console.log("Dépendances du backend : identiques à celles de l'image.");
    process.exit(0);
}
const extrait = (liste) => liste.slice(0, 15).map((l) => `  - ${l}`).join("\n") + (liste.length > 15 ? `\n  … et ${liste.length - 15} de plus` : "");
console.error("Les dépendances du backend ont changé : la superposition ne suffit pas.");
if (manquants.length) console.error(`Modules absents de l'image (${manquants.length}) :\n${extrait(manquants)}`);
if (differents.length) console.error(`Versions différentes (${differents.length}) :\n${extrait(differents)}`);
console.error("Reconstruire l'image du backend et la charger sur le serveur, puis relancer (DEPLOIEMENT.md, « Quand les dépendances changent »).");
process.exit(1);
