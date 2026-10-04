import http from "http";
import { resetDatabase, closeDatabase, createUser, loginAs } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import {
    Affectation,
    AnneeUniversitaire,
    Campus,
    Cours,
    CoursComposante,
    Creneau,
    Disponibilite,
    Enseignant,
    Enseignement,
    EnseignementEnseignant,
    Evenement,
    Filiere,
    Groupe,
    Periode,
    PlanningSnapshot,
    Salle,
} from "../../models/index.js";
import { construireProbleme } from "../../services/generation/timefold/probleme.js";
import { attendreGeneration } from "../../services/generation/timefold/generation.js";
import { retenirDansCache, validerAffectation } from "../../services/planning/affectationRules.js";

/**
 * Phase E — génération par Timefold, côté Planner. Un faux solveur HTTP (glouton) remplace le
 * service Java : il vérifie la forme du problème envoyé et renvoie un placement plausible.
 */

let admin;
let prof;
let prof2;
let vacataire;
let clients;
let ref;
let solveur;
let problemes;

const JETON = "jeton-de-test-0123456789abcdef-0123";

/** Faux service `solver/` : place chaque leçon sur le premier créneau et la première salle libres. */
const demarrerFauxSolveur = () =>
    new Promise((resolve) => {
        problemes = [];
        const resultats = new Map();
        solveur = http.createServer((req, res) => {
            let corps = "";
            req.on("data", (c) => (corps += c));
            req.on("end", () => {
                const repondre = (code, data) => {
                    res.writeHead(code, { "Content-Type": "application/json" });
                    res.end(JSON.stringify(data));
                };
                // Comme le vrai service : jeton partagé obligatoire
                if (req.headers["x-solver-token"] !== JETON) return repondre(401, { erreur: "Jeton du service invalide" });
                if (req.method === "POST" && req.url === "/timetables") {
                    const probleme = JSON.parse(corps);
                    problemes.push(probleme);
                    const places = probleme.lecons.filter((l) => l.epinglee).map((l) => ({ ...l, creneauId: l.creneau.id, salleId: l.salle?.id ?? null }));
                    const creneau = (id) => probleme.creneaux.find((c) => c.id === id);
                    const plage = (l) => ({ jour: creneau(l.creneauId).jour, debut: creneau(l.creneauId).debut, fin: l.longueur === 2 ? creneau(l.creneauId).finAvecSuivant : creneau(l.creneauId).fin });
                    const chevauche = (a, b) => a.jour === b.jour && a.debut < b.fin && b.debut < a.fin;
                    const indispo = new Set(probleme.voeux.filter((v) => v.type === "INDISPONIBLE").map((v) => `${v.enseignantId}|${v.creneauId}`));
                    for (const l of probleme.lecons.filter((x) => !x.epinglee)) {
                        let choisi = null;
                        for (const c of probleme.creneaux.filter((x) => x.regime === l.regime && (l.longueur === 1 || x.suivantId))) {
                            if (l.enseignants.some((e) => indispo.has(`${e}|${c.id}`) || (l.longueur === 2 && indispo.has(`${e}|${c.suivantId}`)))) continue;
                            const p = { jour: c.jour, debut: c.debut, fin: l.longueur === 2 ? c.finAvecSuivant : c.fin };
                            const occupes = places.filter((x) => chevauche(plage(x), p));
                            if (occupes.some((x) => x.enseignants.some((e) => l.enseignants.includes(e)) || x.groupesDirects.some((g) => l.groupes.includes(g)) || l.groupesDirects.some((g) => x.groupes.includes(g)))) continue;
                            const salle = l.distanciel ? null : probleme.salles.find((s) => s.capacite >= l.effectif && (!l.typeSalleRequis || s.type === l.typeSalleRequis) && !occupes.some((x) => x.salleId === s.id));
                            if (!l.distanciel && !salle) continue;
                            choisi = { creneauId: c.id, salleId: salle?.id ?? null };
                            break;
                        }
                        if (choisi) places.push({ ...l, ...choisi });
                    }
                    const id = `calcul-${problemes.length}`;
                    resultats.set(id, places.filter((p) => !p.epinglee).map((p) => ({ id: p.id, creneauId: p.creneauId, salleId: p.salleId })));
                    return repondre(202, { id, dureeSecondes: probleme.dureeSecondes });
                }
                const m = req.url.match(/^\/timetables\/(.+)$/);
                if (m && req.method === "GET") return repondre(200, { id: m[1], statut: "NOT_SOLVING", secondes: 1, score: "0hard/-3soft", dur: 0, souple: -3, lecons: resultats.get(m[1]) ?? [], violations: [], leconsEnConflit: [] });
                if (m && req.method === "DELETE") return repondre(200, { id: m[1] });
                return repondre(404, {});
            });
        });
        solveur.listen(0, "127.0.0.1", () => {
            process.env.SOLVER_URL = `http://127.0.0.1:${solveur.address().port}`;
            process.env.SOLVER_TOKEN = JETON;
            resolve();
        });
    });

