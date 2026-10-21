import { Filiere, GenerationSession, Periode } from "../../../models/index.js";
import { ErreurMetier } from "../../planning/enseignements.js";
import { construireProbleme } from "./probleme.js";
import { arreterCalcul, attendreSolution, lancerCalcul } from "./solveurClient.js";
import { deployerSemaineType } from "./deploiement.js";
import { aCorriger, dureeAutomatique, resume } from "./rapport.js";

/**
 * Génération automatique par Timefold (phase E), en tâche de fond : construction du problème,
 * calcul de la semaine type par le service `solver/`, puis déploiement sur le semestre sous les
 * règles de la phase B. L'avancement et le rapport final vivent dans GenerationSession, que le
 * frontend interroge, avec l'étape en cours (config.etape : preparation, calcul, placement ; R-4).
 * Sans durée demandée, la durée du calcul suit la taille du problème (rapport.js).
 */

// Calculs en cours (pour l'arrêt anticipé, et pour que les tests attendent la fin)
const enCours = new Map();

const majSession = (session, champs) => session.update(champs).catch(() => {});

/** Passe à une étape lisible (preparation, calcul, placement), avec l'avancement et le message. */
const etape = (session, cle, champs) => majSession(session, { ...champs, config: { ...(session.config || {}), etape: cle } });

const executer = async (session, { id_periode, id_filieres, dureeSecondes, user }) => {
    const debut = Date.now();
    try {
        await etape(session, "preparation", { progress: 5, last_message: "Préparation : enseignements, salles et disponibilités" });
        const { probleme, index, exclus, avertissements, periode } = await construireProbleme({ id_periode, id_filieres, dureeSecondes: dureeSecondes ?? 60 });
        const aPlacer = probleme.lecons.filter((l) => !l.epinglee).length;
        if (!aPlacer) {
            throw new ErreurMetier(exclus.length ? "Aucun enseignement à placer : tous sont déjà planifiés ou sans enseignant" : "Aucun enseignement sur cette période", 400);
        }

        if (!dureeSecondes) probleme.dureeSecondes = dureeAutomatique(aPlacer);
        await etape(session, "calcul", { progress: 10, last_message: `Calcul de la semaine type : ${aPlacer} séance(s) à placer, ${probleme.dureeSecondes} s au plus` });
        const { id, dureeSecondes: duree } = await lancerCalcul(probleme);
        enCours.get(session.id_generation_session).calcul = id;
        const etat = await attendreSolution(id, {
            dureeSecondes: duree,
            surProgression: (e) => majSession(session, { progress: Math.min(70, 10 + Math.round((60 * (e.secondes || 0)) / duree)), last_message: "Calcul de la semaine type" }),
        });

        await etape(session, "placement", { progress: 75, last_message: "Placement des séances sur les semaines du semestre" });
        const filieres = id_filieres.length ? await Filiere.findAll({ where: { id_filiere: id_filieres }, attributes: ["code_filiere"] }) : [];
        const libelle = `Timefold ${periode.code} ${periode.annee?.libelle ?? ""}${filieres.length ? ` · ${filieres.map((f) => f.code_filiere).join(", ")}` : ""}`.trim();
        const deploiement = await deployerSemaineType({
            periode,
            placements: etat.lecons,
            index,
            user,
            session,
            libelle,
            // En mémoire seulement : les séances insérées dans la transaction verrouillent la ligne de
            // la session (clé étrangère) ; l'écrire maintenant attendrait la fin de cette transaction
            surAvancement: (part) => {
                enCours.get(session.id_generation_session).progression = { progress: 75 + Math.round(23 * part), last_message: `Placement des séances sur les semaines du semestre (${Math.round(100 * part)} %)` };
            },
        });

        const nonPlaces = deploiement.enseignements.filter((e) => !e.complet);
        const leconsEnConflit = (etat.leconsEnConflit ?? []).filter((l) => index[l]).map((l) => index[l].module);
        const rapport = {
            // Ce que lit l'administration (M-3) : des chiffres positifs, puis quoi corriger et où
            resume: resume({ enseignements: deploiement.enseignements, exclus, creees: deploiement.creees }),
            a_corriger: aCorriger({ avertissements, exclus, enseignements: deploiement.enseignements, leconsEnConflit }),
            // Ancien champ, lu par l'écran actuel en attendant le résumé : les conflits à l'arrivée (toujours 0),
            // et non plus le score interne du solveur, qui affichait « −142 »
            regles_dures_enfreintes: 0,
            // Ancien champ lu par l'écran actuel (détail des contraintes du solveur), gardé tant qu'il le lit
            violations: etat.violations ?? [],
            duree_calcul_s: duree,
            lecons_en_conflit: leconsEnConflit,
            exclus,
            avertissements,
            enseignements: deploiement.enseignements,
            seances_creees: deploiement.creees,
            id_snapshot: deploiement.snapshot.id_snapshot,
            // Pour le diagnostic seulement : le score interne du solveur, à ne pas afficher tel quel
            details_solveur: { score: etat.score, regles_dures: etat.dur ?? null, violations: etat.violations ?? [] },
        };
        await session.update({
            status: "completed",
            progress: 100,
            last_message: `${deploiement.creees} séance(s) créée(s), ${nonPlaces.length} enseignement(s) incomplet(s)`,
            score_total: etat.dur ?? null,
            score_detail: { score: etat.score, violations: rapport.violations },
            nb_assignees: deploiement.creees,
            nb_non_placees: nonPlaces.length + exclus.length,
            nb_conflits: 0,
            duration_ms: Date.now() - debut,
            config: { ...(session.config || {}), rapport },
        });
    } catch (error) {
        await session.update({ status: "failed", progress: 100, last_message: error.message.slice(0, 250), duration_ms: Date.now() - debut }).catch(() => {});
    } finally {
        enCours.delete(session.id_generation_session);
    }
};

/** Démarre une génération ; renvoie la session tout de suite (suivi par GET /sessions/:id). */
export const lancerGeneration = async ({ id_periode, id_filieres = [], dureeSecondes = null, user }) => {
    if (enCours.size) throw new ErreurMetier("Une génération est déjà en cours : attendez qu'elle se termine", 409);
    const periode = await Periode.findByPk(id_periode);
    if (!periode) throw new ErreurMetier("Période introuvable", 404);
    const session = await GenerationSession.create({
        label: `Génération Timefold ${periode.code}`,
        date_debut: periode.date_debut,
        date_fin: periode.date_fin,
        status: "running",
        progress: 1,
        last_message: "Génération démarrée",
        config: { moteur: "timefold", id_periode, id_filieres, dureeSecondes },
        id_user_admin: user.id_user,
    });
    const travail = { calcul: null };
    enCours.set(session.id_generation_session, travail);
    travail.promesse = executer(session, { id_periode, id_filieres, dureeSecondes, user });
    return session;
};

/** Arrêt anticipé : le solveur garde sa meilleure solution, qui est ensuite déployée. */
export const arreterGeneration = async (idSession) => {
    const travail = enCours.get(Number(idSession));
    if (!travail?.calcul) throw new ErreurMetier("Aucun calcul en cours pour cette génération", 400);
    await arreterCalcul(travail.calcul);
};

/** Avancement tenu en mémoire pendant le déploiement (voir `executer`), ou null. */
export const progressionEnMemoire = (idSession) => enCours.get(Number(idSession))?.progression ?? null;

/** Pour les tests : attend la fin d'une génération lancée dans ce processus. */
export const attendreGeneration = async (idSession) => enCours.get(Number(idSession))?.promesse;
