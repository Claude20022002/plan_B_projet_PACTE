import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Règle d'architecture (essai de ME-3a) : le code de production n'importe jamais un fichier de
// tests/. Le clonage des modèles sur une deuxième base (tests/integration/helpers/fabriqueEtablissement.js)
// ne sert qu'aux tests ; ME-3a le remplacera par une vraie fabrique dans models/.

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const TESTS = path.join(RACINE, "tests");
const IGNORES = new Set(["node_modules", "tests", "coverage", "storage"]);
const IMPORT = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)["'](\.{1,2}\/[^"']+)["']/g;

const fichiersDeProduction = (dossier) =>
    fs.readdirSync(dossier, { withFileTypes: true }).flatMap((entree) => {
        const chemin = path.join(dossier, entree.name);
        if (entree.isDirectory()) return IGNORES.has(entree.name) ? [] : fichiersDeProduction(chemin);
        return /\.(m?js)$/.test(entree.name) ? [chemin] : [];
    });

test("aucun fichier de production n'importe un fichier de tests/", () => {
    const fautifs = fichiersDeProduction(RACINE).flatMap((fichier) =>
        [...fs.readFileSync(fichier, "utf8").matchAll(IMPORT)]
            .map(([, cible]) => path.resolve(path.dirname(fichier), cible))
            .filter((cible) => cible.startsWith(TESTS + path.sep))
            .map((cible) => `${path.relative(RACINE, fichier)} → ${path.relative(RACINE, cible)}`)
    );
    expect(fautifs).toEqual([]);
});

test("le contexte d'établissement de production ne contient que le contexte et les résolveurs", () => {
    expect(fs.readdirSync(path.join(RACINE, "contexte")).sort()).toEqual(["etablissement.js", "resolveur.js"]);
});
