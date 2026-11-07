import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PARAMETRES_PLANNING } from "../../config/parametresPlanning.js";
import { chargerDependances, chargerParametres, chargerProfils } from "../../services/moteur/catalogue/charger.js";
import { verifierProfil } from "../../services/moteur/catalogue/verifier.js";
import { ANCIENS_PARAMETRES, ANCIENS_VERS_PLAGES } from "../../services/moteur/valeurs/anciensParametres.js";
import { controlerEcriture } from "../../services/moteur/valeurs/ecriture.js";
import { lignesEnVigueur, porteeAdmise, resoudreParametre, resoudreTout } from "../../services/moteur/valeurs/resolution.js";

// Lot MP-1 : qui l'emporte, à quelle date, et ce qu'une école a le droit d'écrire.

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const parametres = chargerParametres();
const dependances = chargerDependances();
const profils = chargerProfils();
const P = (id) => parametres.find((x) => x.id === id);

const DATE = "2026-11-04";
const ligne = (cle, portee, valeur, plus = {}) => ({ cle, portee, valeur, id_portee: null, statut: "appliquee", date_effet: "2026-09-01", id_version: 1, ...plus });
const profilUniversite = ligne("ETA.ID.PROFIL", "etablissement", "universite");
const tout = (lignes, plus = {}) => resoudreTout({ parametres, profils, dependances, lignes, date: DATE, ...plus });

describe("MP-1 : qui l'emporte", () => {
    const id = "ENS.CHARGE.MAX_H_JOUR";

    test("du catalogue à l'individuel, le plus précis gagne, et la trace le dit", () => {
        const r = resoudreParametre(P(id), {
            profil: { code: "primaire", reglages: { [id]: { valeur: 360 } } },
            lignes: [ligne(id, "enseignant", 240, { id_portee: 7 }), ligne(id, "etablissement", 420), ligne(id, "filiere", 300, { id_portee: 3 })],
            cible: { filiere: 3, enseignant: 7 },
        });
        expect(r.valeur).toBe(240);
        expect(r.origine).toBe("enseignant");
        expect(r.trace.map((t) => t.origine)).toEqual(["catalogue", "profil:primaire", "etablissement", "filiere", "enseignant"]);
    });

    test("un réglage d'une autre filière ou d'un autre enseignant ne s'applique pas", () => {
        const r = resoudreParametre(P(id), { lignes: [ligne(id, "enseignant", 240, { id_portee: 7 }), ligne(id, "filiere", 300, { id_portee: 3 })], cible: { filiere: 4, enseignant: 8 } });
        expect(r.valeur).toBe(P(id).defaut);
        expect(r.origine).toBe("catalogue");
    });

    test("une école à plusieurs niveaux suit le profil de chacun", () => {
        const lignes = [ligne("ETA.ID.PROFIL", "etablissement", "lycee"), ligne("ETA.ID.PROFIL", "niveau", "primaire", { id_portee: "CP" })];
        expect(tout(lignes, { cible: { niveau: "CP" } }).valeurs.get("MAT.VOL.DUREE_REC")).toBe(45);
        expect(tout(lignes, { cible: { niveau: "2nde" } }).valeurs.get("MAT.VOL.DUREE_REC")).toBe(55);
    });
});

describe("MP-1 : les dates", () => {
    const id = "ENS.CHARGE.MAX_H_JOUR";

    test("une version future ou non appliquée ne compte pas ; la plus récente gagne", () => {
        const lignes = [
            ligne(id, "etablissement", 420, { date_effet: "2026-09-01", id_version: 1 }),
            ligne(id, "etablissement", 360, { date_effet: "2026-10-01", id_version: 2 }),
            ligne(id, "etablissement", 300, { date_effet: "2027-01-01", id_version: 3 }),
            ligne(id, "etablissement", 240, { date_effet: "2026-10-15", id_version: 4, statut: "brouillon" }),
        ];
        expect(lignesEnVigueur(lignes, DATE).map((l) => l.valeur)).toEqual([360]);
        expect(lignesEnVigueur(lignes, "2027-02-01").map((l) => l.valeur)).toEqual([300]);
    });

    test("une version qui retire un réglage fait redescendre la valeur, sans toucher l'ancienne", () => {
        const lignes = [ligne(id, "etablissement", 420, { id_version: 1 }), ligne(id, "etablissement", null, { id_version: 2, date_effet: "2026-10-01", retiree: true })];
        expect(lignesEnVigueur(lignes, DATE)).toEqual([]);
        expect(lignesEnVigueur(lignes, "2026-09-15").map((l) => l.valeur)).toEqual([420]);
    });
});

