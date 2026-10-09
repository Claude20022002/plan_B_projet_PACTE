import { resetDatabase, closeDatabase, createUser, loginAs } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import sequelize from "../../config/db.js";
import {
    Affectation,
    AnneeUniversitaire,
    Appartenir,
    Campus,
    Cours,
    CoursComposante,
    Creneau,
    Enseignant,
    Enseignement,
    EnseignementEnseignant,
    Evenement,
    Filiere,
    Groupe,
    Notification,
    Periode,
    Salle,
} from "../../models/index.js";

/**
 * Phase P4 — emploi du temps mensuel au format HESTIM, et assistant « Préparer le semestre ».
 */

let admin;
let prof;
let vacataire;
let etudiant;
let intrus;
let clients;
let ref;

beforeAll(async () => {
    await resetDatabase();
    admin = await createUser("admin");
    prof = await createUser("enseignant");
    vacataire = await createUser("enseignant");
    etudiant = await createUser("etudiant");
    intrus = await createUser("etudiant");
    await Enseignant.update({ statut: "vacataire" }, { where: { id_user: vacataire.id_user } });
    clients = { admin: await loginAs(admin), prof: await loginAs(prof), etudiant: await loginAs(etudiant), intrus: await loginAs(intrus) };

    const gandhi = await Campus.findOne({ where: { code: "G" } });
    const filiere = await Filiere.create({ code_filiere: "PRP", nom_filiere: "Ingénierie Test", ecole: "engineering", cycle: "ingenieur", intitule_cycle: "cycle Ingénieur d'Etat", premiere_annee_cycle: 3 });
    const promo = await Groupe.create({ nom_groupe: "4A PRP", niveau: "4ème année", annee: 4, effectif: 28, annee_scolaire: "2026-2027", type_groupe: "promotion", id_filiere: filiere.id_filiere });
    const autre = await Groupe.create({ nom_groupe: "3A PRP", niveau: "3ème année", annee: 3, effectif: 20, annee_scolaire: "2026-2027", type_groupe: "promotion", id_filiere: filiere.id_filiere });
    await Appartenir.create({ id_user_etudiant: etudiant.id_user, id_groupe: promo.id_groupe });
    await Appartenir.create({ id_user_etudiant: intrus.id_user, id_groupe: autre.id_groupe });
    const poly = await Salle.create({ nom_salle: "G-POLY", type_salle: "Salle de cours", capacite: 60, etage: 4, id_campus: gandhi.id_campus });

    const c = (jour_semaine, heure_debut, heure_fin, rang) => Creneau.create({ jour_semaine, heure_debut, heure_fin, duree_minutes: 90, rang });
    const lundi = [await c("lundi", "09:00", "10:45", 1), await c("lundi", "11:00", "12:30", 2), await c("lundi", "13:30", "15:15", 3), await c("lundi", "15:30", "17:00", 4)];
    const vendredi = [await c("vendredi", "09:00", "10:45", 1), await c("vendredi", "11:00", "12:30", 2), await c("vendredi", "14:30", "16:15", 3), await c("vendredi", "16:30", "18:00", 4)];

    const annee = await AnneeUniversitaire.create({ libelle: "2026-2027", date_debut: "2026-09-01", date_fin: "2027-07-31", active: true });
    const periode = await Periode.create({ id_annee: annee.id_annee, code: "S1", date_debut: "2026-10-05", date_fin: "2027-02-06", nb_semaines: 16 });
    const nosql = await Cours.create({ code_cours: "PRP-NOSQL", nom_cours: "Bases de données NoSQL", niveau: "4ème année", volume_horaire: 21, type_cours: "CM", semestre: "S7", id_filiere: filiere.id_filiere });
    const ibm = await Cours.create({ code_cours: "PRP-IBM", nom_cours: "IBM Data Science", niveau: "4ème année", volume_horaire: 24, type_cours: "CM", semestre: "S7", id_filiere: filiere.id_filiere });
    const compNosql = await CoursComposante.create({ id_cours: nosql.id_cours, type: "CM", volume_heures: 21, niveau_groupe: "promotion" });
    const compIbm = await CoursComposante.create({ id_cours: ibm.id_cours, type: "CM", volume_heures: 24, niveau_groupe: "promotion", modalite: "distanciel", mention: "Blended Coursera" });
    const ensNosql = await Enseignement.create({ id_composante: compNosql.id_composante, id_periode: periode.id_periode, heures_prevues: 21 });
    const ensIbm = await Enseignement.create({ id_composante: compIbm.id_composante, id_periode: periode.id_periode, heures_prevues: 24 });
    await ensNosql.setGroupes([promo.id_groupe]);
    await ensIbm.setGroupes([promo.id_groupe]);
    await EnseignementEnseignant.create({ id_enseignement: ensIbm.id_enseignement, id_user: vacataire.id_user, role: "principal", statut_service: "propose" });

    const seance = (extra) => Affectation.create({ statut: "planifie", id_groupe: promo.id_groupe, id_user_enseignant: prof.id_user, id_user_admin: admin.id_user, ...extra });
    // NoSQL : demi-journée du lundi 4 janvier (deux créneaux), puis dernière séance le 25
    await seance({ date_seance: "2027-01-04", id_creneau: lundi[0].id_creneau, id_cours: nosql.id_cours, id_enseignement: ensNosql.id_enseignement, id_salle: poly.id_salle });
    await seance({ date_seance: "2027-01-04", id_creneau: lundi[1].id_creneau, id_cours: nosql.id_cours, id_enseignement: ensNosql.id_enseignement, id_salle: poly.id_salle });
    await seance({ date_seance: "2027-01-25", id_creneau: lundi[0].id_creneau, id_cours: nosql.id_cours, id_enseignement: ensNosql.id_enseignement, id_salle: poly.id_salle });
    // IBM en distanciel le vendredi 8 après-midi (horaire décalé)
    await seance({ date_seance: "2027-01-08", id_creneau: vendredi[2].id_creneau, id_cours: ibm.id_cours, id_enseignement: ensIbm.id_enseignement, id_salle: null, id_user_enseignant: vacataire.id_user });
    // Activités d'intégration : lundi 11 après-midi
    await Evenement.create({ titre: "Activités d'intégration : Accueil & Découverte", date_debut: "2027-01-11", date_fin: "2027-01-11", heure_debut: "13:30", heure_fin: "17:00", type_evenement: "autre", portee: "groupe", id_cible: promo.id_groupe, bloque_affectations: true, id_user_createur: admin.id_user });
    ref = { filiere, promo, periode };
});
afterAll(closeDatabase);
beforeEach(resetRateLimiters);

