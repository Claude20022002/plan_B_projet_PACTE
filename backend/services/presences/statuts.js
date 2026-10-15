import { AppelSeance, Presence } from "../../models/index.js";
import { ErreurMetier } from "../planning/enseignements.js";
import { journaliser } from "../journalSecurite.js";
import { etudiantsAttendus, seanceDeLEnseignant } from "./appel.js";

/**
 * Statut d'un étudiant à l'appel (docs/plans/espace-de-cours.md, lot E-6) : présent, en retard ou
 * absent. Pas de statut « excusé » (décision du 15 octobre 2026). Absent = pas de ligne de
 * présence ; un retard est une présence (l'étudiant est dans la salle), marquée comme telle.
 */
export const STATUTS_APPEL = ["present", "retard", "absent"];

/**
 * Pose le statut d'un étudiant attendu (enseignant de la séance, ou administration), avec un motif
 * facultatif. Possible aussi après la fermeture de l'appel : c'est alors une correction,
 * journalisée (qui, quand, avant, après). `choix` : { statut, motif }, ou l'ancienne forme
 * { present } de la case à cocher.
 */
export const marquerPresence = async (user, id, idEtudiant, choix = {}, contexte = null) => {
    const statut = choix.statut ?? (choix.present === true ? "present" : "absent");
    if (!STATUTS_APPEL.includes(statut)) throw new ErreurMetier("Statut inconnu : présent, en retard ou absent", 400);
    const seance = await seanceDeLEnseignant(user, id);
    if (!(await etudiantsAttendus(seance)).some((e) => e.id_user === idEtudiant)) throw new ErreurMetier("Cet étudiant n'est pas attendu à cette séance", 404);

    const where = { id_affectation: seance.id_affectation, id_user: idEtudiant };
    const avant = await Presence.findOne({ where });
    // Lu avant la mise à jour : update() modifie l'objet lui-même
    const precedent = avant?.statut ?? "absent";
    const maintenant = new Date();
    if (statut === "absent") {
        await Presence.destroy({ where });
    } else {
        const champs = { statut, motif: String(choix.motif ?? "").trim().slice(0, 200) || null, modifie_par: user.id_user, modifie_le: maintenant };
        if (avant) await avant.update(champs);
        else await Presence.create({ ...where, ...champs, source: "manuel", marque_le: maintenant });
    }

    const appel = await AppelSeance.findByPk(seance.id_affectation);
    if (appel?.ferme_le && precedent !== statut) {
        await journaliser(contexte, { evenement: "presence_corrigee", user, details: { id_affectation: seance.id_affectation, id_etudiant: idEtudiant, avant: precedent, apres: statut } });
    }
    return { statut, present: statut !== "absent" };
};