beforeAll(async () => {
    await resetDatabase();
    await demarrerFauxSolveur();
    admin = await createUser("admin");
    prof = await createUser("enseignant");
    prof2 = await createUser("enseignant");
    vacataire = await createUser("enseignant");
    await Enseignant.update({ statut: "vacataire" }, { where: { id_user: vacataire.id_user } });
    clients = { admin: await loginAs(admin), prof: await loginAs(prof) };

    const gandhi = await Campus.findOne({ where: { code: "G" } });
    const filiere = await Filiere.create({ code_filiere: "GEN", nom_filiere: "Génération", id_campus_prefere: gandhi.id_campus });
    const promo = await Groupe.create({ nom_groupe: "4A GEN", niveau: "4ème année", annee: 4, effectif: 40, annee_scolaire: "2026-2027", type_groupe: "promotion", id_filiere: filiere.id_filiere });
    const td1 = await Groupe.create({ nom_groupe: "GEN-4A", niveau: "4ème année", annee: 4, effectif: 20, annee_scolaire: "2026-2027", type_groupe: "td", id_groupe_parent: promo.id_groupe, id_filiere: filiere.id_filiere });
    await Salle.create({ nom_salle: "G-GEN1", type_salle: "Salle de cours", capacite: 50, id_campus: gandhi.id_campus });
    await Salle.create({ nom_salle: "G-GENLAB", type_salle: "Labo informatique", capacite: 25, id_campus: gandhi.id_campus });
    const c = (jour_semaine, heure_debut, heure_fin, rang) => Creneau.create({ jour_semaine, heure_debut, heure_fin, duree_minutes: 90, rang });
    const lun = [await c("lundi", "09:00", "10:45", 1), await c("lundi", "11:00", "12:30", 2), await c("lundi", "13:30", "15:15", 3), await c("lundi", "15:30", "17:00", 4)];
    const mar = [await c("mardi", "09:00", "10:45", 1), await c("mardi", "11:00", "12:30", 2)];

    const annee = await AnneeUniversitaire.create({ libelle: "2026-2027", date_debut: "2026-09-01", date_fin: "2027-07-31", active: true });
    // S2 : du lundi 1er mars 2027, 12 semaines de cours
    const periode = await Periode.create({ id_annee: annee.id_annee, code: "S2", date_debut: "2027-03-01", date_fin: "2027-05-22", nb_semaines: 12 });
    const cours = await Cours.create({ code_cours: "GEN-ML", nom_cours: "Machine Learning", niveau: "4ème année", volume_horaire: 33, type_cours: "CM", semestre: "S8", id_filiere: filiere.id_filiere });
    const cm = await CoursComposante.create({ id_cours: cours.id_cours, type: "CM", volume_heures: 21, niveau_groupe: "promotion", creneaux_par_seance: 2 });
    const tp = await CoursComposante.create({ id_cours: cours.id_cours, type: "TP", volume_heures: 12, niveau_groupe: "td", creneaux_par_seance: 2, type_salle_requis: "Labo informatique" });
    const sansProf = await CoursComposante.create({ id_cours: (await Cours.create({ code_cours: "GEN-X", nom_cours: "Module sans enseignant", niveau: "4ème année", volume_horaire: 10, type_cours: "CM", semestre: "S8", id_filiere: filiere.id_filiere })).id_cours, type: "CM", volume_heures: 10, niveau_groupe: "promotion" });

    const ensCm = await Enseignement.create({ id_composante: cm.id_composante, id_periode: periode.id_periode, heures_prevues: 21 });
    await ensCm.setGroupes([promo.id_groupe]);
    const ensTp = await Enseignement.create({ id_composante: tp.id_composante, id_periode: periode.id_periode, heures_prevues: 12 });
    await ensTp.setGroupes([td1.id_groupe]);
    const ensSans = await Enseignement.create({ id_composante: sansProf.id_composante, id_periode: periode.id_periode, heures_prevues: 10 });
    await ensSans.setGroupes([promo.id_groupe]);
    await EnseignementEnseignant.bulkCreate([
        { id_enseignement: ensCm.id_enseignement, id_user: prof.id_user, role: "principal", statut_service: "accepte" },
        { id_enseignement: ensTp.id_enseignement, id_user: vacataire.id_user, role: "principal", statut_service: "accepte" },
    ]);
    // Le vacataire n'a déclaré que le mardi matin
    await Disponibilite.bulkCreate(mar.map((x) => ({ id_user_enseignant: vacataire.id_user, id_creneau: x.id_creneau, date_debut: "2027-03-01", date_fin: "2027-05-22", disponible: true })));
    // Lundi 15 mars : férié (bloquant)
    await Evenement.create({ titre: "Férié de test", date_debut: "2027-03-15", date_fin: "2027-03-15", type_evenement: "ferie", portee: "etablissement", bloque_affectations: true, id_user_createur: admin.id_user });
    // Séances posées à la main pour prof2 (autre module, même promotion) :
    // une ponctuelle le mardi 2 mars à 9 h (date sautée au déploiement), une récurrente le lundi à 13 h 30 (épinglée)
    const autreCours = await Cours.create({ code_cours: "GEN-AUT", nom_cours: "Autre", niveau: "4ème année", volume_horaire: 10, type_cours: "CM", semestre: "S8", id_filiere: filiere.id_filiere });
    const manuelle = (date_seance, creneau) => ({ date_seance, statut: "planifie", id_cours: autreCours.id_cours, id_groupe: promo.id_groupe, id_user_enseignant: prof2.id_user, id_salle: null, id_creneau: creneau.id_creneau, id_user_admin: admin.id_user });
    await Affectation.bulkCreate([manuelle("2027-03-02", mar[0]), manuelle("2027-03-01", lun[2]), manuelle("2027-03-08", lun[2])]);
    ref = { filiere, promo, td1, periode, ensCm, ensTp, ensSans, lun, mar, cours };
});
afterAll(async () => {
    await new Promise((r) => solveur.close(r));
    await closeDatabase();
});
beforeEach(resetRateLimiters);

