import { resetDatabase, closeDatabase, createUser, createPlanningFixture, loginAs } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import sequelize from "../../config/db.js";
import {
    Appartenir,
    ConfigurationEtablissement,
    CoursComposante,
    Enseignement,
    EnseignementEnseignant,
    Groupe,
    Notification,
    Sondage,
    SondageChoix,
    SondageParticipation,
    Users,
} from "../../models/index.js";
import { oublierIdentite } from "../../services/etablissement/identite.js";
import { aujourdhui } from "../../services/planning/affectationRules.js";

/**
 * Sondage de l'enseignant à sa classe (plan multi-établissements, fichier 14, lot EC-9 ;
 * conception-ec9-groupe-b.md, règles S-1 à S-10). La classe est la promotion de l'enseignante ; un
 * étudiant est dans la promotion, deux dans son TD1, un quatrième a un compte désactivé. Un autre
 * enseignant et un étudiant d'un autre groupe ne voient pas la classe.
 */

let prof, autreProf, etuA, etuB, etuC, etuInactif, etuAutre, fixture, base;

const interrupteur = async (allume) => {
    await ConfigurationEtablissement.update({ sondages_actifs: allume }, { where: { id: 1 } });
    oublierIdentite();
};
const veille = () => {
    const d = new Date(`${aujourdhui()}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
};
const creer = async (corps = { question: "Quel jour pour le rattrapage ?", choix: ["Mercredi", "Samedi"] }) => (await loginAs(prof)).send("post", `${base}/sondages`, corps);
const repondre = async (qui, idSondage, idChoix) => (await loginAs(qui)).send("post", `/api/sondages/${idSondage}/reponse`, { id_choix: idChoix });
const lire = async (qui) => (await loginAs(qui)).get(`${base}/sondages`);

beforeAll(async () => {
    await resetDatabase();
    const admin = await createUser("admin");
    prof = await createUser("enseignant");
    autreProf = await createUser("enseignant");
    [etuA, etuB, etuC, etuInactif, etuAutre] = [await createUser("etudiant"), await createUser("etudiant"), await createUser("etudiant"), await createUser("etudiant"), await createUser("etudiant")];
    fixture = await createPlanningFixture({ admin });
    const td1 = await Groupe.create({ niveau: "3A", effectif: 12, annee_scolaire: "2026-2027", id_filiere: fixture.filiere.id_filiere, nom_groupe: "TD1", id_groupe_parent: fixture.groupe.id_groupe, type_groupe: "td" });
    await Appartenir.bulkCreate([
        { id_user_etudiant: etuA.id_user, id_groupe: fixture.groupe.id_groupe },
        { id_user_etudiant: etuB.id_user, id_groupe: td1.id_groupe },
        { id_user_etudiant: etuC.id_user, id_groupe: td1.id_groupe },
        { id_user_etudiant: etuInactif.id_user, id_groupe: fixture.groupe.id_groupe },
        { id_user_etudiant: etuAutre.id_user, id_groupe: fixture.autreGroupe.id_groupe },
    ]);
    await Users.update({ actif: false }, { where: { id_user: etuInactif.id_user } });
    const composante = await CoursComposante.create({ id_cours: fixture.cours.id_cours, type: "CM", volume_heures: 21, niveau_groupe: "promotion" });
    const enseignement = await Enseignement.create({ id_composante: composante.id_composante, heures_prevues: 20 });
    await enseignement.setGroupes([fixture.groupe.id_groupe]);
    await EnseignementEnseignant.create({ id_enseignement: enseignement.id_enseignement, id_user: prof.id_user, role: "principal", statut_service: "accepte" });
    base = `/api/classes/${fixture.cours.id_cours}/${fixture.groupe.id_groupe}`;
});
beforeEach(async () => {
    await resetRateLimiters();
    await Sondage.destroy({ where: {} });
    await Notification.destroy({ where: {} });
    await interrupteur(true);
});
afterAll(async () => {
    await interrupteur(false);
    await closeDatabase();
});

describe("Interrupteur de l'établissement (S-1)", () => {
    test("éteint (défaut d'une base neuve) : la lecture est vide, toute écriture est refusée", async () => {
        const creeAvant = (await creer()).body;
        await interrupteur(false);
        expect((await lire(prof)).body).toEqual({ actif: false, gere: true, sondages: [] });
        expect((await lire(etuA)).body).toEqual({ actif: false, gere: false, sondages: [] });
        const refus = await creer();
        expect(refus.status).toBe(403);
        expect(refus.body.code).toBe("SONDAGES_FERMES");
        expect((await repondre(etuA, creeAvant.id_sondage, creeAvant.choix[0].id_choix)).body.code).toBe("SONDAGES_FERMES");
        expect((await (await loginAs(prof)).send("post", `/api/sondages/${creeAvant.id_sondage}/cloture`)).status).toBe(403);
        expect((await (await loginAs(prof)).send("delete", `/api/sondages/${creeAvant.id_sondage}`)).status).toBe(403);
    });

    test("la migration 0059 crée l'interrupteur éteint, sans exception pour une base qui a des comptes", async () => {
        const [colonne] = await sequelize.query("SELECT COLUMN_DEFAULT AS defaut FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ConfigurationEtablissement' AND COLUMN_NAME = 'sondages_actifs'", { type: "SELECT" });
        expect(String(colonne.defaut)).toBe("0");
    });
});

describe("Créer un sondage (S-2, S-3, S-10)", () => {
    test("l'enseignante crée ; les étudiants actifs de la classe et de ses sous-groupes sont prévenus", async () => {
        const res = await creer({ question: "  Le rythme vous convient-il ?  ", choix: ["Oui", " Non "], ferme_le: aujourdhui() });
        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ question: "Le rythme vous convient-il ?", ferme_le: aujourdhui(), clos_le: null, ouvert: true, reponses: 0, effectif: 3, a_repondu: false });
        expect(res.body.choix.map((c) => [c.libelle, c.reponses])).toEqual([["Oui", null], ["Non", null]]);

        const notifies = await Notification.findAll({ where: { titre: "Nouveau sondage" } });
        expect(notifies.map((n) => n.id_user).sort()).toEqual([etuA.id_user, etuB.id_user, etuC.id_user].sort());
        expect(notifies[0].lien).toBe(`/mes-cours/${fixture.cours.id_cours}/${fixture.groupe.id_groupe}`);
    });

    test("hors de ses classes : 404, pour un enseignant comme pour un étudiant d'un autre groupe", async () => {
        expect((await (await loginAs(autreProf)).send("post", `${base}/sondages`, { question: "Une question ?", choix: ["Oui", "Non"] })).status).toBe(404);
        expect((await lire(autreProf)).status).toBe(404);
        expect((await lire(etuAutre)).status).toBe(404);
        const { id_sondage: id } = (await creer()).body;
        expect((await (await loginAs(autreProf)).send("post", `/api/sondages/${id}/cloture`)).status).toBe(404);
        expect((await (await loginAs(etuA)).send("delete", `/api/sondages/${id}`)).status).toBe(404);
    });

    test.each([
        ["un seul choix", { question: "Une question ?", choix: ["Oui"] }],
        ["doublon", { question: "Une question ?", choix: ["Oui", "oui"] }],
        ["date passée", { question: "Une question ?", choix: ["Oui", "Non"], ferme_le: veille() }],
    ])("contenu refusé (%s) : 400 SONDAGE_INVALIDE, rien n'est créé", async (_, corps) => {
        const res = await creer(corps);
        expect(res.status).toBe(400);
        expect(res.body.code).toBe("SONDAGE_INVALIDE");
        expect(await Sondage.count()).toBe(0);
    });
});

describe("Répondre (S-5, S-6, S-7, S-8)", () => {
    test("une réponse par étudiant, définitive ; l'enseignante ne répond pas", async () => {
        const { id_sondage: id, choix } = (await creer()).body;
        expect((await repondre(etuA, id, choix[0].id_choix)).status).toBe(204);
        const deuxieme = await repondre(etuA, id, choix[1].id_choix);
        expect(deuxieme.status).toBe(409);
        expect(deuxieme.body.code).toBe("SONDAGE_DEJA_REPONDU");
        expect(await SondageChoix.sum("reponses", { where: { id_sondage: id } })).toBe(1);
        expect((await repondre(prof, id, choix[0].id_choix)).status).toBe(403);
        expect((await repondre(etuAutre, id, choix[0].id_choix)).status).toBe(404);
        const autre = await repondre(etuB, id, 999999);
        expect([autre.status, autre.body.code]).toEqual([400, "SONDAGE_INVALIDE"]);
    });

    test("l'étudiant voit les sondages ouverts, s'il a répondu, jamais les compteurs", async () => {
        const { id_sondage: id, choix } = (await creer()).body;
        await repondre(etuB, id, choix[1].id_choix);
        const vue = (await lire(etuB)).body;
        expect(vue).toMatchObject({ actif: true, gere: false });
        expect(vue.sondages).toHaveLength(1);
        expect(vue.sondages[0]).toMatchObject({ id_sondage: id, ouvert: true, a_repondu: true });
        expect(vue.sondages[0]).not.toHaveProperty("reponses");
        expect(vue.sondages[0]).not.toHaveProperty("effectif");
        expect(vue.sondages[0].choix).toEqual([{ id_choix: choix[0].id_choix, libelle: "Mercredi" }, { id_choix: choix[1].id_choix, libelle: "Samedi" }]);
        expect((await lire(etuA)).body.sondages[0].a_repondu).toBe(false);
    });

    test("répartition masquée sous 3 réponses, montrée à partir de 3", async () => {
        const { id_sondage: id, choix } = (await creer()).body;
        await repondre(etuA, id, choix[0].id_choix);
        await repondre(etuB, id, choix[0].id_choix);
        let vue = (await lire(prof)).body.sondages[0];
        expect(vue).toMatchObject({ reponses: 2, effectif: 3 });
        expect(vue.choix.map((c) => c.reponses)).toEqual([null, null]);
        await repondre(etuC, id, choix[1].id_choix);
        vue = (await lire(prof)).body.sondages[0];
        expect(vue.reponses).toBe(3);
        expect(vue.choix.map((c) => c.reponses)).toEqual([2, 1]);
    });

    test("aucune colonne ne relie un étudiant à son choix", async () => {
        const qi = sequelize.getQueryInterface();
        expect(Object.keys(await qi.describeTable("SondagesParticipations")).sort()).toEqual(["id_sondage", "id_user"]);
        expect(Object.keys(await qi.describeTable("SondagesChoix")).sort()).toEqual(["id_choix", "id_sondage", "libelle", "rang", "reponses"]);
    });
});

describe("Fermer et supprimer (S-4, S-9)", () => {
    test("clos : l'étudiant ne le voit plus et ne peut plus répondre ; l'enseignante le garde", async () => {
        const { id_sondage: id, choix } = (await creer()).body;
        const clos = await (await loginAs(prof)).send("post", `/api/sondages/${id}/cloture`);
        expect(clos.status).toBe(200);
        expect(clos.body.ouvert).toBe(false);
        expect(clos.body.clos_le).not.toBeNull();
        expect((await lire(etuA)).body.sondages).toEqual([]);
        expect((await repondre(etuA, id, choix[0].id_choix)).body.code).toBe("SONDAGE_FERME");
        expect((await lire(prof)).body.sondages[0]).toMatchObject({ id_sondage: id, ouvert: false });
    });

    test("date de fin passée : fermé, sans clôture", async () => {
        const { id_sondage: id, choix } = (await creer()).body;
        await Sondage.update({ ferme_le: veille() }, { where: { id_sondage: id } });
        expect((await lire(etuA)).body.sondages).toEqual([]);
        expect((await repondre(etuA, id, choix[0].id_choix)).status).toBe(409);
    });

    test("supprimé : choix et participations effacés", async () => {
        const { id_sondage: id, choix } = (await creer()).body;
        await repondre(etuA, id, choix[0].id_choix);
        expect((await (await loginAs(prof)).send("delete", `/api/sondages/${id}`)).status).toBe(204);
        expect(await SondageChoix.count({ where: { id_sondage: id } })).toBe(0);
        expect(await SondageParticipation.count({ where: { id_sondage: id } })).toBe(0);
        expect((await lire(prof)).body.sondages).toEqual([]);
    });
});
