import { resetDatabase, closeDatabase, createUser, loginAs } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import { Affectation, Appartenir, Campus, Cours, Creneau, DemandeReport, EnvoiEdt, Filiere, Groupe, Notification, Salle } from "../../models/index.js";
import { changementsEntre, lignesDuMois } from "../../services/calendrier/envoiEdt.js";

/**
 * Report « à une date ultérieure » (lot R-1) : l'administration accepte sans date, la séance passe « à
 * reprogrammer » et libère sa place ; plus tard, elle fixe la date, l'enseignant confirme, et les
 * étudiants sont prévenus deux fois (au report, puis à la nouvelle date).
 */

let admin;
let prof;
let etudiant;
let clients;
let ref;

beforeAll(async () => {
    await resetDatabase();
    admin = await createUser("admin");
    prof = await createUser("enseignant");
    const autreProf = await createUser("enseignant");
    etudiant = await createUser("etudiant");
    clients = { admin: await loginAs(admin), prof: await loginAs(prof), autreProf: await loginAs(autreProf), etudiant: await loginAs(etudiant) };

    const gandhi = await Campus.findOne({ where: { code: "G" } });
    const filiere = await Filiere.create({ code_filiere: "PLT", nom_filiere: "Plus tard" });
    const td = await Groupe.create({ nom_groupe: "PLT-4A", niveau: "4ème année", annee: 4, effectif: 15, annee_scolaire: "2026-2027", type_groupe: "promotion", id_filiere: filiere.id_filiere });
    const autreTd = await Groupe.create({ nom_groupe: "PLT-4B", niveau: "4ème année", annee: 4, effectif: 15, annee_scolaire: "2026-2027", type_groupe: "promotion", id_filiere: filiere.id_filiere });
    await Appartenir.create({ id_user_etudiant: etudiant.id_user, id_groupe: td.id_groupe });
    const salle = await Salle.create({ nom_salle: "P-R1", type_salle: "Salle de cours", capacite: 40, id_campus: gandhi.id_campus });
    const creneau = (jour_semaine, heure_debut, heure_fin, rang) => Creneau.create({ jour_semaine, heure_debut, heure_fin, duree_minutes: 90, rang });
    ref = {
        td,
        autreTd,
        autreProf,
        salle,
        lun1: await creneau("lundi", "09:00", "10:45", 1),
        mar1: await creneau("mardi", "09:00", "10:45", 1),
        cours: await Cours.create({ code_cours: "PLT-RES", nom_cours: "Réseaux", niveau: "4ème année", volume_horaire: 21, type_cours: "CM", semestre: "S7", id_filiere: filiere.id_filiere }),
    };
});
afterAll(closeDatabase);
beforeEach(resetRateLimiters);

const creer = (extra) =>
    clients.admin.send("post", "/api/affectations", { id_cours: ref.cours.id_cours, id_groupe: ref.td.id_groupe, id_user_enseignant: prof.id_user, id_salle: ref.salle.id_salle, id_creneau: ref.lun1.id_creneau, ...extra });
const titres = async (idUser) => (await Notification.findAll({ where: { id_user: idUser } })).map((n) => n.titre);
/** Publie le mois de la classe, comme « Publier et envoyer », sans notification. */
const publier = async (mois) => EnvoiEdt.create({ id_groupe: ref.td.id_groupe, mois, seances: await lignesDuMois(ref.td, mois), envoye_le: new Date(), nb_destinataires: 1 });
/** La séance telle que la voit l'étudiant (version publiée). */
const vueEtudiant = async (du, au, id) => (await clients.etudiant.get(`/api/emplois-du-temps/moi?du=${du}&au=${au}`)).body.seances.find((s) => s.id_affectation === id);
/** La case de la séance dans l'EDT du mois de l'étudiant (format de l'école). */
const caseDuMois = async (id) => {
    const { body } = await clients.etudiant.get(`/api/emplois-du-temps/groupe/${ref.td.id_groupe}/mensuel?mois=2027-03`);
    const cases = body.semaines.flatMap((s) => s.jours).flatMap((j) => [...j.matin, ...j.apres_midi]);
    return cases.find((c) => c.id_affectations?.includes(id));
};