describe("Emploi du temps mensuel au format HESTIM", () => {
    let edt;
    const jour = (date) => edt.semaines.flatMap((s) => s.jours).find((j) => j.date === date);

    beforeAll(async () => {
        const response = await clients.etudiant.get(`/api/emplois-du-temps/groupe/${ref.promo.id_groupe}/mensuel?mois=2027-01`);
        expect(response.status).toBe(200);
        edt = response.body;
    });

    test("en-tête : année, intitulé de la classe, code « 4A | PRP (S7) », grille et pied", () => {
        expect(edt.entete).toMatchObject({ annee_universitaire: "2026/2027", intitule_classe: "2ème année du cycle Ingénieur d'Etat en Ingénierie Test", code_classe: "4A | PRP (S7)" });
        expect(edt.grille.matin.map((r) => r.heure_debut)).toEqual(["09:00", "11:00"]);
        expect(edt.grille.apres_midi.map((r) => r.heure_debut)).toEqual(["13:30", "15:30"]);
        expect(edt.pied.vendredi).toBe("Horaires des vendredis après-midi : 14h30-16h15 & 16h30-18h00");
        expect(edt.semaines[1].libelle).toBe("Du 04 Au 08 Janvier 2027");
    });

    test("deux créneaux du même enseignement fusionnés, (P.S) puis (D.S), salle « HESTIM-GANDHI »", () => {
        const [cellule] = jour("2027-01-04").matin;
        expect(cellule).toMatchObject({ type: "seance", rangs: [1, 2], heure_debut: "09:00", heure_fin: "12:30", matiere: "Bases de données NoSQL", premiere_seance: true, derniere_seance: false, salle: { campus: "HESTIM-GANDHI", detail: "Étage 4 - G-POLY" } });
        expect(jour("2027-01-25").matin[0]).toMatchObject({ derniere_seance: true, premiere_seance: false });
        expect(jour("2027-01-04").apres_midi.every((c) => c.type === "vide")).toBe(true);
    });

    test("distanciel avec sa mention, horaire décalé du vendredi rappelé ; événement en bloc", () => {
        const vendredi = jour("2027-01-08").apres_midi.find((c) => c.type === "seance");
        expect(vendredi).toMatchObject({ distanciel: true, salle: null, mention: "Blended Coursera", horaire_rappel: "(14h30 - 16h15)", premiere_seance: true });
        expect(jour("2027-01-11").apres_midi).toEqual([expect.objectContaining({ type: "evenement", rangs: [3, 4], titre: "Activités d'intégration : Accueil & Découverte" })]);
    });

    test("un étudiant d'un autre groupe n'y a pas accès", async () => {
        expect((await clients.intrus.get(`/api/emplois-du-temps/groupe/${ref.promo.id_groupe}/mensuel?mois=2027-01`)).status).toBe(403);
        expect((await clients.admin.get(`/api/emplois-du-temps/groupe/${ref.promo.id_groupe}/mensuel?mois=janvier`)).status).toBe(400);
    });
});

