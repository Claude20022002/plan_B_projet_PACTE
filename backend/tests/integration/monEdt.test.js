import { resetDatabase, closeDatabase, createUser, loginAs } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import { Affectation, AnneeUniversitaire, Appartenir, Campus, Cours, CoursComposante, Creneau, Enseignement, Evenement, Filiere, Groupe, Periode, Salle, SessionExamen, SessionExamenGroupe, SessionExamenSalle } from "../../models/index.js";

/**
 * Phase D2 : emploi du temps de l'étudiant connecté pour l'application mobile.
 */

let etudiant;
let enseignant;
let clients;
let ref;

const JOUR = "2027-03-02";
const seance = (extra) => ({ date_seance: JOUR, statut: "planifie", id_user_enseignant: enseignant.id_user, id_creneau: ref.creneau.id_creneau, id_cours: ref.cours.id_cours, id_salle: ref.salle.id_salle, ...extra });

beforeAll(async () => {
    await resetDatabase();
    etudiant = await createUser("etudiant");
    enseignant = await createUser("enseignant");
    const admin = await createUser("admin");
    clients = { etudiant: await loginAs(etudiant), enseignant: await loginAs(enseignant) };

    const gandhi = await Campus.findOne({ where: { code: "G" } });
    const filiere = await Filiere.create({ code_filiere: "MOB", nom_filiere: "Mobile" });
    const autreFiliere = await Filiere.create({ code_filiere: "AUT", nom_filiere: "Autre" });
    const promo = await Groupe.create({ nom_groupe: "4A MOB", niveau: "4ème année", annee: 4, effectif: 30, annee_scolaire: "2026-2027", type_groupe: "promotion", id_filiere: filiere.id_filiere });
    const td1 = await Groupe.create({ nom_groupe: "MOB-4A", niveau: "4ème année", annee: 4, effectif: 15, annee_scolaire: "2026-2027", type_groupe: "td", id_groupe_parent: promo.id_groupe, id_filiere: filiere.id_filiere });
    const td2 = await Groupe.create({ nom_groupe: "MOB-4B", niveau: "4ème année", annee: 4, effectif: 15, annee_scolaire: "2026-2027", type_groupe: "td", id_groupe_parent: promo.id_groupe, id_filiere: filiere.id_filiere });
    const autre = await Groupe.create({ nom_groupe: "4A AUT", niveau: "4ème année", annee: 4, effectif: 20, annee_scolaire: "2026-2027", type_groupe: "promotion", id_filiere: autreFiliere.id_filiere });
    // L'étudiant n'est inscrit qu'à son TD
    await Appartenir.create({ id_user_etudiant: etudiant.id_user, id_groupe: td1.id_groupe });

    const salle = await Salle.create({ nom_salle: "G-MOB1", type_salle: "Salle de cours", capacite: 60, id_campus: gandhi.id_campus });
    const creneau = await Creneau.create({ jour_semaine: "mardi", heure_debut: "09:00", heure_fin: "10:45", duree_minutes: 105, rang: 1 });
    const cours = await Cours.create({ code_cours: "MOB-ANG", nom_cours: "Anglais", niveau: "4ème année", volume_horaire: 20, type_cours: "CM", semestre: "S8", id_filiere: filiere.id_filiere });
    const annee = await AnneeUniversitaire.create({ libelle: "2026-2027", date_debut: "2026-09-01", date_fin: "2027-07-31", active: true });
    const periode = await Periode.create({ id_annee: annee.id_annee, code: "S2", date_debut: "2027-02-15", date_fin: "2027-06-30", nb_semaines: 18 });
    const composante = await CoursComposante.create({ id_cours: cours.id_cours, type: "CM", volume_heures: 20, niveau_groupe: "promotion" });
    // CM d'anglais mutualisé : l'autre filière et le TD de l'étudiant, posé sur le groupe de l'autre filière
    const mutualise = await Enseignement.create({ id_composante: composante.id_composante, id_periode: periode.id_periode, heures_prevues: 20 });
    await mutualise.setGroupes([autre.id_groupe, td1.id_groupe]);
    ref = { promo, td1, td2, autre, salle, creneau, cours, admin, mutualise };

    const base = { id_user_admin: admin.id_user };
    await Affectation.bulkCreate([
        seance({ ...base, id_groupe: promo.id_groupe }), // CM de sa promotion
        seance({ ...base, id_groupe: td1.id_groupe, date_seance: "2027-03-03" }), // son TD
        seance({ ...base, id_groupe: td1.id_groupe, date_seance: "2027-03-04", statut: "annule" }), // annulée : visible
        seance({ ...base, id_groupe: td2.id_groupe, date_seance: "2027-03-03" }), // TD voisin : non
        seance({ ...base, id_groupe: autre.id_groupe, id_enseignement: mutualise.id_enseignement, date_seance: "2027-03-05" }), // mutualisé : oui
        seance({ ...base, id_groupe: autre.id_groupe, date_seance: "2027-03-05" }), // autre filière : non
        seance({ ...base, id_groupe: td1.id_groupe, date_seance: "2027-05-10" }), // hors période demandée
    ]);
});
afterAll(closeDatabase);
beforeEach(resetRateLimiters);