describe("Problème envoyé au solveur", () => {
    test("leçons, groupes occupés, grille, disponibilités et occupations épinglées", async () => {
        const { probleme, exclus, index } = await construireProbleme({ id_periode: ref.periode.id_periode, id_filieres: [ref.filiere.id_filiere] });
        const lecons = probleme.lecons.filter((l) => !l.epinglee);
        expect(lecons.map((l) => index[l.id].id_enseignement).sort()).toEqual([ref.ensCm.id_enseignement, ref.ensTp.id_enseignement].sort());
        expect(exclus).toEqual([expect.objectContaining({ id_enseignement: ref.ensSans.id_enseignement, raison: "sans_enseignant" })]);

        const tp = lecons.find((l) => l.type === "TP");
        expect(tp).toMatchObject({ longueur: 2, typeSalleRequis: "Labo informatique", effectif: 20, groupesDirects: [ref.td1.id_groupe] });
        expect(tp.groupes.sort()).toEqual([ref.td1.id_groupe, ref.promo.id_groupe].sort());
        // Groupes les plus fins : le TD n'a pas de sous-groupe ; le CM de promotion concerne ce même TD
        expect(tp.feuilles).toEqual([ref.td1.id_groupe]);
        expect(lecons.find((l) => l.type === "CM").feuilles).toEqual([ref.td1.id_groupe]);

        const lundi1 = probleme.creneaux.find((c) => c.id === ref.lun[0].id_creneau);
        expect(lundi1).toMatchObject({ jour: 1, debut: 540, fin: 645, suivantId: ref.lun[1].id_creneau, finAvecSuivant: 750 });
        expect(probleme.creneaux.find((c) => c.id === ref.lun[1].id_creneau).suivantId).toBeNull();

        // Vacataire : indisponible partout sauf le mardi matin déclaré
        const indispos = probleme.voeux.filter((v) => v.enseignantId === vacataire.id_user && v.type === "INDISPONIBLE").map((v) => v.creneauId);
        expect(indispos.sort()).toEqual(ref.lun.map((x) => x.id_creneau).sort());

        // Seul le motif récurrent est épinglé ; la séance ponctuelle sera sautée au déploiement
        const epinglees = probleme.lecons.filter((l) => l.epinglee);
        expect(epinglees).toEqual([expect.objectContaining({ enseignants: [prof2.id_user], creneau: { id: ref.lun[2].id_creneau }, distanciel: true })]);
        expect(probleme.parametres).toMatchObject({ maxMinutesJourGroupe: 480, samediApresMidi: false });
    });
});

