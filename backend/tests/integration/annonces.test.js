import { resetDatabase, closeDatabase, createUser, createPlanningFixture, loginAs } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import { Annonce, AnneeUniversitaire, Appartenir, CoursComposante, Enseignement, EnseignementEnseignant, Groupe, Notification, Periode, ResponsableFiliere } from "../../models/index.js";

/**
 * Annonces ciblées (R1) : l'administration écrit à n'importe quelle portée, un responsable à sa
 * filière, un enseignant aux étudiants de ses groupes. Destinataires figés, notification,
 * accusé de lecture, relance des non-lus, pièce jointe PDF ou image.
 */

let admin;
let enseignant;
let autreEnseignant;
let responsable;
let etudiant;
let etudiantTp;
let etranger;
let fixture;
let tp;

const PDF = Buffer.from("%PDF-1.4\n%âãÏÓ\n1 0 obj <<>> endobj\ntrailer <<>>\n%%EOF\n", "latin1");

const deposer = (session, id, contenu, type, nom = "note.pdf") =>
    session.agent.put(`/api/annonces/${id}/piece-jointe?nom=${encodeURIComponent(nom)}`).set("X-CSRF-Token", session.csrf).set("Content-Type", type).send(contenu);

beforeAll(async () => {
    await resetDatabase();
    admin = await createUser("admin");
    enseignant = await createUser("enseignant");
    autreEnseignant = await createUser("enseignant");
    responsable = await createUser("enseignant");
    etudiant = await createUser("etudiant");
    etudiantTp = await createUser("etudiant");
    etranger = await createUser("etudiant");
    fixture = await createPlanningFixture({ admin, enseignant, etudiant });
    tp = await Groupe.create({ nom_groupe: "TP1", niveau: "3A", effectif: 12, annee_scolaire: "2026-2027", id_filiere: fixture.filiere.id_filiere, id_groupe_parent: fixture.groupe.id_groupe, type_groupe: "tp" });
    await Appartenir.bulkCreate([
        { id_user_etudiant: etudiantTp.id_user, id_groupe: tp.id_groupe },
        { id_user_etudiant: etranger.id_user, id_groupe: fixture.autreGroupe.id_groupe },
    ]);
    await ResponsableFiliere.create({ id_user: responsable.id_user, id_filiere: fixture.filiere.id_filiere });
    const annee = await AnneeUniversitaire.create({ libelle: "2026-2027", date_debut: "2026-09-01", date_fin: "2027-07-31", active: true });
    const periode = await Periode.create({ id_annee: annee.id_annee, code: "S1", date_debut: "2026-09-14", date_fin: "2027-01-22", nb_semaines: 15 });
    const composante = await CoursComposante.create({ id_cours: fixture.cours.id_cours, type: "TD", volume_heures: 21, niveau_groupe: "promotion" });
    const enseignement = await Enseignement.create({ id_composante: composante.id_composante, id_periode: periode.id_periode, heures_prevues: 21 });
    await enseignement.setGroupes([fixture.groupe.id_groupe]);
    await EnseignementEnseignant.create({ id_enseignement: enseignement.id_enseignement, id_user: enseignant.id_user, role: "principal", statut_service: "accepte" });
});
afterAll(closeDatabase);
beforeEach(resetRateLimiters);

let idAnnonceGroupe;