describe("Préparer le semestre", () => {
    test("étapes calculées depuis les données", async () => {
        const response = await clients.admin.get(`/api/preparation?id_periode=${ref.periode.id_periode}`);
        expect(response.status).toBe(200);
        const prp = response.body.filieres.find((f) => f.filiere.code_filiere === "PRP");
        const etape = (cle) => prp.etapes.find((e) => e.cle === cle);
        expect(prp.etapes.map((e) => e.cle)).toEqual(["calendrier", "maquette", "groupes", "services", "disponibilites", "generation", "revue", "publication"]);
        expect(etape("maquette")).toMatchObject({ etat: "fait", avancement: 100 });
        expect(etape("groupes")).toMatchObject({ etat: "fait" });
        expect(etape("services")).toMatchObject({ avancement: 0, detail: { enseignements: 2, pourvus: 0, a_accepter: 1 } });
        expect(etape("disponibilites").detail.sans_disponibilite.map((v) => v.id_user)).toEqual([vacataire.id_user]);
        expect(etape("generation")).toMatchObject({ avancement: 100 });
        expect(etape("revue")).toMatchObject({ etat: "fait", detail: { conflits: 0 } });
    });

    test("relance des vacataires sans disponibilité", async () => {
        const response = await clients.admin.send("post", "/api/preparation/relancer", { id_periode: ref.periode.id_periode, id_filiere: ref.filiere.id_filiere });
        expect(response.body.relances).toBe(1);
        expect(await Notification.count({ where: { id_user: vacataire.id_user, titre: "Déclarez vos disponibilités" } })).toBe(1);
    });

    test("réservé à l'administration et aux responsables", async () => {
        expect((await clients.prof.get(`/api/preparation?id_periode=${ref.periode.id_periode}`)).status).toBe(403);
        expect((await clients.etudiant.get(`/api/preparation?id_periode=${ref.periode.id_periode}`)).status).toBe(403);
    });

    test("le nombre de requêtes SQL ne dépend pas du nombre de filières (pas de boucle N+1)", async () => {
        const url = `/api/preparation?id_periode=${ref.periode.id_periode}`;
        const compter = async () => {
            let requetes = 0;
            sequelize.options.logging = () => (requetes += 1);
            try {
                expect((await clients.admin.get(url)).status).toBe(200);
            } finally {
                sequelize.options.logging = false;
            }
            return requetes;
        };
        const avant = await compter();
        for (const n of [1, 2, 3, 4]) {
            await Filiere.create({ code_filiere: `F${n}`, nom_filiere: `Filière ${n}`, ecole: "engineering", cycle: "ingenieur", intitule_cycle: "cycle Ingénieur d'Etat", premiere_annee_cycle: 3 });
        }
        expect(await compter()).toBe(avant);
        expect(avant).toBeLessThanOrEqual(15);
    });
});