describe("MP-1 : force et poids", () => {
    test("un profil rend une règle stricte, et elle perd son poids", () => {
        const { resultats } = tout([ligne("ETA.ID.PROFIL", "etablissement", "primaire")]);
        expect(resultats.get("HOR.REGLE.TROUS")).toMatchObject({ force: "strict", poids: null });
    });

    test("un profil ne peut pas assouplir une règle fondamentale", () => {
        const r = resoudreParametre(P("ENS.REGLE.CONFLIT"), { profil: { code: "x", reglages: { "ENS.REGLE.CONFLIT": { force: "souple", poids: 5 } } } });
        expect(r).toMatchObject({ force: "strict", poids: null });
    });

    test("un poids d'école remplace celui du profil", () => {
        const { resultats } = tout([profilUniversite, ligne("HOR.REGLE.TROUS", "etablissement", true, { poids: 40 })]);
        expect(resultats.get("HOR.REGLE.TROUS").poids).toBe(40);
    });
});

describe("MP-1 : règles actives", () => {
    test("une règle qui demande deux campus ne compte pas sur un seul", () => {
        expect(tout([profilUniversite], { faits: { "ETA.TAILLE.CAMPUS": 1 } }).actives).not.toContain("LOG.REGLE.TRAJET_REALISABLE");
        expect(tout([profilUniversite], { faits: { "ETA.TAILLE.CAMPUS": 2 } }).actives).toContain("LOG.REGLE.TRAJET_REALISABLE");
    });

    test("une règle à seuil sans valeur reste inactive", () => {
        expect(tout([profilUniversite]).actives).not.toContain("HOR.REGLE.COURS_TARDIFS");
        expect(tout([profilUniversite, ligne("HOR.REGLE.COURS_TARDIFS", "etablissement", "18:00")]).actives).toContain("HOR.REGLE.COURS_TARDIFS");
    });

    test("le choix de l'enseignant commande les règles qui en dépendent", () => {
        expect(tout([profilUniversite]).actives).not.toContain("PED.ORG.ENSEIGNANT_REFERENT");
        const { actives } = tout([ligne("ETA.ID.PROFIL", "etablissement", "primaire")]);
        expect(actives).toContain("PED.ORG.ENSEIGNANT_REFERENT");
    });

    test("une valeur qui dépasse la loi est signalée", () => {
        const { alertes } = tout([profilUniversite, ligne("REG.TRAVAIL.MAX_JOUR", "etablissement", 420)]);
        expect(alertes).toContain("ENS.CHARGE.MAX_H_JOUR (480) doit être <= REG.TRAVAIL.MAX_JOUR (420)");
    });
});

describe("MP-1 : ce qu'on a le droit d'écrire", () => {
    const codes = (o) => controlerEcriture({ auteur: "etablissement", portee: "etablissement", dependances, ...o }).map((e) => e.code);

    test("une école règle un poids et un seuil", () => {
        expect(codes({ parametre: P("HOR.REGLE.TROUS"), poids: 30 })).toEqual([]);
        expect(codes({ parametre: P("ENS.CHARGE.MAX_H_JOUR"), valeur: 420 })).toEqual([]);
    });

    test("une école ne rend pas une règle stricte ; la Plateforme le peut", () => {
        expect(codes({ parametre: P("HOR.REGLE.TROUS"), force: "strict" })).toEqual(["force_interdite"]);
        expect(codes({ parametre: P("HOR.REGLE.TROUS"), force: "strict", auteur: "plateforme" })).toEqual([]);
    });

    test("une règle fondamentale ne se touche pas", () => {
        expect(codes({ parametre: P("ENS.REGLE.CONFLIT"), valeur: false })).toEqual(["non_modifiable"]);
        expect(codes({ parametre: P("ENS.REGLE.CONFLIT"), force: "souple", auteur: "plateforme" })).toEqual(["non_modifiable"]);
    });

    test("une valeur calculée ne s'écrit pas", () => {
        expect(codes({ parametre: P("ETA.TAILLE.CAMPUS"), valeur: 3 })).toEqual(["non_modifiable"]);
    });

    test("les règles de pays reviennent à la Plateforme", () => {
        expect(codes({ parametre: P("REG.TRAVAIL.MAX_JOUR"), valeur: 480 })).toEqual(["droit_insuffisant"]);
        expect(codes({ parametre: P("REG.TRAVAIL.MAX_JOUR"), valeur: 480, auteur: "plateforme" })).toEqual([]);
    });

    test("une valeur à la mauvaise portée, du mauvais type ou hors liste est refusée", () => {
        expect(codes({ parametre: P("HOR.GRILLE.PAUSE_MIDI"), valeur: 60, portee: "enseignant" })).toEqual(["portee_interdite"]);
        expect(codes({ parametre: P("ENS.CHARGE.MAX_H_JOUR"), valeur: "huit" })).toEqual(["type_invalide"]);
        expect(codes({ parametre: P("OPT.PORTEE.HORIZON"), valeur: "decennie" })).toEqual(["hors_liste"]);
    });

    test("un poids n'existe que pour une règle souple", () => {
        expect(codes({ parametre: P("ENS.CHARGE.MAX_H_JOUR"), poids: 5 })).toEqual(["poids_interdit"]);
        expect(codes({ parametre: P("HOR.REGLE.TROUS"), poids: 0 })).toEqual(["poids_invalide"]);
    });

    test("une école ne dépasse pas la loi de son pays, même pour une seule personne", () => {
        const valeurs = new Map([["REG.TRAVAIL.MAX_JOUR", 480]]);
        expect(codes({ parametre: P("ENS.CHARGE.MAX_H_JOUR"), valeur: 540, portee: "enseignant", valeurs })).toEqual(["borne_depassee"]);
        expect(codes({ parametre: P("ENS.CHARGE.MAX_H_JOUR"), valeur: 420, portee: "enseignant", valeurs })).toEqual([]);
    });

    test("la portée suit le catalogue", () => {
        expect(porteeAdmise(P("ENS.CHARGE.MAX_H_JOUR"), "enseignant")).toBe(true);
        expect(porteeAdmise(P("ENS.CHARGE.MAX_H_JOUR"), "salle")).toBe(false);
    });
});

