import { resetDatabase, closeDatabase, createUser, loginAs } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import { AnneeUniversitaire, Appartenir, Cours, Filiere, Groupe, SectionCours, SupportCours } from "../../models/index.js";
import { groupesDeLAnnee } from "../../services/annees/annees.js";
import { groupesDeLEtudiant } from "../../services/jeux/jeux.js";
import { groupesVisiblesPar } from "../../services/cours/droits.js";

/**
 * Lot ME-18 (plan multi-établissements, fichier 11, § 11.3) : l'année d'un groupe devient une vraie
 * clé, et une seule règle donne les groupes d'un étudiant pour une année. Un étudiant inscrit en
 * 2025-2026 puis en 2026-2027 ne voit plus, par défaut, que l'année en cours.
 */

let etudiante;
let client;
let annees;
let groupes;

beforeAll(async () => {
    await resetDatabase();
    annees = {
        passee: await AnneeUniversitaire.create({ libelle: "2025-2026", date_debut: "2025-09-01", date_fin: "2026-08-31", active: false }),
        courante: await AnneeUniversitaire.create({ libelle: "2026-2027", date_debut: "2026-09-01", date_fin: "2027-08-31", active: true }),
    };
    const filiere = await Filiere.create({ code_filiere: "ANN", nom_filiere: "Années" });
    const groupe = (nom, annee_scolaire) => Groupe.create({ nom_groupe: nom, niveau: "3A", effectif: 20, annee_scolaire, id_filiere: filiere.id_filiere });
    // L'écriture « 2025/2026 » existe dans les données : elle doit être reconnue
    groupes = { passe: await groupe("ANN-2A", "2025/2026"), courant: await groupe("ANN-3A", "2026-2027"), inconnu: await groupe("ANN-X", "promo spéciale") };

    etudiante = await createUser("etudiant");
    for (const g of Object.values(groupes)) await Appartenir.create({ id_user_etudiant: etudiante.id_user, id_groupe: g.id_groupe });
    const cours = await Cours.create({ code_cours: "ANN-ALG", nom_cours: "Algèbre", niveau: "3A", volume_horaire: 20, type_cours: "CM", semestre: "S1", id_filiere: filiere.id_filiere });
    for (const g of [groupes.passe, groupes.courant]) {
        const section = await SectionCours.create({ id_cours: cours.id_cours, id_groupe: g.id_groupe, titre: `Chapitre ${g.nom_groupe}` });
        await SupportCours.create({ id_section: section.id_section, type: "lien", titre: "Lien", url: "https://example.org" });
    }
    client = await loginAs(etudiante);
});
afterAll(closeDatabase);
beforeEach(resetRateLimiters);

describe("L'année d'un groupe", () => {
    test("se retrouve par son libellé, « / » ou « - » ; un texte illisible la laisse vide", async () => {
        expect((await Groupe.findByPk(groupes.passe.id_groupe)).id_annee).toBe(annees.passee.id_annee);
        expect((await Groupe.findByPk(groupes.courant.id_groupe)).id_annee).toBe(annees.courante.id_annee);
        expect((await Groupe.findByPk(groupes.inconnu.id_groupe)).id_annee).toBeNull();
    });

    test("suit un changement du texte de l'année", async () => {
        const g = await Groupe.findByPk(groupes.inconnu.id_groupe);
        await g.update({ annee_scolaire: "2026/2027" });
        expect(g.id_annee).toBe(annees.courante.id_annee);
        await g.update({ annee_scolaire: "promo spéciale" });
        expect(g.id_annee).toBeNull();
    });
});

describe("Les groupes d'un étudiant", () => {
    test("par défaut, l'année en cours (et les groupes d'année inconnue, pour ne rien cacher par erreur)", async () => {
        const ids = await groupesDeLAnnee(etudiante.id_user);
        expect(ids).toEqual(expect.arrayContaining([groupes.courant.id_groupe, groupes.inconnu.id_groupe]));
        expect(ids).not.toContain(groupes.passe.id_groupe);
    });

    test("une année précise, ou les années qui recouvrent des dates", async () => {
        expect(await groupesDeLAnnee(etudiante.id_user, { annee: annees.passee.id_annee })).toEqual(expect.arrayContaining([groupes.passe.id_groupe]));
        const mars2026 = await groupesDeLAnnee(etudiante.id_user, { du: "2026-03-02", au: "2026-03-10" });
        expect(mars2026).toContain(groupes.passe.id_groupe);
        expect(mars2026).not.toContain(groupes.courant.id_groupe);
    });

    test("une seule règle : l'espace de cours et les jeux donnent la même réponse", async () => {
        const attendu = [...(await groupesDeLAnnee(etudiante.id_user))].sort();
        expect([...(await groupesVisiblesPar(etudiante))].sort()).toEqual(attendu);
        expect([...(await groupesDeLEtudiant(etudiante.id_user))].sort()).toEqual(attendu);
    });

    test("« Mes cours » ne montre plus la classe de l'an passé", async () => {
        const res = await client.get("/api/etudiant/cours");
        expect(res.status).toBe(200);
        expect(res.body.map((c) => c.nom_groupe)).toEqual(["ANN-3A"]);
    });

    test("l'administration filtre la liste et l'arbre des groupes par année (?id_annee)", async () => {
        const admin = await loginAs(await createUser("admin"));
        const liste = await admin.get(`/api/groupes?id_annee=${annees.passee.id_annee}&id_filiere=${groupes.passe.id_filiere}`);
        expect(liste.status).toBe(200);
        expect(liste.body.data.map((g) => g.nom_groupe)).toEqual(["ANN-2A"]);
        const arbre = await admin.get(`/api/groupes/arbre?id_annee=${annees.courante.id_annee}&id_filiere=${groupes.courant.id_filiere}`);
        expect(arbre.status).toBe(200);
        expect(arbre.body.map((g) => g.nom_groupe)).toEqual(["ANN-3A"]);
        // Sans le paramètre, toutes les années, y compris le groupe d'année inconnue
        const toutes = await admin.get(`/api/groupes/arbre?id_filiere=${groupes.passe.id_filiere}`);
        expect(toutes.body.map((g) => g.nom_groupe).sort()).toEqual(["ANN-2A", "ANN-3A", "ANN-X"]);
    });

    test("sans année en cours définie, rien n'est filtré", async () => {
        await annees.courante.update({ active: false, date_debut: "2030-09-01", date_fin: "2031-08-31" });
        try {
            expect(await groupesDeLAnnee(etudiante.id_user)).toEqual(expect.arrayContaining([groupes.passe.id_groupe, groupes.courant.id_groupe]));
        } finally {
            await annees.courante.update({ active: true, date_debut: "2026-09-01", date_fin: "2027-08-31" });
        }
    });
});
