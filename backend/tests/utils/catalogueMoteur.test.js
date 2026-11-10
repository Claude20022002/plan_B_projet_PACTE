import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chargerDependances, chargerParametres, chargerProfils } from "../../services/moteur/catalogue/charger.js";
import { coherenceDesValeurs, extraireSources, rangsDeCalcul, valeursDuProfil, verifierCouverture, verifierDependances, verifierParametres, verifierProfil } from "../../services/moteur/catalogue/verifier.js";

// Le catalogue est une donnée que le moteur lira : ces tests l'empêchent de dériver sans bruit.

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const parametres = chargerParametres();
const dependances = chargerDependances();
const profils = chargerProfils();
const parId = new Map(parametres.map((p) => [p.id, p]));

describe("catalogue du moteur : paramètres", () => {
    test("chaque paramètre a toutes ses propriétés, et elles sont cohérentes", () => {
        expect(verifierParametres(parametres)).toEqual([]);
    });

    test("aucun élément du référentiel source n'est perdu (docs/ecole/para.txt)", () => {
        const elements = extraireSources(readFileSync(path.join(RACINE, "docs/ecole/para.txt"), "utf8"));
        expect(elements).toHaveLength(640);
        expect(verifierCouverture(parametres, elements)).toEqual([]);
    });

    test("chaque règle du solveur a son paramètre, et aucun paramètre n'invente de règle", () => {
        const java = readFileSync(path.join(RACINE, "solver/src/main/java/ma/hestim/solver/contraintes/ContraintesEmploiDuTemps.java"), "utf8");
        // Les trois conflits passent leur nom à une fonction commune ; les autres à asConstraint
        const dansLeCode = [...java.matchAll(/asConstraint\("([^"]+)"\)|, "([^"]+)"\);/g)].map((m) => m[1] ?? m[2]);
        const dansLeCatalogue = parametres.map((p) => p.regle_solveur).filter(Boolean);
        expect(dansLeCode).toHaveLength(22);
        expect([...dansLeCatalogue].sort()).toEqual([...dansLeCode].sort());
    });

    test("chaque colonne citée par le catalogue existe vraiment dans son modèle", () => {
        const dossier = path.join(RACINE, "backend/models");
        const modeles = new Set(readdirSync(dossier).map((f) => f.replace(".js", "")));
        const fausses = [];
        for (const p of parametres) {
            for (const [, modele, colonne] of (p.ref ?? "").matchAll(/\b([A-Z][A-Za-z]+)\.([a-z_]+)\b/g)) {
                if (!modeles.has(modele)) continue;
                const source = readFileSync(path.join(dossier, `${modele}.js`), "utf8");
                const declaration = source.match(new RegExp(`\\b${colonne}\\s*:\\s*(\\{[^}]*|[^,\\n]*)`));
                if (!declaration || declaration[1].includes("VIRTUAL")) fausses.push(`${p.id} : ${modele}.${colonne}`);
            }
        }
        expect(fausses).toEqual([]);
    });

    test("une règle de pays n'a jamais de valeur écrite dans le catalogue", () => {
        const fixees = parametres.filter((p) => p.categorie === "REG" && p.role !== "regle" && p.defaut !== null);
        expect(fixees.map((p) => p.id)).toEqual([]);
    });
});

describe("catalogue du moteur : dépendances", () => {
    test("identifiants connus, aucun cycle, chaque règle dit ce qu'elle lit", () => {
        expect(verifierDependances(parametres, dependances)).toEqual([]);
    });

    test("la grille passe avant les disponibilités, et les disponibilités avant les règles qui les lisent", () => {
        const { rangs } = rangsDeCalcul(parametres, dependances);
        expect(rangs.get("HOR.GRILLE.CRENEAUX")).toBeLessThan(rangs.get("ENS.DISPO.CRENEAUX"));
        expect(rangs.get("ENS.DISPO.CRENEAUX")).toBeLessThan(rangs.get("ENS.REGLE.INDISPONIBLE"));
    });

    test("un cycle est détecté", () => {
        const faux = [
            { type: "requiert", de: "SAL.ID.ID", vers: "SAL.ID.TYPE" },
            { type: "requiert", de: "SAL.ID.TYPE", vers: "SAL.ID.ID" },
        ];
        expect(rangsDeCalcul(parametres, faux).cycle).toEqual(expect.arrayContaining(["SAL.ID.ID", "SAL.ID.TYPE"]));
    });

    test("une borne violée et une exclusion sont signalées, une valeur absente ne l'est pas", () => {
        const bornes = dependances.filter((d) => ["borne", "exclut"].includes(d.type));
        const valeurs = new Map([["ENS.CHARGE.MAX_H_JOUR", 600], ["REG.TRAVAIL.MAX_JOUR", 480], ["PRF.ENS.MATIN", true], ["PRF.ENS.APRES_MIDI", true]]);
        expect(coherenceDesValeurs(valeurs, bornes)).toEqual([
            "ENS.CHARGE.MAX_H_JOUR (600) doit être <= REG.TRAVAIL.MAX_JOUR (480)",
            "PRF.ENS.MATIN et PRF.ENS.APRES_MIDI s'excluent",
        ]);
    });
});

describe("catalogue du moteur : profils", () => {
    test("les cinq profils existent", () => {
        expect(profils.map((p) => p.code).sort()).toEqual(["college", "formation", "lycee", "primaire", "universite"]);
    });

    test.each(profils.map((p) => [p.code, p]))("le profil %s est cohérent avec le catalogue et ses dépendances", (_code, profil) => {
        expect(verifierProfil(profil, parametres, dependances)).toEqual([]);
    });

    test("un profil ne peut pas assouplir une règle fondamentale", () => {
        const faux = { code: "faux", reglages: { "ENS.REGLE.CONFLIT": { force: "souple" } } };
        expect(verifierProfil(faux, parametres, [])).toEqual(["faux : la force de ENS.REGLE.CONFLIT n'est pas réglable"]);
    });

    test("le profil ne remplace que ce qu'il règle", () => {
        const valeurs = valeursDuProfil({ reglages: { "MAT.VOL.DUREE_REC": { valeur: 45 }, "HOR.REGLE.TROUS": { force: "strict" } } }, parametres);
        expect(valeurs.get("MAT.VOL.DUREE_REC")).toBe(45);
        expect(valeurs.get("HOR.REGLE.TROUS")).toBe(parId.get("HOR.REGLE.TROUS").defaut);
    });
});

describe("catalogue du moteur : documentation", () => {
    test("les pages générées sont à jour (node scripts/catalogue-moteur-doc.mjs)", async () => {
        const { pagesDuCatalogue } = await import(pathToFileURL(path.join(RACINE, "scripts/catalogue-moteur-doc.mjs")).href);
        const dossier = path.join(RACINE, "docs/conception/moteur-planification/catalogue");
        const pages = pagesDuCatalogue();
        expect(readdirSync(dossier).sort()).toEqual(Object.keys(pages).sort());
        for (const [nom, contenu] of Object.entries(pages)) expect(readFileSync(path.join(dossier, nom), "utf8").replace(/\r\n/g, "\n")).toBe(contenu);
    });
});
