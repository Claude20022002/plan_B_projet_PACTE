import { resetDatabase, closeDatabase, createUser, loginAs } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import {
    Affectation,
    Appartenir,
    Campus,
    CompetenceEnseignant,
    Cours,
    Creneau,
    Evenement,
    Filiere,
    Groupe,
    Notification,
    Salle,
} from "../../models/index.js";

/**
 * Phase P6 — imprévus, et assistant de créneaux (innovation I8).
 */

let admin;
let profA;
let profB;
let profC;
let etudiant;
let clients;
let ref;

const LUNDI = "2027-05-03";
const MARDI = "2027-05-04";

beforeAll(async () => {
    await resetDatabase();
    admin = await createUser("admin");
    profA = await createUser("enseignant");
    profB = await createUser("enseignant");
    profC = await createUser("enseignant");
    etudiant = await createUser("etudiant");
    clients = { admin: await loginAs(admin), profA: await loginAs(profA), profB: await loginAs(profB) };

    const [gandhi, stendhal] = await Promise.all([Campus.findOne({ where: { code: "G" } }), Campus.findOne({ where: { code: "ST" } })]);
    const filiere = await Filiere.create({ code_filiere: "IMP", nom_filiere: "Imprévus" });
    const td1 = await Groupe.create({ nom_groupe: "IMP-3A", niveau: "3ème année", annee: 3, effectif: 20, annee_scolaire: "2026-2027", type_groupe: "td", id_filiere: filiere.id_filiere });
    const td2 = await Groupe.create({ nom_groupe: "IMP-3B", niveau: "3ème année", annee: 3, effectif: 20, annee_scolaire: "2026-2027", type_groupe: "td", id_filiere: filiere.id_filiere });
    await Appartenir.create({ id_user_etudiant: etudiant.id_user, id_groupe: td1.id_groupe });
    const salle = (nom, campus) => Salle.create({ nom_salle: nom, type_salle: "Salle de cours", capacite: 30, id_campus: campus.id_campus });
    const salles = { g1: await salle("G-IMP1", gandhi), g2: await salle("G-IMP2", gandhi), st: await salle("ST-IMP1", stendhal) };
    const c = (jour_semaine, heure_debut, heure_fin, rang) => Creneau.create({ jour_semaine, heure_debut, heure_fin, duree_minutes: 90, rang });
    const creneaux = {
        lun1: await c("lundi", "09:00", "10:45", 1),
        lun2: await c("lundi", "11:00", "12:30", 2),
        mar1: await c("mardi", "09:00", "10:45", 1),
        mar2: await c("mardi", "11:00", "12:30", 2),
    };
    const cours = await Cours.create({ code_cours: "IMP-ALGO", nom_cours: "Algorithmique", niveau: "3ème année", volume_horaire: 30, type_cours: "CM", semestre: "S5", id_filiere: filiere.id_filiere });
    await CompetenceEnseignant.bulkCreate([
        { id_user: profA.id_user, id_cours: cours.id_cours },
        { id_user: profB.id_user, id_cours: cours.id_cours },
    ]);
    ref = { filiere, td1, td2, salles, creneaux, cours };
});
afterAll(closeDatabase);
beforeEach(resetRateLimiters);

const creer = (extra) =>
    clients.admin.send("post", "/api/affectations", {
        date_seance: LUNDI,
        id_cours: ref.cours.id_cours,
        id_groupe: ref.td1.id_groupe,
        id_user_enseignant: profA.id_user,
        id_salle: ref.salles.g1.id_salle,
        id_creneau: ref.creneaux.lun1.id_creneau,
        ...extra,
    });