describe("Publier", () => {
    test("l'administration écrit à tout l'établissement : tous les étudiants actifs, pas les enseignants", async () => {
        const res = await (await loginAs(admin)).send("post", "/api/annonces", { titre: "Fermeture exceptionnelle", corps: "L'école sera fermée vendredi.", portee: "etablissement", public: "etudiants" });
        expect(res.status).toBe(201);
        expect(res.body.destinataires).toBe(3);
        const notes = await Notification.findAll({ where: { lien: `/annonces/${res.body.id}` } });
        expect(notes.map((n) => n.id_user).sort()).toEqual([etudiant.id_user, etudiantTp.id_user, etranger.id_user].sort());
        expect(notes[0].titre).toBe("Annonce : Fermeture exceptionnelle");
    });

    test("l'enseignant écrit à son groupe : ses étudiants et ceux des sous-groupes, pas les autres", async () => {
        const res = await (await loginAs(enseignant)).send("post", "/api/annonces", { titre: "Salle changée", corps: "Le TD de lundi a lieu en LABO02.", portee: "groupe", id_cible: fixture.groupe.id_groupe });
        expect(res.status).toBe(201);
        expect(res.body.destinataires).toBe(2);
        idAnnonceGroupe = res.body.id;
        expect(await Notification.count({ where: { lien: `/annonces/${idAnnonceGroupe}`, id_user: etranger.id_user } })).toBe(0);
    });

    test("l'enseignant ne vise ni un groupe où il n'enseigne pas, ni les enseignants, ni une filière", async () => {
        const prof = await loginAs(enseignant);
        const base = { titre: "Test", corps: "Message" };
        expect((await prof.send("post", "/api/annonces", { ...base, portee: "groupe", id_cible: fixture.autreGroupe.id_groupe })).status).toBe(403);
        expect((await prof.send("post", "/api/annonces", { ...base, portee: "groupe", id_cible: fixture.groupe.id_groupe, public: "tous" })).status).toBe(403);
        expect((await prof.send("post", "/api/annonces", { ...base, portee: "filiere", id_cible: fixture.filiere.id_filiere })).status).toBe(403);
        expect((await prof.send("post", "/api/annonces", { ...base, portee: "etablissement" })).status).toBe(403);
    });

    test("le responsable écrit à un niveau de sa filière, enseignants compris", async () => {
        const res = await (await loginAs(responsable)).send("post", "/api/annonces", { titre: "Réunion 3A", corps: "Réunion pédagogique jeudi.", portee: "niveau", id_cible: fixture.filiere.id_filiere, niveau: "3A", public: "tous" });
        expect(res.status).toBe(201);
        const ids = (await Notification.findAll({ where: { lien: `/annonces/${res.body.id}` } })).map((n) => n.id_user);
        expect(ids).toEqual(expect.arrayContaining([etudiant.id_user, etudiantTp.id_user, enseignant.id_user]));
        expect(ids).not.toContain(responsable.id_user);
    });

    test("refusé à un étudiant ; titre requis ; cible vide → 422", async () => {
        expect((await (await loginAs(etudiant)).send("post", "/api/annonces", { titre: "x", corps: "y", portee: "etablissement" })).status).toBe(403);
        const adm = await loginAs(admin);
        expect((await adm.send("post", "/api/annonces", { titre: " ", corps: "y", portee: "etablissement" })).status).toBe(400);
        const vide = await Groupe.create({ nom_groupe: "VIDE", niveau: "5A", effectif: 0, annee_scolaire: "2026-2027", id_filiere: fixture.filiere.id_filiere });
        expect((await adm.send("post", "/api/annonces", { titre: "x", corps: "y", portee: "groupe", id_cible: vide.id_groupe })).status).toBe(422);
    });

    test("les cibles proposées suivent les droits", async () => {
        const prof = (await (await loginAs(enseignant)).get("/api/annonces/cibles")).body;
        expect(prof.portees).toEqual(["groupe"]);
        expect(prof.publics).toEqual(["etudiants"]);
        expect(prof.groupes.map((g) => g.id).sort()).toEqual([fixture.groupe.id_groupe, tp.id_groupe].sort());
        const resp = (await (await loginAs(responsable)).get("/api/annonces/cibles")).body;
        expect(resp.portees).toEqual(["filiere", "niveau", "groupe"]);
        expect(resp.filieres[0].niveaux).toContain("3A");
    });
});

describe("Lire", () => {
    test("l'étudiant voit ses annonces, les non-lues, puis accuse lecture", async () => {
        const session = await loginAs(etudiantTp);
        const avant = (await session.get("/api/annonces")).body;
        const annonce = avant.annonces.find((a) => a.id === idAnnonceGroupe);
        expect(annonce).toMatchObject({ titre: "Salle changée", lu_le: null, auteur: { role: "enseignant" } });
        expect(annonce.cible).toMatch(/^Groupe /);
        expect((await session.send("post", `/api/annonces/${idAnnonceGroupe}/lue`)).status).toBe(200);
        const apres = (await session.get("/api/annonces")).body;
        expect(apres.non_lues).toBe(avant.non_lues - 1);
        expect(await Notification.count({ where: { id_user: etudiantTp.id_user, lien: `/annonces/${idAnnonceGroupe}`, lue: false } })).toBe(0);
    });

    test("une annonce qui ne me concerne pas reste introuvable", async () => {
        const session = await loginAs(etranger);
        expect((await session.get(`/api/annonces/${idAnnonceGroupe}`)).status).toBe(404);
        expect((await session.send("post", `/api/annonces/${idAnnonceGroupe}/lue`)).status).toBe(404);
    });
});

