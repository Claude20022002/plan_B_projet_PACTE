import { resetDatabase, closeDatabase, createUser, loginAs } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import { lignesDuMois } from "../../services/calendrier/envoiEdt.js";
import { Affectation, AnneeUniversitaire, Appartenir, Campus, Cours, CoursComposante, Creneau, Enseignement, EnvoiEdt, Filiere, Groupe, Periode, Salle } from "../../models/index.js";

/**
 * Lot EC-11 : lien de visioconférence d'une séance à distance (conception-ec11-groupe-b.md,
 * règles V-1 à V-6). Posé par l'enseignant de la séance ou l'administration, lu par l'étudiant.
 */

let clients;
let ref;

const lien = (id, body) => (client) => client.send("put", `/api/affectations/${id}/lien-visio`, body);

beforeAll(async () => {
    await resetDatabase();
    const etudiant = await createUser("etudiant");
    const autreEtudiant = await createUser("etudiant");
    const enseignant = await createUser("enseignant");
    const autreEnseignant = await createUser("enseignant");
    const admin = await createUser("admin");
    clients = {
        etudiant: await loginAs(etudiant),
        autreEtudiant: await loginAs(autreEtudiant),
        enseignant: await loginAs(enseignant),
        autreEnseignant: await loginAs(autreEnseignant),
        admin: await loginAs(admin),
    };

    const gandhi = await Campus.findOne({ where: { code: "G" } });
    const filiere = await Filiere.create({ code_filiere: "VIS", nom_filiere: "Visio" });
    const td = await Groupe.create({ nom_groupe: "VIS-4A", niveau: "4ème année", annee: 4, effectif: 20, annee_scolaire: "2026-2027", type_groupe: "promotion", id_filiere: filiere.id_filiere });
    const autre = await Groupe.create({ nom_groupe: "VIS-4B", niveau: "4ème année", annee: 4, effectif: 20, annee_scolaire: "2026-2027", type_groupe: "promotion", id_filiere: filiere.id_filiere });
    await Appartenir.create({ id_user_etudiant: etudiant.id_user, id_groupe: td.id_groupe });
    await Appartenir.create({ id_user_etudiant: autreEtudiant.id_user, id_groupe: autre.id_groupe });

    const salle = await Salle.create({ nom_salle: "G-VIS1", type_salle: "Salle de cours", capacite: 40, id_campus: gandhi.id_campus });
    const creneau = await Creneau.create({ jour_semaine: "mardi", heure_debut: "09:00", heure_fin: "10:45", duree_minutes: 105, rang: 1 });
    const cours = await Cours.create({ code_cours: "VIS-RES", nom_cours: "Réseaux", niveau: "4ème année", volume_horaire: 20, type_cours: "CM", semestre: "S8", id_filiere: filiere.id_filiere });
    const annee = await AnneeUniversitaire.create({ libelle: "2026-2027", date_debut: "2026-09-01", date_fin: "2027-07-31", active: true });
    const periode = await Periode.create({ id_annee: annee.id_annee, code: "S2", date_debut: "2027-02-15", date_fin: "2027-06-30", nb_semaines: 18 });
    // Une composante par type et par module : le CM à distance, le TD en hybride
    const enseignement = async (type, modalite) => {
        const composante = await CoursComposante.create({ id_cours: cours.id_cours, type, volume_heures: 20, niveau_groupe: "promotion", modalite });
        return Enseignement.create({ id_composante: composante.id_composante, id_periode: periode.id_periode, heures_prevues: 20 });
    };
    const [distanciel, hybride] = [await enseignement("CM", "distanciel"), await enseignement("TD", "hybride")];

    const seance = (extra) => Affectation.create({ date_seance: "2027-03-02", statut: "planifie", id_user_enseignant: enseignant.id_user, id_user_admin: admin.id_user, id_creneau: creneau.id_creneau, id_cours: cours.id_cours, id_groupe: td.id_groupe, ...extra });
    ref = {
        aDistance: await seance({ id_salle: null, id_enseignement: distanciel.id_enseignement }),
        sansSalle: await seance({ id_salle: null, date_seance: "2027-03-03" }),
        hybride: await seance({ id_salle: salle.id_salle, id_enseignement: hybride.id_enseignement, date_seance: "2027-03-04" }),
        enSalle: await seance({ id_salle: salle.id_salle, date_seance: "2027-03-05" }),
    };
    // Mars publié pour la classe : l'étudiant voit ses séances (version publiée, décision du 21 octobre)
    await EnvoiEdt.create({ id_groupe: td.id_groupe, mois: "2027-03", seances: await lignesDuMois(td, "2027-03"), envoye_le: new Date(), nb_destinataires: 1 });
});
afterAll(closeDatabase);
beforeEach(resetRateLimiters);

