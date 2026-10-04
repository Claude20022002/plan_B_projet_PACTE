import { resetDatabase, closeDatabase, createUser, loginAs } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import { Creneau, Disponibilite, Enseignant, Notification } from "../../models/index.js";

let admin;
let permanent;
let vacataire;
let responsable;
let clients;
let creneau;
let periode;
let filiereF;
let filiereG;

beforeAll(async () => {
    await resetDatabase();
    admin = await createUser("admin");
    permanent = await createUser("enseignant");
    vacataire = await createUser("enseignant");
    responsable = await createUser("enseignant");
    clients = {
        admin: await loginAs(admin),
        permanent: await loginAs(permanent),
        vacataire: await loginAs(vacataire),
    };
    await Enseignant.update({ statut: "vacataire" }, { where: { id_user: vacataire.id_user } });
    creneau = await Creneau.create({ jour_semaine: "lundi", heure_debut: "09:00:00", heure_fin: "10:45:00", duree_minutes: 105, rang: 1 });

    const annee = await clients.admin.send("post", "/api/calendrier/annees", {
        libelle: "2026-2027", date_debut: "2026-09-01", date_fin: "2027-07-15", active: true,
    });
    const s1 = await clients.admin.send("post", `/api/calendrier/annees/${annee.body.annee.id_annee}/periodes`, {
        code: "S1", date_debut: "2026-09-14", date_fin: "2027-01-23", nb_semaines: 16,
    });
    periode = s1.body.periode;

    for (const code of ["FFF", "GGG"]) {
        const filiere = (await clients.admin.send("post", "/api/filieres", { code_filiere: code, nom_filiere: `Filière ${code}` })).body.filiere;
        const promo = (await clients.admin.send("post", "/api/groupes", {
            nom_groupe: `4A ${code}`, niveau: "4ème année", annee_scolaire: "2026-2027", type_groupe: "promotion", effectif: 30, id_filiere: filiere.id_filiere,
        })).body.groupe;
        const cours = (await clients.admin.send("post", "/api/cours", {
            code_cours: `${code}-MOD`, nom_cours: `Module ${code}`, niveau: "4ème année", volume_horaire: 21, type_cours: "CM", semestre: "S7", id_filiere: filiere.id_filiere,
        })).body.cours;
        await clients.admin.send("put", `/api/composantes/${cours.composantes[0].id_composante}`, { niveau_groupe: "promotion" });
        await clients.admin.send("post", "/api/enseignements/generer", { id_periode: periode.id_periode, id_filiere: filiere.id_filiere });
        const ref = { filiere, promo, cours };
        if (code === "FFF") filiereF = ref;
        else filiereG = ref;
    }

    // Responsable de FFF uniquement ; connexion après nomination pour que /me le reflète
    expect((await clients.admin.send("post", `/api/filieres/${filiereF.filiere.id_filiere}/responsables`, { id_user: responsable.id_user })).status).toBe(201);
    clients.responsable = await loginAs(responsable);
});
afterAll(closeDatabase);
beforeEach(resetRateLimiters);

const enseignementDe = async (client, ref) => {
    const liste = await clients.admin.get(`/api/enseignements?id_periode=${periode.id_periode}&id_filiere=${ref.filiere.id_filiere}`);
    return liste.body[0];
};

describe("Enseignants : statut, service dû, compétences", () => {
    test("statut, service et campus ; campus inconnu refusé", async () => {
        const ok = await clients.admin.send("put", `/api/enseignants/${permanent.id_user}`, { statut: "permanent", service_annuel_heures: 192, max_heures_semaine: 18 });
        expect(ok.status).toBe(200);
        expect(ok.body.enseignant).toMatchObject({ statut: "permanent", service_annuel_heures: 192 });

        const mauvais = await clients.admin.send("put", `/api/enseignants/${permanent.id_user}`, { id_campus_prefere: 9999 });
        expect(mauvais.status).toBe(400);
        const statutInconnu = await clients.admin.send("put", `/api/enseignants/${permanent.id_user}`, { statut: "stagiaire" });
        expect(statutInconnu.status).toBe(400);
    });

    test("compétences : écriture par l'administration, lecture par l'intéressé", async () => {
        const refus = await clients.permanent.send("put", `/api/enseignants/${permanent.id_user}/competences`, { cours: [filiereF.cours.id_cours] });
        expect(refus.status).toBe(403);
        await clients.admin.send("put", `/api/enseignants/${permanent.id_user}/competences`, { cours: [filiereF.cours.id_cours] });
        const lecture = await clients.permanent.get(`/api/enseignants/${permanent.id_user}/competences`);
        expect(lecture.body.map((c) => c.code_cours)).toEqual(["FFF-MOD"]);
    });
});