describe("Assistant de créneaux (I8)", () => {
    let seance;

    beforeAll(async () => {
        seance = (await creer()).body.affectation;
        // TD1 a aussi cours lundi à 11 h : ce créneau ne peut pas être proposé
        await creer({ id_user_enseignant: profC.id_user, id_salle: ref.salles.g2.id_salle, id_creneau: ref.creneaux.lun2.id_creneau });
    });

    test("propose des créneaux réellement libres et explique les autres", async () => {
        const response = await clients.admin.send("post", "/api/imprevus/assistant/seances", { id_affectation: seance.id_affectation, date_debut: LUNDI, date_fin: MARDI });
        expect(response.status).toBe(200);
        const proposes = response.body.propositions.map((p) => `${p.date}|${p.heure_debut}`);
        expect(proposes).not.toContain(`${LUNDI}|11:00`);
        expect(proposes).toEqual(expect.arrayContaining([`${MARDI}|09:00`, `${MARDI}|11:00`]));
        expect(response.body.refus.find((r) => r.code === "groupe_pris")?.nombre).toBe(1);
        // Chaque proposition passe les règles
        for (const p of response.body.propositions) {
            const verif = await clients.admin.send("post", "/api/affectations/verifier", { ...seance, date_seance: p.date, id_creneau: p.id_creneau, id_salle: p.id_salle, id_affectation: seance.id_affectation });
            expect(verif.body.bloquant).toBe(false);
        }
    });

    test("l'enseignant cherche pour sa séance, pas pour celle d'un autre", async () => {
        expect((await clients.profA.send("post", "/api/imprevus/assistant/seances", { id_affectation: seance.id_affectation, date_debut: LUNDI, date_fin: MARDI })).status).toBe(200);
        expect((await clients.profB.send("post", "/api/imprevus/assistant/seances", { id_affectation: seance.id_affectation, date_debut: LUNDI, date_fin: MARDI })).status).toBe(403);
    });

    test("plages libres pour une soutenance : tout le jury disponible", async () => {
        const response = await clients.profB.send("post", "/api/imprevus/assistant/reservations", {
            type: "soutenance",
            duree_minutes: 90,
            date_debut: LUNDI,
            date_fin: LUNDI,
            participants: [{ id_user: profA.id_user, role: "president" }, { id_user: profB.id_user, role: "jury" }],
        });
        expect(response.status).toBe(200);
        // profA a cours à 9 h : la plage de 9 h est écartée, celle de 11 h proposée
        expect(response.body.propositions.map((p) => p.heure_debut)).toEqual(["11:00"]);
        expect(response.body.refus.find((r) => r.code === "participant_pris")?.nombre).toBe(1);
    });
});