describe("PUT /api/affectations/:id/lien-visio", () => {
    test("l'enseignant de la séance pose le lien d'une séance à distance (espaces retirés)", async () => {
        const res = await lien(ref.aDistance.id_affectation, { lien_visio: "  https://meet.google.com/abc-defg-hij " })(clients.enseignant);
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ id_affectation: ref.aDistance.id_affectation, lien_visio: "https://meet.google.com/abc-defg-hij" });
        expect((await Affectation.findByPk(ref.aDistance.id_affectation)).lien_visio).toBe("https://meet.google.com/abc-defg-hij");
    });

    test("à distance : composante en distanciel ou hybride, ou séance sans salle ; en salle : 409", async () => {
        expect((await lien(ref.sansSalle.id_affectation, { lien_visio: "https://teams.microsoft.com/l/1" })(clients.enseignant)).status).toBe(200);
        expect((await lien(ref.hybride.id_affectation, { lien_visio: "https://ecole.zoom.us/j/1" })(clients.enseignant)).status).toBe(200);
        const enSalle = await lien(ref.enSalle.id_affectation, { lien_visio: "https://meet.google.com/x" })(clients.enseignant);
        expect(enSalle.status).toBe(409);
        expect(enSalle.body.code).toBe("LIEN_VISIO_PRESENTIEL");
    });

    test.each(["http://meet.google.com/abc", "javascript:alert(1)", "meet.google.com/abc", "https://nom:secret@meet.google.com/abc", "https://localhost/salle"])(
        "adresse refusée, rien n'est enregistré : %s",
        async (adresse) => {
            const avant = (await Affectation.findByPk(ref.aDistance.id_affectation)).lien_visio;
            const res = await lien(ref.aDistance.id_affectation, { lien_visio: adresse })(clients.enseignant);
            expect(res.status).toBe(400);
            expect(res.body.code).toBe("LIEN_VISIO_INVALIDE");
            expect((await Affectation.findByPk(ref.aDistance.id_affectation)).lien_visio).toBe(avant);
        }
    );

    test("un autre enseignant ou un étudiant : 403 ; l'administration : permis ; séance inconnue : 404", async () => {
        const corps = { lien_visio: "https://meet.google.com/zzz" };
        expect((await lien(ref.aDistance.id_affectation, corps)(clients.autreEnseignant)).status).toBe(403);
        expect((await lien(ref.aDistance.id_affectation, corps)(clients.etudiant)).status).toBe(403);
        expect((await lien(ref.aDistance.id_affectation, corps)(clients.admin)).status).toBe(200);
        expect((await lien(999999, corps)(clients.admin)).status).toBe(404);
    });

    test("null ou vide retire le lien, même sur une séance en salle", async () => {
        await Affectation.update({ lien_visio: "https://meet.google.com/ancien" }, { where: { id_affectation: ref.enSalle.id_affectation } });
        const res = await lien(ref.enSalle.id_affectation, { lien_visio: "" })(clients.enseignant);
        expect(res.status).toBe(200);
        expect(res.body.lien_visio).toBeNull();
        expect((await lien(ref.sansSalle.id_affectation, { lien_visio: null })(clients.enseignant)).body.lien_visio).toBeNull();
    });
});

describe("lecture du lien", () => {
    test("l'étudiant du groupe le lit dans son emploi du temps, sans nouvelle publication ; un autre groupe ne voit pas la séance", async () => {
        await lien(ref.aDistance.id_affectation, { lien_visio: "https://meet.google.com/lu-par-etudiant" })(clients.enseignant);
        const lire = async (client) => (await client.get("/api/emplois-du-temps/moi?du=2027-03-01&au=2027-03-31")).body.seances;
        const seance = (await lire(clients.etudiant)).find((s) => s.id_affectation === ref.aDistance.id_affectation);
        expect(seance.lien_visio).toBe("https://meet.google.com/lu-par-etudiant");
        expect((await lire(clients.etudiant)).find((s) => s.id_affectation === ref.enSalle.id_affectation).lien_visio).toBeNull();
        expect((await lire(clients.autreEtudiant)).some((s) => s.id_affectation === ref.aDistance.id_affectation)).toBe(false);
    });

    test("l'enseignant lit le lien et la modalité de ses séances", async () => {
        const res = await clients.enseignant.get(`/api/affectations/enseignant/${clients.enseignant.user.id_user}?limit=50`);
        const seance = res.body.data.find((s) => s.id_affectation === ref.hybride.id_affectation);
        expect(seance.lien_visio).toBe("https://ecole.zoom.us/j/1");
        expect(seance.enseignement.composante.modalite).toBe("hybride");
    });
});