describe("Disponibilités : permanent opt-out, vacataire opt-in", () => {
    const verifier = (id) => clients.admin.get(`/api/enseignants/${id}/disponibilite?date=2026-10-05&id_creneau=${creneau.id_creneau}`);

    test("un permanent est disponible sauf indisponibilité déclarée", async () => {
        expect((await verifier(permanent.id_user)).body).toMatchObject({ disponible: true });
        await clients.permanent.send("post", "/api/disponibilites", {
            disponible: false, raison_indisponibilite: "Jury externe", date_debut: "2026-10-05", date_fin: "2026-10-05", id_creneau: creneau.id_creneau,
        });
        expect((await verifier(permanent.id_user)).body).toMatchObject({ disponible: false, raison: "Jury externe" });
    });

    test("un vacataire n'est disponible que là où il l'a déclaré ; le vœu est rendu", async () => {
        expect((await verifier(vacataire.id_user)).body.disponible).toBe(false);
        await clients.vacataire.send("post", "/api/disponibilites", {
            disponible: true, preference: "prefere", date_debut: "2026-09-14", date_fin: "2027-01-23", id_creneau: creneau.id_creneau,
        });
        expect((await verifier(vacataire.id_user)).body).toMatchObject({ disponible: true, preference: "prefere" });
    });

    test("un enseignant ne déclare et ne modifie que ses propres disponibilités", async () => {
        const usurpation = await clients.vacataire.send("post", "/api/disponibilites", {
            id_user_enseignant: permanent.id_user, disponible: false, date_debut: "2026-11-02", date_fin: "2026-11-02", id_creneau: creneau.id_creneau,
        });
        expect(usurpation.status).toBe(201);
        expect(usurpation.body.id_user_enseignant).toBe(vacataire.id_user);

        const declarationDuPermanent = await Disponibilite.findOne({ where: { id_user_enseignant: permanent.id_user } });
        const modification = await clients.vacataire.send("put", `/api/disponibilites/${declarationDuPermanent.id_disponibilite}`, { disponible: true });
        expect(modification.status).toBe(403);
    });
});

describe("Services : proposition, co-enseignement, réponse, charge", () => {
    let enseignement;

    beforeAll(async () => {
        enseignement = await enseignementDe(clients.admin, filiereF);
    });

    test("proposer un principal notifie l'enseignant ; second principal refusé ; co-enseignant accepté", async () => {
        const propose = await clients.admin.send("post", `/api/enseignements/${enseignement.id_enseignement}/enseignants`, { id_user: permanent.id_user });
        expect(propose.status).toBe(201);
        expect(propose.body.avertissement).toBeNull();
        expect(await Notification.count({ where: { id_user: permanent.id_user, titre: "Nouveau service proposé" } })).toBe(1);

        const secondPrincipal = await clients.admin.send("post", `/api/enseignements/${enseignement.id_enseignement}/enseignants`, { id_user: vacataire.id_user });
        expect(secondPrincipal.status).toBe(409);

        const co = await clients.admin.send("post", `/api/enseignements/${enseignement.id_enseignement}/enseignants`, { id_user: vacataire.id_user, role: "co_enseignant" });
        expect(co.status).toBe(201);
        expect(co.body.avertissement).toMatch(/compétences/);

        const doublon = await clients.admin.send("post", `/api/enseignements/${enseignement.id_enseignement}/enseignants`, { id_user: vacataire.id_user, role: "co_enseignant" });
        expect(doublon.status).toBe(409);
    });

    test("l'enseignant voit ses services ; un refus exige un motif", async () => {
        const mes = await clients.vacataire.get("/api/services/mes-services");
        expect(mes.body).toHaveLength(1);
        expect(mes.body[0]).toMatchObject({ role: "co_enseignant", statut_service: "propose", enseignement: { composante: { cours: { code_cours: "FFF-MOD" } } } });

        const sansMotif = await clients.vacataire.send("patch", `/api/services/${enseignement.id_enseignement}/reponse`, { statut: "refuse" });
        expect(sansMotif.status).toBe(400);
        const refus = await clients.vacataire.send("patch", `/api/services/${enseignement.id_enseignement}/reponse`, { statut: "refuse", motif: "Déjà pris le lundi matin" });
        expect(refus.status).toBe(200);

        const accepte = await clients.permanent.send("patch", `/api/services/${enseignement.id_enseignement}/reponse`, { statut: "accepte" });
        expect(accepte.status).toBe(200);
    });

    test("charge : heures acceptées face au service dû, refus non comptés", async () => {
        const charges = await clients.admin.get("/api/enseignants/charges");
        const lignePermanent = charges.body.charges.find((c) => c.id_user === permanent.id_user);
        expect(lignePermanent).toMatchObject({ service_du: 192, heures_acceptees: 21, heures_proposees: 0, ecart: -171 });
        const ligneVacataire = charges.body.charges.find((c) => c.id_user === vacataire.id_user);
        expect(ligneVacataire.heures_prevues).toBe(0);

        const maCharge = await clients.permanent.get(`/api/enseignants/${permanent.id_user}/charge`);
        expect(maCharge.body).toMatchObject({ heures_acceptees: 21, annee: { libelle: "2026-2027" } });
    });

    test("candidats : ceux déjà sur l'enseignement sont exclus, les compétents passent devant", async () => {
        const autre = await enseignementDe(clients.admin, filiereG);
        await clients.admin.send("put", `/api/enseignants/${vacataire.id_user}/competences`, { cours: [filiereG.cours.id_cours] });
        const candidats = await clients.admin.get(`/api/enseignements/${autre.id_enseignement}/candidats`);
        expect(candidats.status).toBe(200);
        expect(candidats.body[0]).toMatchObject({ id_user: vacataire.id_user, competent: true, statut: "vacataire" });

        const surF = await clients.admin.get(`/api/enseignements/${enseignement.id_enseignement}/candidats`);
        expect(surF.body.map((c) => c.id_user)).not.toEqual(expect.arrayContaining([permanent.id_user]));
        expect((await clients.responsable.get(`/api/enseignements/${autre.id_enseignement}/candidats`)).status).toBe(403);
    });

    test("la liste des enseignements montre les services", async () => {
        const liste = await clients.admin.get(`/api/enseignements?id_periode=${periode.id_periode}&id_filiere=${filiereF.filiere.id_filiere}`);
        expect(liste.body[0].services.map((s) => [s.enseignant.id_user, s.role, s.statut_service])).toEqual(
            expect.arrayContaining([
                [permanent.id_user, "principal", "accepte"],
                [vacataire.id_user, "co_enseignant", "refuse"],
            ])
        );
    });
});

