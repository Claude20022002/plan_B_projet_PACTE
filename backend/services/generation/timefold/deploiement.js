import { Op } from "sequelize";
import sequelize from "../../../config/db.js";
import { Affectation, Creneau, Groupe, PlanningSnapshot, Salle, Users } from "../../../models/index.js";
import { STATUTS_ACTIFS, minutes, retenirDansCache, validerAffectation } from "../../planning/affectationRules.js";

/**
 * Déploiement de la semaine type sur le semestre (phase E) : chaque leçon placée par le solveur
 * devient une séance par semaine, de la semaine de début à la semaine de fin de la composante,
 * jusqu'au volume prévu. Chaque séance repasse par les règles de la phase B : une date bloquée
 * (férié, indisponibilité ponctuelle, examen, réservation…) est sautée et la séance continue la
 * semaine suivante. Tout est écrit dans une transaction, rattaché à une nouvelle version
 * (PlanningSnapshot) ; les séances générées précédemment pour ces enseignements sont annulées.
 */

const ajouterJours = (iso, n) => {
    const d = new Date(`${iso}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
};
const lundiDe = (iso) => {
    const d = new Date(`${iso}T12:00:00Z`);
    return ajouterJours(iso, -((d.getUTCDay() + 6) % 7));
};
const aujourdhui = () => new Date().toLocaleDateString("en-CA", { timeZone: process.env.APP_TIMEZONE || "Africa/Casablanca" });

/**
 * @param {object} options periode, placements [{ id, creneauId, salleId }], index (problème), user, session, libelle
 * @returns rapport { creees, enseignements: [...], snapshot }
 */
export const deployerSemaineType = async ({ periode, placements, index, user, session, libelle, surAvancement }) => {
    const creneaux = new Map((await Creneau.findAll()).map((c) => [c.id_creneau, c]));
    const suivantDe = (c) =>
        [...creneaux.values()].find((x) => x.jour_semaine === c.jour_semaine && x.regime === c.regime && x.variante === c.variante && x.rang === c.rang + 1);
    const nbSemaines = periode.nb_semaines || Math.ceil((new Date(periode.date_fin) - new Date(periode.date_debut)) / (7 * 864e5));
    const premierLundi = lundiDe(periode.date_debut);
    // Pas de séance dans le passé : une régénération en cours de semestre ne touche que la suite
    const debutEffectif = periode.date_debut > aujourdhui() ? periode.date_debut : aujourdhui();

    return sequelize.transaction(async (transaction) => {
        const idsEnseignements = [...new Set(Object.values(index).map((i) => i.id_enseignement))];

        // Les séances sont écrites en lot à la fin : on verrouille d'abord les ressources concernées,
        // dans l'ordre du validateur (salles, enseignants, groupes). Une saisie manuelle sur l'une
        // d'elles attend la fin du déploiement, puis se valide en voyant les séances déployées.
        const lock = transaction.LOCK.UPDATE;
        const infos = Object.values(index);
        const idsSalles = [...new Set(placements.map((p) => p.salleId).filter(Boolean))];
        if (idsSalles.length) await Salle.findAll({ where: { id_salle: idsSalles }, attributes: ["id_salle"], transaction, lock });
        await Users.findAll({ where: { id_user: [...new Set(infos.map((i) => i.id_user_enseignant))] }, attributes: ["id_user"], transaction, lock });
        await Groupe.findAll({ where: { id_groupe: [...new Set(infos.map((i) => i.id_groupe))] }, attributes: ["id_groupe"], transaction, lock });

        // Les séances générées précédemment pour ces enseignements (à venir) sont annulées
        await Affectation.update(
            { statut: "annule" },
            { where: { id_enseignement: idsEnseignements, is_generated: true, statut: STATUTS_ACTIFS, date_seance: { [Op.gte]: debutEffectif } }, transaction }
        );

        const snapshot = await PlanningSnapshot.create(
            {
                label: libelle,
                date_debut: periode.date_debut,
                date_fin: periode.date_fin,
                is_active: true,
                id_generation_session: session?.id_generation_session ?? null,
                id_user_admin: user.id_user,
                score_detail: { enseignements: idsEnseignements },
            },
            { transaction }
        );

        const rapportParEnseignement = new Map();
        let creees = 0;
        // Lectures stables mises en cache pour toute la passe (voir validerAffectation)
        const cache = new Map();
        const aEcrire = [];

        // Leçons d'un même enseignement : déployées ensemble (séances par semaine). Une leçon que le
        // calcul n'a pas pu placer (sans créneau, ou sans salle en présentiel) n'est pas déployée :
        // elle est signalée une fois plutôt que refusée chaque semaine.
        const parEnseignement = new Map();
        const nonPlacees = new Map();
        const parLecon = new Map(placements.map((p) => [p.id, p]));
        for (const [leconId, info] of Object.entries(index)) {
            const p = parLecon.get(leconId);
            if (!p?.creneauId || (!p.salleId && !info.distanciel)) {
                nonPlacees.set(info.id_enseignement, (nonPlacees.get(info.id_enseignement) ?? 0) + 1);
                continue;
            }
            if (!parEnseignement.has(info.id_enseignement)) parEnseignement.set(info.id_enseignement, []);
            parEnseignement.get(info.id_enseignement).push({ ...p, info });
        }

        let traites = 0;
        for (const [idEnseignement, lecons] of parEnseignement) {
            if (surAvancement) await surAvancement(traites++ / parEnseignement.size);
            const info = lecons[0].info;
            const ligne = { id_enseignement: idEnseignement, module: info.module, type: info.type, heures_prevues: info.heures_prevues, heures_planifiees: 0, seances: 0, sautees: [], lecons_non_placees: nonPlacees.get(idEnseignement) ?? 0 };
            const semaineDebut = Math.max(1, info.semaine_debut || 1);
            const semaineFin = Math.min(nbSemaines, info.semaine_fin || nbSemaines);
            let heures = 0;

            for (let semaine = semaineDebut; semaine <= semaineFin && heures < info.heures_prevues; semaine += 1) {
                const lundi = ajouterJours(premierLundi, (semaine - 1) * 7);
                for (const lecon of lecons) {
                    if (heures >= info.heures_prevues) break;
                    const premier = creneaux.get(lecon.creneauId);
                    const jour = { lundi: 0, mardi: 1, mercredi: 2, jeudi: 3, vendredi: 4, samedi: 5, dimanche: 6 }[premier.jour_semaine];
                    const date = ajouterJours(lundi, jour);
                    if (date < debutEffectif || date > periode.date_fin) continue;
                    const suite = info.longueur === 2 ? suivantDe(premier) : null;
                    const aPlacer = [premier, ...(suite ? [suite] : [])];
                    const seances = aPlacer.map((c) => ({
                        date_seance: date,
                        id_creneau: c.id_creneau,
                        id_salle: lecon.salleId ?? null,
                        id_groupe: info.id_groupe,
                        id_user_enseignant: info.id_user_enseignant,
                        id_cours: info.id_cours,
                        id_enseignement: idEnseignement,
                    }));
                    // Les deux créneaux d'une demi-journée passent ensemble, ou pas du tout
                    const refus = [];
                    for (const s of seances) {
                        const { violations } = await validerAffectation(s, { transaction, cache });
                        refus.push(...violations.filter((v) => v.bloquant));
                    }
                    if (refus.length) {
                        ligne.sautees.push({ date, raisons: [...new Set(refus.map((v) => v.code))], message: refus[0].message });
                        continue;
                    }
                    for (const s of seances) {
                        await retenirDansCache(cache, s);
                        aEcrire.push({ ...s, statut: "planifie", id_user_admin: user.id_user, id_snapshot: snapshot.id_snapshot, id_generation_session: session?.id_generation_session ?? null, is_generated: true });
                    }
                    creees += seances.length;
                    const dureeHeures = aPlacer.reduce((t, c) => t + (minutes(c.heure_fin) - minutes(c.heure_debut)), 0) / 60;
                    heures += dureeHeures;
                    ligne.seances += 1;
                }
            }
            ligne.heures_planifiees = Math.round(heures * 10) / 10;
            ligne.complet = heures >= info.heures_prevues;
            rapportParEnseignement.set(idEnseignement, ligne);
        }

        for (const [idEnseignement, nombre] of nonPlacees) {
            if (rapportParEnseignement.has(idEnseignement)) continue;
            const info = Object.values(index).find((i) => i.id_enseignement === idEnseignement);
            rapportParEnseignement.set(idEnseignement, { id_enseignement: idEnseignement, module: info.module, type: info.type, heures_prevues: info.heures_prevues, heures_planifiees: 0, seances: 0, sautees: [], lecons_non_placees: nombre, complet: false });
        }

        for (let i = 0; i < aEcrire.length; i += 500) {
            await Affectation.bulkCreate(aEcrire.slice(i, i + 500), { transaction });
        }
        await snapshot.update({ nb_affectations: creees, nb_conflits: 0 }, { transaction });
        return { creees, snapshot, enseignements: [...rapportParEnseignement.values()] };
    });
};