describe("Suivi par l'auteur", () => {
    test("nombre de lus, liste des lecteurs (non-lus d'abord), réservée à l'auteur", async () => {
        const prof = await loginAs(enseignant);
        const envoyee = (await prof.get("/api/annonces/envoyees")).body.data.find((a) => a.id === idAnnonceGroupe);
        expect(envoyee).toMatchObject({ destinataires: 2, lus: 1 });
        const liste = (await prof.get(`/api/annonces/${idAnnonceGroupe}/lecteurs`)).body.data;
        expect(liste.map((l) => l.id_user)).toEqual([etudiant.id_user, etudiantTp.id_user]);
        expect((await (await loginAs(autreEnseignant)).get(`/api/annonces/${idAnnonceGroupe}/lecteurs`)).status).toBe(403);
    });

    test("relance des non-lus, une fois toutes les 12 heures", async () => {
        const prof = await loginAs(enseignant);
        const res = await prof.send("post", `/api/annonces/${idAnnonceGroupe}/relancer`);
        expect(res.body).toEqual({ relances: 1 });
        expect(await Notification.count({ where: { id_user: etudiant.id_user, titre: "Rappel : Salle changée" } })).toBe(1);
        expect((await prof.send("post", `/api/annonces/${idAnnonceGroupe}/relancer`)).status).toBe(429);
    });
});

describe("Pièce jointe", () => {
    test("PDF déposé par l'auteur, téléchargé par un destinataire", async () => {
        const prof = await loginAs(enseignant);
        const res = await deposer(prof, idAnnonceGroupe, PDF, "application/pdf", "../Plan salle.pdf");
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ nom: "Plan salle.pdf", type: "application/pdf", taille: PDF.length });
        const telechargement = await (await loginAs(etudiant)).agent.get(`/api/annonces/${idAnnonceGroupe}/piece-jointe`).buffer(true).parse((r, cb) => {
            const morceaux = [];
            r.on("data", (m) => morceaux.push(m));
            r.on("end", () => cb(null, Buffer.concat(morceaux)));
        });
        expect(telechargement.status).toBe(200);
        expect(telechargement.headers["content-disposition"]).toContain("Plan%20salle.pdf");
        expect(Buffer.compare(telechargement.body, PDF)).toBe(0);
        expect((await (await loginAs(etranger)).get(`/api/annonces/${idAnnonceGroupe}/piece-jointe`)).status).toBe(404);
    });

    test("refus : autre type, contenu qui ne correspond pas, autre auteur", async () => {
        const prof = await loginAs(enseignant);
        expect((await deposer(prof, idAnnonceGroupe, Buffer.from("bonjour"), "text/plain")).status).toBe(415);
        expect((await deposer(prof, idAnnonceGroupe, PDF, "image/png", "faux.png")).status).toBe(415);
        expect((await deposer(await loginAs(autreEnseignant), idAnnonceGroupe, PDF, "application/pdf")).status).toBe(403);
    });
});

describe("Supprimer", () => {
    test("seul l'auteur supprime ; les notifications partent avec l'annonce", async () => {
        expect((await (await loginAs(autreEnseignant)).send("delete", `/api/annonces/${idAnnonceGroupe}`)).status).toBe(403);
        expect((await (await loginAs(enseignant)).send("delete", `/api/annonces/${idAnnonceGroupe}`)).status).toBe(204);
        expect(await Annonce.findByPk(idAnnonceGroupe)).toBeNull();
        expect(await Notification.count({ where: { lien: `/annonces/${idAnnonceGroupe}` } })).toBe(0);
    });
});