describe("Validation en série avec cache (déploiement)", () => {
    test("une séance retenue, pas encore écrite, bloque les validations suivantes de la passe", async () => {
        const cache = new Map();
        const salle = await Salle.findOne({ where: { nom_salle: "G-GEN1" } });
        // Lundi 7 juin 2027 : hors des semaines déployées
        const cm = { date_seance: "2027-06-07", id_creneau: ref.lun[0].id_creneau, id_salle: salle.id_salle, id_groupe: ref.promo.id_groupe, id_user_enseignant: prof.id_user, id_cours: ref.cours.id_cours, id_enseignement: ref.ensCm.id_enseignement };
        expect((await validerAffectation(cm, { cache })).bloquant).toBe(false);
        await retenirDansCache(cache, cm);

        // Même créneau, un TD de la promotion, un autre enseignant, sans salle : conflit de groupe
        const td = { ...cm, id_groupe: ref.td1.id_groupe, id_user_enseignant: prof2.id_user, id_enseignement: null, id_salle: null };
        const { violations } = await validerAffectation(td, { cache });
        expect(violations.map((v) => v.code)).toContain("conflit_groupe");
        // La même salle, un autre groupe et un autre enseignant : conflit de salle
        expect((await validerAffectation({ ...td, id_groupe: ref.promo.id_groupe, id_salle: salle.id_salle }, { cache })).violations.map((v) => v.code)).toContain("conflit_salle");
        expect(await Affectation.count({ where: { date_seance: "2027-06-07" } })).toBe(0);
    });
});