describe("MP-1 : l'école pilote ne change pas", () => {
    const { resultats, valeurs } = tout([profilUniversite]);

    test.each(Object.entries(ANCIENS_PARAMETRES))("%s garde sa valeur actuelle", (cle, { id, convertir }) => {
        expect(valeurs.get(id)).toBe(convertir(PARAMETRES_PLANNING[cle].defaut));
    });

    test("chaque ancien réglage a sa destination", () => {
        expect([...Object.keys(ANCIENS_PARAMETRES), ...ANCIENS_VERS_PLAGES].sort()).toEqual(Object.keys(PARAMETRES_PLANNING).sort());
    });

    test("les 10 règles souples du solveur gardent leur poids", () => {
        const java = readFileSync(path.join(RACINE, "solver/src/main/java/ma/hestim/solver/contraintes/ContraintesEmploiDuTemps.java"), "utf8");
        const dansLeCode = [...java.matchAll(/(?:penalize|reward)\(HardSoftScore\.(?:ONE_SOFT|ofSoft\((\d+)\))[\s\S]*?asConstraint\("([^"]+)"\)/g)].map((m) => [m[2], Number(m[1] ?? 1)]);
        expect(dansLeCode).toHaveLength(10);
        for (const [nom, poids] of dansLeCode) {
            const p = parametres.find((x) => x.regle_solveur === nom);
            expect([nom, resultats.get(p.id).poids]).toEqual([nom, poids]);
        }
    });

    test("toutes les règles strictes du solveur restent actives", () => {
        const { actives } = tout([profilUniversite], { faits: { "ETA.TAILLE.CAMPUS": 2 } });
        const strictes = parametres.filter((p) => p.regle_solveur && p.force === "strict").map((p) => p.id);
        expect(strictes).toHaveLength(12);
        expect(strictes.filter((id) => !actives.includes(id))).toEqual([]);
    });
});

describe("MP-1 : ce qu'un profil peut régler", () => {
    test("aucun profil ne règle ETA.ID.PROFIL : il se résout avant eux", () => {
        expect(profils.filter((p) => "ETA.ID.PROFIL" in p.reglages)).toEqual([]);
    });

    test("une règle stricte qu'un profil assouplit doit recevoir un poids", () => {
        const sansPoids = { code: "x", reglages: { "ENS.CHARGE.MAX_H_JOUR": { force: "souple" } } };
        const avecPoids = { code: "x", reglages: { "ENS.CHARGE.MAX_H_JOUR": { force: "souple", poids: 5 } } };
        expect(verifierProfil(sansPoids, parametres, [])).toEqual(["x : ENS.CHARGE.MAX_H_JOUR devient souple sans poids"]);
        expect(verifierProfil(avecPoids, parametres, [])).toEqual([]);
    });
});