describe("GET /api/emplois-du-temps/moi", () => {
    test("ses groupes, leurs parents et les mutualisations ; annulées visibles ; voisins exclus", async () => {
        const reponse = await clients.etudiant.get("/api/emplois-du-temps/moi?du=2027-03-01&au=2027-03-07");
        expect(reponse.status).toBe(200);
        const lignes = reponse.body.seances.map((s) => `${s.date_seance} ${s.groupe.nom_groupe} ${s.statut}`);
        expect(lignes).toEqual(["2027-03-02 4A MOB planifie", "2027-03-03 MOB-4A planifie", "2027-03-04 MOB-4A annule", "2027-03-05 4A AUT planifie"]);
        expect(reponse.body.groupes).toEqual([{ id_groupe: ref.td1.id_groupe, nom_groupe: "MOB-4A" }]);

        const [premiere] = reponse.body.seances;
        expect(premiere.salle).toMatchObject({ nom_salle: "G-MOB1", campus: { code: "G" } });
        expect(premiere.cours).toMatchObject({ code_cours: "MOB-ANG", nom_cours: "Anglais" });
        // Le nom de l'enseignant, rien d'autre
        expect(Object.keys(premiere.enseignant).sort()).toEqual(["id_user", "nom", "prenom"]);
        expect(JSON.stringify(reponse.body)).not.toMatch(/password|@hestim/);
    });

    test("séance reportée : date et créneau d'origine fournis pour le détail", async () => {
        const avant = await Creneau.create({ jour_semaine: "lundi", heure_debut: "14:00", heure_fin: "15:45", duree_minutes: 105, rang: 3 });
        await Affectation.create(seance({ id_user_admin: ref.admin.id_user, id_groupe: ref.td1.id_groupe, date_seance: "2027-03-06", statut: "reporte", date_seance_initiale: "2027-03-01", id_creneau_initial: avant.id_creneau }));
        const { body } = await clients.etudiant.get("/api/emplois-du-temps/moi?du=2027-03-06&au=2027-03-06");
        expect(body.seances).toHaveLength(1);
        expect(body.seances[0]).toMatchObject({ statut: "reporte", date_seance: "2027-03-06", date_seance_initiale: "2027-03-01", creneauInitial: { heure_debut: "14:00:00", heure_fin: "15:45:00" } });
    });

    test("agenda : les événements qui le concernent et ses examens publiés", async () => {
        const { admin, promo, td1, td2, autre, cours, salle } = ref;
        const ev = (extra) => ({ date_debut: "2027-03-01", date_fin: "2027-03-01", id_user_createur: admin.id_user, bloque_affectations: false, ...extra });
        await Evenement.bulkCreate([
            ev({ titre: "Fête du Trône", type_evenement: "ferie", portee: "etablissement" }),
            ev({ titre: "Vacances de printemps", type_evenement: "vacances", portee: "filiere", id_cible: promo.id_filiere, date_debut: "2027-03-04", date_fin: "2027-03-12" }),
            ev({ titre: "Journée 4e année", type_evenement: "autre", portee: "niveau", id_cible: promo.id_filiere, niveau: "4ème année" }),
            ev({ titre: "Sortie du TD voisin", type_evenement: "autre", portee: "groupe", id_cible: td2.id_groupe }),
            ev({ titre: "Vacances autre filière", type_evenement: "vacances", portee: "filiere", id_cible: autre.id_filiere }),
            ev({ titre: "Réunion pédagogique", type_evenement: "reunion", portee: "etablissement" }),
            ev({ titre: "Hors période", type_evenement: "ferie", portee: "etablissement", date_debut: "2027-05-01", date_fin: "2027-05-01" }),
        ]);
        const base = { id_cours: cours.id_cours, heure_debut: "09:00", heure_fin: "11:00", id_createur: admin.id_user };
        const [publie, brouillon, voisin] = await SessionExamen.bulkCreate([
            { ...base, titre: "Examen d'anglais", date: "2027-03-02", statut: "publiee" },
            { ...base, titre: "Brouillon", date: "2027-03-02", statut: "brouillon" },
            { ...base, titre: "Examen du TD voisin", date: "2027-03-02", statut: "publiee" },
        ]);
        await SessionExamenGroupe.bulkCreate([
            { id_session: publie.id_session, id_groupe: promo.id_groupe },
            { id_session: brouillon.id_session, id_groupe: td1.id_groupe },
            { id_session: voisin.id_session, id_groupe: td2.id_groupe },
        ]);
        await SessionExamenSalle.create({ id_session: publie.id_session, id_salle: salle.id_salle });

        const { body } = await clients.etudiant.get("/api/emplois-du-temps/moi?du=2027-03-01&au=2027-03-07");
        expect(body.evenements.map((e) => e.titre).sort()).toEqual(["Fête du Trône", "Journée 4e année", "Vacances de printemps"]);
        expect(body.evenements.find((e) => e.type === "vacances")).toEqual(expect.objectContaining({ date_debut: "2027-03-04", date_fin: "2027-03-12" }));
        expect(body.examens).toEqual([expect.objectContaining({ titre: "Examen d'anglais", date: "2027-03-02", cours: { code: "MOB-ANG", nom: "Anglais" }, salles: ["G-MOB1"] })]);
    });

    test("réservé aux étudiants ; période validée", async () => {
        expect((await clients.enseignant.get("/api/emplois-du-temps/moi")).status).toBe(403);
        expect((await clients.etudiant.get("/api/emplois-du-temps/moi?du=2027-03-07&au=2027-03-01")).status).toBe(400);
        expect((await clients.etudiant.get("/api/emplois-du-temps/moi?du=2027-01-01&au=2027-06-30")).status).toBe(400);
        expect((await clients.etudiant.get("/api/emplois-du-temps/moi?du=hier")).status).toBe(400);
        expect((await clients.etudiant.get("/api/emplois-du-temps/moi?du=2027-03-01&du=2027-03-02")).status).toBe(400);
        expect((await clients.etudiant.get("/api/emplois-du-temps/moi?du=2027-02-31")).status).toBe(400);
        // Sans paramètre : à partir d'aujourd'hui, deux semaines
        const parDefaut = await clients.etudiant.get("/api/emplois-du-temps/moi");
        expect(parDefaut.status).toBe(200);
        expect(parDefaut.body.du).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
});