describe("Report à une date ultérieure", () => {
    let seance;
    let demande;

    test("accepté sans date : la séance est à reprogrammer, sa salle libérée, tout le monde prévenu", async () => {
        seance = (await creer({ date_seance: "2027-03-01" })).body.affectation;
        await publier("2027-03");
        demande =(await clients.prof.send("post", "/api/demandes-report", { id_affectation: seance.id_affectation, motif: "Jury", nouvelle_date: "2027-03-02" })).body;
        expect((await clients.prof.send("patch", `/api/demandes-report/${demande.id_demande}/plus-tard`)).status).toBe(403);

        const reponse = await clients.admin.send("patch", `/api/demandes-report/${demande.id_demande}/plus-tard`);
        expect(reponse.status).toBe(200);
        expect(reponse.body.demande.statut_demande).toBe("a_reprogrammer");
        expect(await Affectation.findByPk(seance.id_affectation)).toMatchObject({ statut: "a_reprogrammer", date_seance_initiale: "2027-03-01" });
        expect(await titres(prof.id_user)).toContain("Report accepté, date à venir");
        const avis = await Notification.findOne({ where: { id_user: etudiant.id_user, titre: "Séance reportée" } });
        expect(avis.message).toContain("date ultérieure");
        // Publiée aussitôt : l'étudiant la voit « reportée · date à venir » à sa date d'origine
        expect(await vueEtudiant("2027-03-01", "2027-03-07", seance.id_affectation)).toMatchObject({ statut: "a_reprogrammer", date_seance: "2027-03-01" });
        // L'EDT du mois la garde, marquée reportée
        expect(await caseDuMois(seance.id_affectation)).toMatchObject({ type: "seance", statut: "a_reprogrammer", heure_debut: "09:00" });
        // La place est libre : une autre classe peut la prendre
        expect((await creer({ date_seance: "2027-03-01", id_groupe: ref.autreTd.id_groupe, id_user_enseignant: ref.autreProf.id_user })).status).toBe(201);
    });

    test("à reprogrammer : listée, ni refusée ni revalidée, et aucune autre demande sur la séance", async () => {
        const liste = (await clients.admin.get("/api/demandes-report/statut/a_reprogrammer")).body;
        expect(liste.map((d) => d.id_demande)).toEqual([demande.id_demande]);
        expect((await clients.admin.send("patch", `/api/demandes-report/${demande.id_demande}/traiter`, { action: "refuser" })).status).toBe(400);
        expect((await clients.admin.send("patch", `/api/demandes-report/${demande.id_demande}/traiter`, { action: "approuver" })).status).toBe(400);
        expect((await clients.prof.send("post", "/api/demandes-report", { id_affectation: seance.id_affectation, motif: "Autre", nouvelle_date: "2027-03-09" })).status).toBe(409);
    });

    test("une date sans place est refusée avec les dates proches ; une date libre passe à confirmer", async () => {
        const dimanche = await clients.admin.send("patch", `/api/demandes-report/${demande.id_demande}/reprogrammer`, { date: "2027-03-14" });
        expect(dimanche.status).toBe(422);
        expect(dimanche.body.code).toBe("AUCUN_CRENEAU_LIBRE");
        expect(dimanche.body.dates_proches.length).toBeGreaterThan(0);

        const fixee = await clients.admin.send("patch", `/api/demandes-report/${demande.id_demande}/reprogrammer`, { date: "2027-03-16" });
        expect(fixee.status).toBe(200);
        expect(fixee.body.demande).toMatchObject({ statut_demande: "a_confirmer", nouvelle_date: "2027-03-16", id_creneau_nouveau: ref.mar1.id_creneau });
        expect(await titres(prof.id_user)).toContain("Report à confirmer");
    });

    test("l'enseignant confirme : la séance revient à la nouvelle date, les étudiants sont prévenus une seconde fois", async () => {
        expect((await clients.prof.send("patch", `/api/demandes-report/${demande.id_demande}/confirmer`, { action: "accepter" })).status).toBe(200);
        expect(await Affectation.findByPk(seance.id_affectation)).toMatchObject({ statut: "reporte", date_seance: "2027-03-16", id_creneau: ref.mar1.id_creneau, date_seance_initiale: "2027-03-01" });
        expect(await Notification.count({ where: { id_user: etudiant.id_user, titre: "Séance reportée" } })).toBe(2);
        // Publiée à sa nouvelle date
        expect(await vueEtudiant("2027-03-01", "2027-03-07", seance.id_affectation)).toBeUndefined();
        expect(await vueEtudiant("2027-03-15", "2027-03-21", seance.id_affectation)).toMatchObject({ statut: "reporte", date_seance: "2027-03-16" });
        expect(await caseDuMois(seance.id_affectation)).toMatchObject({ statut: "reporte" });
        expect((await DemandeReport.findByPk(demande.id_demande)).statut_demande).toBe("approuve");
    });

    test("à la publication du mois, un report sans date se dit une fois, sans « Annulé ou retiré »", () => {
        const ligne = { id: 1, date: "2027-03-01", debut: "09:00", fin: "10:45", cours: "Réseaux", type: "CM", salle: "P-R1", enseignant: "A B", statut: "planifie" };
        const sansDate = { ...ligne, statut: "a_reprogrammer" };
        expect(changementsEntre([ligne], [sansDate])).toEqual([expect.stringMatching(/^Reporté, date à venir : .* · Réseaux \(CM\)$/)]);
        expect(changementsEntre([sansDate], [sansDate])).toEqual([]);
        expect(changementsEntre([], [sansDate])).toEqual([]);
        // Fixée dans un autre mois : elle quitte celui-ci sans être dite annulée
        expect(changementsEntre([sansDate], [])).toEqual([]);
    });
});
