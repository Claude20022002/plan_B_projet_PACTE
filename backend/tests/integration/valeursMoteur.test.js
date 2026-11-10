import { resetDatabase, closeDatabase, createUser, loginAs, anonymous } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import sequelize from "../../config/db.js";
import { ParametrePlanning, ValeurParametre, VersionParametres } from "../../models/index.js";
import { lireParametres } from "../../services/planning/referentiel.js";
import { aujourdhui, valeursEnVigueur } from "../../services/moteur/valeurs/lecture.js";
import { down, up } from "../../migrations/0061-valeurs-parametres.js";

/**
 * Lot MP-1 : les réglages du moteur, versionnés et datés. La génération ne les lit pas encore :
 * ces tests vérifient le cycle d'une version, les droits, et que les anciens réglages ne bougent pas.
 */

const MAX_JOUR = "ENS.CHARGE.MAX_H_JOUR";
const TROUS = "HOR.REGLE.TROUS";

let admin;
let client;

const dansJours = (n) => {
    const d = new Date(`${aujourdhui()}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
};
const creer = (corps) => client.send("post", "/api/moteur/versions", corps);
const appliquer = (id) => client.send("post", `/api/moteur/versions/${id}/appliquer`);
const valeurDe = async (id, requete = "") => (await client.get(`/api/moteur/valeurs${requete}`)).body.valeurs.find((v) => v.id === id);
/** Crée puis applique une version, et rend son numéro. */
const regler = async (lignes, date_effet) => {
    const creee = await creer({ lignes, date_effet });
    expect(creee.status).toBe(201);
    expect((await appliquer(creee.body.id_version)).status).toBe(200);
    return creee.body.id_version;
};

beforeAll(async () => {
    await resetDatabase();
    admin = await createUser("admin");
    client = await loginAs(admin);
});
afterAll(closeDatabase);
beforeEach(async () => {
    resetRateLimiters();
    await ValeurParametre.destroy({ where: {} });
    // Une version inverse renvoie à celle qu'elle annule : ces renvois tombent d'abord
    await VersionParametres.update({ annule_version: null }, { where: {} });
    await VersionParametres.destroy({ where: {} });
});

describe("Migration 0061", () => {
    const rejouer = async () => {
        const queryInterface = sequelize.getQueryInterface();
        await down({ queryInterface });
        await up({ queryInterface });
    };

    test("une base avec des comptes reçoit le profil université et ses réglages convertis", async () => {
        await ParametrePlanning.upsert({ cle: "max_heures_jour_groupe", valeur: 6 });
        await ParametrePlanning.upsert({ cle: "ratio_capacite_examen", valeur: 0.75 });
        await ParametrePlanning.upsert({ cle: "samedi_apres_midi_initiale", valeur: true });
        await rejouer();
        const lignes = await ValeurParametre.findAll();
        const parCle = Object.fromEntries(lignes.map((l) => [l.cle, l.valeur]));
        expect(parCle).toEqual({ "ETA.ID.PROFIL": "universite", "HOR.REGLE.MAX_H_JOUR_GROUPE": 360, "EXA.EPREUVE.RATIO_CAPACITE": 75 });
        const { profil, valeurs } = await valeursEnVigueur();
        expect(profil).toBe("universite");
        expect(valeurs.get("HOR.REGLE.MAX_H_JOUR_GROUPE")).toBe(360);
        await ParametrePlanning.destroy({ where: {} });
    });

    test("une base sans compte part sans aucune ligne", async () => {
        const queryInterface = sequelize.getQueryInterface();
        await down({ queryInterface });
        await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
        await sequelize.query("DELETE FROM Users WHERE id_user = :id", { replacements: { id: admin.id_user } });
        await up({ queryInterface });
        await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
        expect(await VersionParametres.count()).toBe(0);
        admin = await createUser("admin");
        client = await loginAs(admin);
    });
});

describe("Droits", () => {
    test("un anonyme, un enseignant et un étudiant n'y ont pas accès", async () => {
        expect((await anonymous().get("/api/moteur/valeurs")).status).toBe(401);
        for (const role of ["enseignant", "etudiant"]) {
            const autre = await loginAs(await createUser(role));
            expect((await autre.get("/api/moteur/valeurs")).status).toBe(403);
            expect((await autre.send("post", "/api/moteur/versions", { lignes: [{ cle: MAX_JOUR, valeur: 300 }] })).status).toBe(403);
        }
    });
});

describe("Cycle d'une version", () => {
    test("un brouillon n'a aucun effet tant qu'il n'est pas appliqué", async () => {
        const avant = await valeurDe(MAX_JOUR);
        const brouillon = await creer({ libelle: "Essai", lignes: [{ cle: MAX_JOUR, valeur: 420 }] });
        expect(brouillon.status).toBe(201);
        expect(brouillon.body.statut).toBe("brouillon");
        expect((await valeurDe(MAX_JOUR)).valeur).toBe(avant.valeur);

        const appliquee = await appliquer(brouillon.body.id_version);
        expect(appliquee.body.statut).toBe("appliquee");
        expect(await valeurDe(MAX_JOUR)).toMatchObject({ valeur: 420, origine: "etablissement" });
    });

    test("une version appliquée ne s'applique ni ne s'abandonne une seconde fois", async () => {
        const id = await regler([{ cle: MAX_JOUR, valeur: 420 }]);
        expect((await appliquer(id)).status).toBe(409);
        expect((await client.send("post", `/api/moteur/versions/${id}/abandonner`)).status).toBe(409);
    });

    test("un brouillon abandonné n'a jamais d'effet, et reste dans l'historique", async () => {
        const { body } = await creer({ lignes: [{ cle: MAX_JOUR, valeur: 300 }] });
        expect((await client.send("post", `/api/moteur/versions/${body.id_version}/abandonner`)).body.statut).toBe("annulee");
        expect((await appliquer(body.id_version)).status).toBe(409);
        expect((await valeurDe(MAX_JOUR)).valeur).not.toBe(300);
        expect((await client.get("/api/moteur/versions")).body.map((v) => v.id_version)).toContain(body.id_version);
    });

    test("une version datée ne compte qu'à partir de sa date", async () => {
        const date = dansJours(30);
        await regler([{ cle: MAX_JOUR, valeur: 300 }], date);
        expect((await valeurDe(MAX_JOUR)).valeur).not.toBe(300);
        expect((await valeurDe(MAX_JOUR, `?date=${date}`)).valeur).toBe(300);
    });

    test("le passé ne se réécrit pas", async () => {
        const reponse = await creer({ date_effet: "2020-01-01", lignes: [{ cle: MAX_JOUR, valeur: 300 }] });
        expect(reponse.status).toBe(400);
        expect(reponse.body.code).toBe("DATE_EFFET_PASSEE");
    });

    test("une valeur n'existe que pour sa cible", async () => {
        await regler([{ cle: MAX_JOUR, portee: "enseignant", id_portee: 7, valeur: 240 }]);
        expect(await valeurDe(MAX_JOUR, "?enseignant=7")).toMatchObject({ valeur: 240, origine: "enseignant" });
        expect((await valeurDe(MAX_JOUR, "?enseignant=8")).valeur).not.toBe(240);
    });

    test("le profil d'un niveau s'applique à ce niveau seulement", async () => {
        await regler([{ cle: "ETA.ID.PROFIL", valeur: "lycee" }, { cle: "ETA.ID.PROFIL", portee: "niveau", id_portee: "CP", valeur: "primaire" }]);
        expect((await client.get("/api/moteur/valeurs?niveau=CP")).body.profil).toBe("primaire");
        expect((await client.get("/api/moteur/valeurs?niveau=2nde")).body.profil).toBe("lycee");
        expect((await valeurDe("MAT.VOL.DUREE_REC", "?niveau=CP")).valeur).toBe(45);
    });
});

describe("Refus", () => {
    const refus = async (lignes) => {
        const reponse = await creer({ lignes });
        expect(reponse.status).toBe(400);
        expect(reponse.body.code).toBe("REGLAGES_REFUSES");
        return reponse.body.violations.map((v) => v.code);
    };

    test("une école ne rend pas une règle stricte, et le dit", async () => {
        const reponse = await creer({ lignes: [{ cle: TROUS, force: "strict" }] });
        expect(reponse.body.violations[0]).toMatchObject({ cle: TROUS, code: "force_interdite" });
        expect(reponse.body.violations[0].message).toContain("indispensable");
    });

    test("une règle fondamentale, une valeur calculée, une règle de pays et un paramètre inconnu sont refusés", async () => {
        expect(await refus([{ cle: "ENS.REGLE.CONFLIT", valeur: false }])).toEqual(["non_modifiable"]);
        expect(await refus([{ cle: "ETA.TAILLE.CAMPUS", valeur: 9 }])).toEqual(["non_modifiable"]);
        expect(await refus([{ cle: "REG.TRAVAIL.MAX_JOUR", valeur: 480 }])).toEqual(["droit_insuffisant"]);
        expect(await refus([{ cle: "N.EXISTE.PAS", valeur: 1 }])).toEqual(["parametre_inconnu"]);
    });

    test("une version vide ou un réglage en double sont refusés", async () => {
        expect((await creer({ lignes: [] })).body.code).toBe("VERSION_VIDE");
        expect(await refus([{ cle: MAX_JOUR, valeur: 300 }, { cle: MAX_JOUR, valeur: 310 }])).toEqual(["doublon"]);
        expect(await refus([{ cle: MAX_JOUR }])).toEqual(["ligne_vide"]);
    });

    test("les bornes s'essaient sur la version entière : un minimum et un maximum changent ensemble", async () => {
        await regler([{ cle: "ENS.CHARGE.MAX_H_JOUR", valeur: 300 }]);
        expect(await refus([{ cle: "ENS.CHARGE.MIN_H_JOUR", valeur: 360 }])).toEqual(["borne_depassee"]);
        expect((await creer({ lignes: [{ cle: "ENS.CHARGE.MIN_H_JOUR", valeur: 360 }, { cle: "ENS.CHARGE.MAX_H_JOUR", valeur: 420 }] })).status).toBe(201);
    });

    test("les contrôles se refont à l'application : les réglages ont pu bouger depuis le brouillon", async () => {
        const brouillon = await creer({ lignes: [{ cle: "ENS.CHARGE.MIN_H_JOUR", valeur: 360 }] });
        expect(brouillon.status).toBe(201);
        await regler([{ cle: "ENS.CHARGE.MAX_H_JOUR", valeur: 300 }]);
        const reponse = await appliquer(brouillon.body.id_version);
        expect(reponse.status).toBe(400);
        expect(reponse.body.violations[0].code).toBe("borne_depassee");
    });
});

describe("Annulation", () => {
    const annuler = (id) => client.send("post", `/api/moteur/versions/${id}/annuler`);

    test("sans valeur précédente, le réglage redescend d'un cran", async () => {
        const avant = (await valeurDe(MAX_JOUR)).valeur;
        const id = await regler([{ cle: MAX_JOUR, valeur: 420 }]);
        const inverse = await annuler(id);
        expect(inverse.status).toBe(201);
        expect(inverse.body.annule_version).toBe(id);
        expect((await valeurDe(MAX_JOUR)).valeur).toBe(avant);
    });

    test("avec une valeur précédente, il la reprend ; la version annulée n'est pas modifiée", async () => {
        await regler([{ cle: MAX_JOUR, valeur: 420 }]);
        const id = await regler([{ cle: MAX_JOUR, valeur: 300 }]);
        await annuler(id);
        expect((await valeurDe(MAX_JOUR)).valeur).toBe(420);
        const annulee = await VersionParametres.findByPk(id);
        expect(annulee.statut).toBe("appliquee");
        expect((await ValeurParametre.findOne({ where: { id_version: id, cle: MAX_JOUR } })).valeur).toBe(300);
    });

    test("le poids précédent revient aussi", async () => {
        await regler([{ cle: TROUS, poids: 40 }]);
        const id = await regler([{ cle: TROUS, poids: 90 }]);
        expect((await valeurDe(TROUS)).poids).toBe(90);
        await annuler(id);
        expect((await valeurDe(TROUS)).poids).toBe(40);
    });

    test("une version ne s'annule qu'une fois, un brouillon ne s'annule pas", async () => {
        const id = await regler([{ cle: MAX_JOUR, valeur: 420 }]);
        expect((await annuler(id)).status).toBe(201);
        expect((await annuler(id)).body.code).toBe("VERSION_DEJA_ANNULEE");
        const { body } = await creer({ lignes: [{ cle: MAX_JOUR, valeur: 300 }] });
        expect((await annuler(body.id_version)).body.code).toBe("VERSION_NON_APPLIQUEE");
    });

    test("elle ne passe pas par-dessus une version plus récente", async () => {
        const id = await regler([{ cle: MAX_JOUR, valeur: 420 }]);
        await regler([{ cle: MAX_JOUR, valeur: 300 }]);
        const reponse = await annuler(id);
        expect(reponse.status).toBe(409);
        expect(reponse.body.code).toBe("VERSION_PLUS_RECENTE");
    });
});

describe("Rien ne change ailleurs", () => {
    test("les anciens réglages, que la génération lit encore, ne bougent pas", async () => {
        const avant = await lireParametres();
        await regler([{ cle: "HOR.REGLE.MAX_H_JOUR_GROUPE", valeur: 240 }, { cle: "LOG.TRAJET.CAMPUS_DEFAUT", valeur: 90 }]);
        expect(await lireParametres()).toEqual(avant);
    });

    test("le nombre de campus actifs commande la règle de trajet", async () => {
        const { actives, valeurs } = await valeursEnVigueur();
        expect(valeurs.get("ETA.TAILLE.CAMPUS")).toBeGreaterThanOrEqual(2);
        expect(actives).toContain("LOG.REGLE.TRAJET_REALISABLE");
    });
});