describe("Imprévus (P6)", () => {
    test("absence : séances listées avec des remplaçants compétents et libres ; plus de séance possible", async () => {
        const response = await clients.profA.send("post", "/api/imprevus/absences", { date_debut: LUNDI, date_fin: LUNDI, motif: "Malade" });
        expect(response.status).toBe(201);
        expect(response.body.seances).toHaveLength(1);
        expect(response.body.seances[0].remplacants[0]).toMatchObject({ id_user: profB.id_user, competent: true });
        expect(await Notification.count({ where: { id_user: admin.id_user, titre: "Absence d'enseignant" } })).toBe(1);

        const nouvelle = await creer({ id_groupe: ref.td2.id_groupe, id_salle: ref.salles.st.id_salle, id_creneau: ref.creneaux.lun2.id_creneau });
        expect(nouvelle.body.violations.filter((v) => v.bloquant).map((v) => v.code)).toContain("enseignant_indisponible");
        // Un enseignant ne déclare pas l'absence d'un autre
        expect((await clients.profB.send("post", "/api/imprevus/absences", { id_user: profA.id_user, date_debut: LUNDI, date_fin: LUNDI, motif: "x" })).body.absence.id_user).toBe(profB.id_user);
    });

    test("remplacement : la séance passe au remplaçant, les étudiants sont prévenus", async () => {
        const seance = await Affectation.findOne({ where: { id_user_enseignant: profA.id_user, date_seance: LUNDI } });
        const response = await clients.admin.send("post", `/api/imprevus/seances/${seance.id_affectation}/remplacer`, { id_user: profC.id_user });
        // profC a déjà cours à 11 h, pas à 9 h : remplacement possible
        expect(response.status).toBe(200);
        expect((await Affectation.findByPk(seance.id_affectation)).id_user_enseignant).toBe(profC.id_user);
        expect(await Notification.count({ where: { id_user: etudiant.id_user, titre: "Séance confiée à un remplaçant" } })).toBe(1);
    });

    test("salle hors service : séances relogées dans une salle équivalente du même campus", async () => {
        const apercu = await clients.admin.send("post", `/api/imprevus/salles/${ref.salles.g1.id_salle}/reloger`, { date_debut: LUNDI, date_fin: LUNDI });
        expect(apercu.body.seances[0].salle_proposee.id_salle).toBe(ref.salles.g2.id_salle);
        expect(apercu.body.seances[0].deplacee).toBe(false);

        const applique = await clients.admin.send("post", `/api/imprevus/salles/${ref.salles.g1.id_salle}/reloger`, { date_debut: LUNDI, date_fin: LUNDI, appliquer: true });
        expect(applique.body.seances[0].deplacee).toBe(true);
        expect(await Affectation.count({ where: { id_salle: ref.salles.g1.id_salle, date_seance: LUNDI } })).toBe(0);
        expect(await Notification.count({ where: { id_user: etudiant.id_user, titre: "Changement de salle" } })).toBe(1);
    });

    test("journée annulée (fête lunaire décalée) : séances annulées et notifiées", async () => {
        await creer({ date_seance: MARDI, id_user_enseignant: profB.id_user, id_creneau: ref.creneaux.mar1.id_creneau });
        const liste = await clients.admin.get(`/api/imprevus/jour/${MARDI}`);
        expect(liste.body).toHaveLength(1);
        expect((await clients.admin.send("post", `/api/imprevus/jour/${MARDI}/annuler`, {})).status).toBe(400);
        const response = await clients.admin.send("post", `/api/imprevus/jour/${MARDI}/annuler`, { motif: "Aïd al-Adha confirmé" });
        expect(response.body.annulees).toHaveLength(1);
        expect(await Affectation.count({ where: { date_seance: MARDI, statut: "annule" } })).toBe(1);
        expect(await Notification.count({ where: { id_user: etudiant.id_user, titre: "Séance annulée" } })).toBe(1);
    });
});

describe("Grille du Ramadan", () => {
    const JOUR_RAMADAN = "2027-02-15";

    beforeAll(async () => {
        await Evenement.create({ titre: "Ramadan", type_evenement: "ramadan", date_debut: "2027-02-08", date_fin: "2027-03-09", bloque_affectations: false, id_user_createur: admin.id_user });
        await Creneau.create({ jour_semaine: "lundi", heure_debut: "10:00", heure_fin: "11:30", duree_minutes: 90, rang: 1, variante: "ramadan" });
    });

    test("même rang, horaires réduits : affichés et pris en compte dans les conflits", async () => {
        const seance = await creer({ date_seance: JOUR_RAMADAN, id_user_enseignant: profB.id_user });
        expect(seance.status).toBe(201);
        const groupe = await clients.admin.get(`/api/affectations/groupe/${ref.td1.id_groupe}?date_from=${JOUR_RAMADAN}`);
        const ligne = groupe.body.data.find((a) => a.id_affectation === seance.body.affectation.id_affectation);
        expect(ligne.creneau).toMatchObject({ heure_debut: "10:00:00", variante_appliquee: "ramadan" });

        // 11 h - 12 h 30 ne chevauche pas 9 h - 10 h 45, mais chevauche 10 h - 11 h 30 du Ramadan
        const suivante = await creer({ date_seance: JOUR_RAMADAN, id_user_enseignant: profC.id_user, id_salle: ref.salles.g2.id_salle, id_creneau: ref.creneaux.lun2.id_creneau });
        expect(suivante.status).toBe(409);
        expect(suivante.body.violations.map((v) => v.code)).toContain("conflit_groupe");
    });
});