describe("Génération complète", () => {
    let premiereSession;

    test("calcul puis déploiement : volume atteint, férié sauté, rapport et version", async () => {
        const reponse = await clients.admin.send("post", "/api/generation-automatique/generer", { id_periode: ref.periode.id_periode, id_filieres: [ref.filiere.id_filiere], duree_secondes: 10 });
        expect(reponse.status).toBe(202);
        premiereSession = reponse.body.session.id_generation_session;
        await attendreGeneration(premiereSession);

        const session = (await clients.admin.get(`/api/generation-automatique/sessions/${premiereSession}`)).body;
        expect(session.status).toBe("completed");
        const rapport = session.config.rapport;
        expect(rapport.exclus.map((e) => e.raison)).toEqual(["sans_enseignant"]);
        // Le vacataire a déclaré assez de créneaux pour son TP : rien à signaler
        expect(rapport.avertissements).toEqual([]);

        // CM : 21 h en demi-journées de 3 h 15 → 7 séances (14 créneaux), le lundi 15 mars sauté
        const cm = rapport.enseignements.find((e) => e.id_enseignement === ref.ensCm.id_enseignement);
        expect(cm).toMatchObject({ seances: 7, complet: true });
        expect(cm.sautees).toEqual([expect.objectContaining({ date: "2027-03-15", raisons: ["evenement"] })]);
        expect(await Affectation.count({ where: { id_enseignement: ref.ensCm.id_enseignement, statut: "planifie" } })).toBe(14);

        // TP du vacataire : uniquement sur ses créneaux déclarés (mardi matin), 12 h → 4 séances ;
        // le mardi 2 mars est sauté (séance manuelle de la promotion à 9 h)
        const tp = rapport.enseignements.find((e) => e.id_enseignement === ref.ensTp.id_enseignement);
        expect(tp).toMatchObject({ seances: 4, complet: true });
        expect(tp.sautees).toEqual([expect.objectContaining({ date: "2027-03-02" })]);
        const tpSeances = await Affectation.findAll({ where: { id_enseignement: ref.ensTp.id_enseignement, statut: "planifie" }, include: ["creneau", "salle"] });
        expect(tpSeances.every((s) => s.creneau.jour_semaine === "mardi" && s.salle.type_salle === "Labo informatique")).toBe(true);
        expect(tpSeances).toHaveLength(8);
        expect(tpSeances.some((s) => s.date_seance === "2027-03-02")).toBe(false);

        expect(await PlanningSnapshot.count({ where: { id_snapshot: rapport.id_snapshot, is_active: true } })).toBe(1);
        expect(problemes[0].lecons.filter((l) => !l.epinglee)).toHaveLength(2);
    });

    test("régénérer annule les séances générées précédemment ; réactiver l'ancienne version les rétablit", async () => {
        const avant = await Affectation.findAll({ where: { id_enseignement: ref.ensCm.id_enseignement, statut: "planifie" } });
        const reponse = await clients.admin.send("post", "/api/generation-automatique/generer", { id_periode: ref.periode.id_periode, id_filieres: [ref.filiere.id_filiere], duree_secondes: 10 });
        await attendreGeneration(reponse.body.session.id_generation_session);
        const anciennes = await Affectation.findAll({ where: { id_affectation: avant.map((a) => a.id_affectation) } });
        expect(anciennes.every((a) => a.statut === "annule")).toBe(true);
        expect(await Affectation.count({ where: { id_enseignement: ref.ensCm.id_enseignement, statut: "planifie" } })).toBe(14);

        const ancienneVersion = anciennes[0].id_snapshot;
        expect((await clients.admin.send("post", `/api/generation-automatique/snapshots/${ancienneVersion}/rollback`)).status).toBe(200);
        expect(await Affectation.count({ where: { id_snapshot: ancienneVersion, id_enseignement: ref.ensCm.id_enseignement, statut: "planifie" } })).toBe(avant.length);
        expect(await Affectation.count({ where: { id_enseignement: ref.ensCm.id_enseignement, statut: "planifie" } })).toBe(14);
    });

    test("solveur injoignable : la génération échoue proprement avec un message clair", async () => {
        const url = process.env.SOLVER_URL;
        process.env.SOLVER_URL = "http://127.0.0.1:9";
        const reponse = await clients.admin.send("post", "/api/generation-automatique/generer", { id_periode: ref.periode.id_periode, id_filieres: [ref.filiere.id_filiere] });
        await attendreGeneration(reponse.body.session.id_generation_session);
        process.env.SOLVER_URL = url;
        const session = (await clients.admin.get(`/api/generation-automatique/sessions/${reponse.body.session.id_generation_session}`)).body;
        expect(session.status).toBe("failed");
        expect(session.last_message).toMatch(/injoignable/);
        // L'adresse interne du service n'est pas divulguée
        expect(session.last_message).not.toMatch(/127\.0\.0\.1/);
    });

    test("mauvais jeton : refusé par le service, message de configuration", async () => {
        process.env.SOLVER_TOKEN = "mauvais";
        const reponse = await clients.admin.send("post", "/api/generation-automatique/generer", { id_periode: ref.periode.id_periode, id_filieres: [ref.filiere.id_filiere] });
        await attendreGeneration(reponse.body.session.id_generation_session);
        process.env.SOLVER_TOKEN = JETON;
        const session = (await clients.admin.get(`/api/generation-automatique/sessions/${reponse.body.session.id_generation_session}`)).body;
        expect(session.status).toBe("failed");
        expect(session.last_message).toMatch(/SOLVER_TOKEN/);
    });

    test("réservé à l'administration ; période requise", async () => {
        expect((await clients.prof.send("post", "/api/generation-automatique/generer", { id_periode: ref.periode.id_periode })).status).toBe(403);
        expect((await clients.admin.send("post", "/api/generation-automatique/generer", {})).status).toBe(400);
    });
});
