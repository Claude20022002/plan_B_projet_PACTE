import { resetDatabase, closeDatabase, createUser, loginAs } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import {
    Affectation,
    AnneeUniversitaire,
    Appartenir,
    AppelSeance,
    Campus,
    Cours,
    CoursComposante,
    Creneau,
    Enseignant,
    Enseignement,
    Filiere,
    Groupe,
    Periode,
    ResponsableFiliere,
    Salle,
    VisaSeance,
} from "../../models/index.js";
import { aujourdhui } from "../../services/planning/affectationRules.js";

/**
 * Phase P7 — suivi du réalisé et export des vacataires.
 */

let admin;
let vacataire;
let permanent;
let etudiants;
let intrus;
let clients;
let ref;

const decaler = (jours) => {
    const d = new Date(`${aujourdhui()}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + jours);
    return d.toISOString().slice(0, 10);
};
const MOIS = aujourdhui().slice(0, 7);

beforeAll(async () => {
    await resetDatabase();
    admin = await createUser("admin");
    vacataire = await createUser("enseignant");
    permanent = await createUser("enseignant");
    await Enseignant.update({ statut: "vacataire", entreprise: "ESN casablancaise" }, { where: { id_user: vacataire.id_user } });
    etudiants = [];
    for (let i = 0; i < 6; i += 1) etudiants.push(await createUser("etudiant"));
    intrus = await createUser("etudiant");
    clients = { admin: await loginAs(admin), vacataire: await loginAs(vacataire), permanent: await loginAs(permanent) };

    const gandhi = await Campus.findOne({ where: { code: "G" } });
    const filiere = await Filiere.create({ code_filiere: "SUI", nom_filiere: "Suivi" });
    const autreFiliere = await Filiere.create({ code_filiere: "AUT", nom_filiere: "Autre" });
    const td = await Groupe.create({ nom_groupe: "SUI-4A", niveau: "4ème année", annee: 4, effectif: 25, annee_scolaire: "2026-2027", type_groupe: "td", id_filiere: filiere.id_filiere });
    const autreGroupe = await Groupe.create({ nom_groupe: "AUT-4A", niveau: "4ème année", annee: 4, effectif: 25, annee_scolaire: "2026-2027", type_groupe: "td", id_filiere: autreFiliere.id_filiere });
    for (const e of etudiants) await Appartenir.create({ id_user_etudiant: e.id_user, id_groupe: td.id_groupe });
    await Appartenir.create({ id_user_etudiant: intrus.id_user, id_groupe: autreGroupe.id_groupe });
    const salle = await Salle.create({ nom_salle: "G-SUI", type_salle: "Salle de cours", capacite: 30, id_campus: gandhi.id_campus });
    const creneau = await Creneau.create({ jour_semaine: "lundi", heure_debut: "09:00", heure_fin: "10:45", duree_minutes: 105, rang: 1 });
    const cours = await Cours.create({ code_cours: "SUI-NOSQL", nom_cours: "NoSQL", niveau: "4ème année", volume_horaire: 60, type_cours: "CM", semestre: "S7", id_filiere: filiere.id_filiere });
    const composante = await CoursComposante.create({ id_cours: cours.id_cours, type: "CM", volume_heures: 60, niveau_groupe: "td" });

    const annee = await AnneeUniversitaire.create({ libelle: "2026-2027", date_debut: decaler(-60), date_fin: decaler(250), active: true });
    // Semestre commencé il y a 4 semaines (sur 16) : 15 h attendues sur 60
    const periode = await Periode.create({ id_annee: annee.id_annee, code: "S1", date_debut: decaler(-28), date_fin: decaler(84), nb_semaines: 16 });
    const enseignement = await Enseignement.create({ id_composante: composante.id_composante, id_periode: periode.id_periode, heures_prevues: 60 });
    await enseignement.setGroupes([td.id_groupe]);

    const seance = (extra) =>
        Affectation.create({ date_seance: decaler(-1), statut: "confirme", id_cours: cours.id_cours, id_groupe: td.id_groupe, id_user_enseignant: vacataire.id_user, id_salle: salle.id_salle, id_creneau: creneau.id_creneau, id_user_admin: admin.id_user, id_enseignement: enseignement.id_enseignement, ...extra });
    const seances = {
        confirmeePassee: await seance(),
        planifieePassee: await seance({ statut: "planifie", date_seance: decaler(-2) }),
        reporteePassee: await seance({ statut: "reporte", date_seance: decaler(-3) }),
        future: await seance({ statut: "confirme", date_seance: decaler(5) }),
    };
    ref = { filiere, td, cours, periode, enseignement, seances, creerSeance: seance };
});
afterAll(closeDatabase);
beforeEach(resetRateLimiters);

describe("Séances réalisées", () => {
    test("d'office : une séance planifiée ou confirmée devient réalisée une fois passée (sans confirmation de l'enseignant)", async () => {
        const response = await clients.admin.send("post", "/api/suivi/actualiser");
        expect(response.body.realisees).toBe(2);
        const statuts = await Promise.all(Object.values(ref.seances).map((s) => Affectation.findByPk(s.id_affectation).then((a) => a.statut)));
        expect(statuts).toEqual(["realise", "realise", "reporte", "confirme"]);
    });

    test("l'enseignant n'a rien à marquer : la route manuelle n'existe plus", async () => {
        const response = await clients.vacataire.send("patch", `/api/suivi/seances/${ref.seances.future.id_affectation}/realiser`);
        expect(response.status).toBe(404);
    });
});

describe("Avancement et heures", () => {
    test("module en retard sur son rythme, heures planifiées et non planifiées", async () => {
        const response = await clients.admin.get(`/api/suivi/modules?id_periode=${ref.periode.id_periode}`);
        expect(response.status).toBe(200);
        // 2 séances réalisées × 1 h 45 = 3,5 h ; 15 h attendues après 4 semaines sur 16
        expect(response.body[0]).toMatchObject({ heures_prevues: 60, heures_realisees: 3.5, heures_attendues: 15, en_retard: true, reste: 56.5 });
        expect(response.body[0].heures_planifiees).toBe(7);
    });

    test("un responsable ne voit que sa filière ; un enseignant non responsable est refusé", async () => {
        expect((await clients.permanent.get(`/api/suivi/modules?id_periode=${ref.periode.id_periode}`)).status).toBe(403);
        await ResponsableFiliere.create({ id_user: permanent.id_user, id_filiere: ref.filiere.id_filiere });
        const client = await loginAs(permanent);
        expect((await client.get(`/api/suivi/modules?id_periode=${ref.periode.id_periode}`)).body).toHaveLength(1);
    });

    test("heures réalisées du mois et export CSV des vacataires", async () => {
        // Les séances d'hier et d'avant-hier peuvent tomber le mois précédent : on interroge leur mois
        const mois = decaler(-1).slice(0, 7);
        const heures = await clients.admin.get(`/api/suivi/enseignants?mois=${mois}`);
        expect(heures.body.find((h) => h.id_user === vacataire.id_user).heures_realisees).toBeGreaterThan(0);

        // La séance d'hier a son appel validé : elle part dans l'export (une séance à vérifier attend le visa)
        const appel = await AppelSeance.create({ id_affectation: ref.seances.confirmeePassee.id_affectation, secret: "s".repeat(64), ouvert_le: new Date(), ferme_le: new Date() });
        const csv = await clients.admin.get(`/api/suivi/vacataires.csv?mois=${mois}`);
        expect(csv.status).toBe(200);
        expect(csv.headers["content-type"]).toMatch(/text\/csv/);
        expect(csv.text).toMatch(/ESN casablancaise/);
        expect(csv.text).toMatch(/;1,8;SUI-NOSQL NoSQL;SUI-4A;G-SUI/);
        expect((await clients.admin.get("/api/suivi/vacataires.csv?mois=octobre")).status).toBe(400);
        expect(MOIS).toMatch(/^\d{4}-\d{2}$/);
        await appel.destroy();
    });
});

describe("Séances à vérifier avant la paie (R-11)", () => {
    // Séance d'avant-hier, réalisée d'office par le premier test ; son mois peut être le précédent
    const cible = () => ref.seances.planifieePassee;
    const mois = () => decaler(-2).slice(0, 7);
    const heuresDu = async () => (await clients.admin.get(`/api/suivi/enseignants?mois=${mois()}`)).body.find((h) => h.id_user === vacataire.id_user);
    const dansLaListe = async (id) => (await clients.admin.get(`/api/suivi/seances-a-verifier?mois=${mois()}`)).body.seances.find((s) => s.id_affectation === id);
    const ligneCsv = async () => (await clients.admin.get(`/api/suivi/vacataires.csv?mois=${mois()}`)).text.split("\r\n").find((l) => l.includes(`;${decaler(-2)};`));
    const viser = (id, corps) => clients.admin.send("put", `/api/suivi/seances/${id}/visa`, corps);

    test("sans appel validé, la séance est à vérifier dans les heures et la liste, et retenue hors de l'export", async () => {
        const heures = await heuresDu();
        expect(heures.seances_a_verifier).toBeGreaterThan(0);
        expect(heures.heures_a_verifier).toBe(heures.heures_realisees);
        const liste = await clients.admin.get(`/api/suivi/seances-a-verifier?mois=${mois()}`);
        expect(liste.body.note).toMatch(/indice.*pas une preuve/);
        expect(liste.body.a_verifier).toBe(heures.seances_a_verifier);
        expect(liste.body.seances.find((s) => s.id_affectation === cible().id_affectation)).toMatchObject({ etat: "a_verifier", heures: 1.8, groupe: "SUI-4A", appel_ouvert: false, enseignants: [{ id_user: vacataire.id_user, statut: "vacataire" }] });
        // Retenue jusqu'au visa : on ne paie pas une séance qui n'a peut-être pas eu lieu
        expect(await ligneCsv()).toBeUndefined();
    });

    test("un appel lancé ne suffit pas ; validé, la séance sort de la liste", async () => {
        const appel = await AppelSeance.create({ id_affectation: cible().id_affectation, secret: "s".repeat(64), ouvert_le: new Date() });
        expect(await dansLaListe(cible().id_affectation)).toMatchObject({ etat: "a_verifier", appel_ouvert: true });
        await appel.update({ ferme_le: new Date() });
        expect(await dansLaListe(cible().id_affectation)).toBeUndefined();
        expect(await ligneCsv()).toMatch(/;appel validé$/);
        await appel.destroy();
    });

    test("l'administration écarte, confirme, puis revient sur sa décision", async () => {
        const avant = await heuresDu();
        const heuresDuModule = async () => (await clients.admin.get(`/api/suivi/modules?id_periode=${ref.periode.id_periode}`)).body[0].heures_realisees;
        const moduleAvant = await heuresDuModule();
        const ecartee = await viser(cible().id_affectation, { decision: "ecartee", motif: "  Cours non tenu  " });
        expect(ecartee.body).toMatchObject({ etat: "ecartee", compte: false, motif: "Cours non tenu" });
        const apres = await heuresDu();
        expect(apres.heures_ecartees).toBe(1.8);
        expect(apres.seances_a_verifier).toBe(avant.seances_a_verifier - 1);
        expect(apres.heures_realisees).toBeLessThan(avant.heures_realisees);
        // La même séance sort des heures réalisées du module (R-11), et y revient avec sa confirmation
        expect(moduleAvant - await heuresDuModule()).toBeCloseTo(1.8, 0);
        // Écartée : absente de l'export, mais encore dans la liste pour revenir dessus
        expect(await ligneCsv()).toBeUndefined();
        expect(await dansLaListe(cible().id_affectation)).toMatchObject({ etat: "ecartee", motif: "Cours non tenu" });

        expect((await viser(cible().id_affectation, { decision: "confirmee" })).body).toMatchObject({ etat: "confirmee", compte: true, motif: null });
        expect(await ligneCsv()).toMatch(/;confirmée par l'administration$/);
        expect((await heuresDu()).heures_realisees).toBe(avant.heures_realisees);
        expect(await heuresDuModule()).toBe(moduleAvant);

        expect((await viser(cible().id_affectation, { decision: null })).body.etat).toBe("a_verifier");
        expect(await VisaSeance.count()).toBe(0);
    });

    test("refus : hors administration, décision inconnue, séance non réalisée ou introuvable", async () => {
        expect((await clients.vacataire.send("put", `/api/suivi/seances/${cible().id_affectation}/visa`, { decision: "confirmee" })).status).toBe(403);
        expect((await clients.vacataire.get(`/api/suivi/seances-a-verifier?mois=${mois()}`)).status).toBe(403);
        expect((await viser(cible().id_affectation, { decision: "payee" })).status).toBe(400);
        expect((await viser(ref.seances.future.id_affectation, { decision: "confirmee" })).status).toBe(409);
        expect((await viser(ref.seances.reporteePassee.id_affectation, { decision: "ecartee" })).status).toBe(409);
        expect((await viser(999999, { decision: "confirmee" })).status).toBe(404);
        expect((await clients.admin.get("/api/suivi/seances-a-verifier?mois=octobre")).status).toBe(400);
        expect(await VisaSeance.count()).toBe(0);
    });
});