describe("Responsable de filière : préparation limitée à sa filière", () => {
    test("/me indique les filières dont il est responsable", async () => {
        const me = await clients.responsable.get("/api/auth/me");
        expect(me.body.user.responsabilites).toEqual([filiereF.filiere.id_filiere]);
    });

    test("maquette et groupes : sa filière oui, une autre non", async () => {
        const chezLui = await clients.responsable.send("post", "/api/cours", {
            code_cours: "FFF-NEW", nom_cours: "Nouveau module", niveau: "4ème année", volume_horaire: 10, type_cours: "TD", semestre: "S7", id_filiere: filiereF.filiere.id_filiere,
        });
        expect(chezLui.status).toBe(201);
        const ailleurs = await clients.responsable.send("post", "/api/cours", {
            code_cours: "GGG-NEW", nom_cours: "Intrus", niveau: "4ème année", volume_horaire: 10, type_cours: "TD", semestre: "S7", id_filiere: filiereG.filiere.id_filiere,
        });
        expect(ailleurs.status).toBe(403);
        const groupeAilleurs = await clients.responsable.send("put", `/api/groupes/${filiereG.promo.id_groupe}`, { effectif: 1 });
        expect(groupeAilleurs.status).toBe(403);
        const deplacement = await clients.responsable.send("put", `/api/cours/${chezLui.body.cours.id_cours}`, { id_filiere: filiereG.filiere.id_filiere });
        expect(deplacement.status).toBe(403);
    });

    test("enseignements : il ne voit et ne gère que ceux de sa filière", async () => {
        const liste = await clients.responsable.get(`/api/enseignements?id_periode=${periode.id_periode}`);
        expect(liste.status).toBe(200);
        expect(new Set(liste.body.map((e) => e.composante.cours.id_filiere))).toEqual(new Set([filiereF.filiere.id_filiere]));

        const sansFiliere = await clients.responsable.send("post", "/api/enseignements/generer", { id_periode: periode.id_periode });
        expect(sansFiliere.status).toBe(403);
        const saFiliere = await clients.responsable.send("post", "/api/enseignements/generer", { id_periode: periode.id_periode, id_filiere: filiereF.filiere.id_filiere });
        expect([200, 201]).toContain(saFiliere.status);

        const autre = await enseignementDe(clients.admin, filiereG);
        const proposer = await clients.responsable.send("post", `/api/enseignements/${autre.id_enseignement}/enseignants`, { id_user: permanent.id_user });
        expect(proposer.status).toBe(403);
    });

    test("un enseignant qui n'est responsable de rien n'accède pas à la préparation", async () => {
        expect((await clients.permanent.get("/api/enseignements")).status).toBe(403);
        expect((await clients.permanent.send("post", "/api/groupes", { nom_groupe: "X", niveau: "1", annee_scolaire: "2026-2027", id_filiere: filiereF.filiere.id_filiere })).status).toBe(403);
    });

    test("seule l'administration nomme les responsables", async () => {
        const response = await clients.responsable.send("post", `/api/filieres/${filiereG.filiere.id_filiere}/responsables`, { id_user: responsable.id_user });
        expect(response.status).toBe(403);
    });
});
