import { Affectation, CoursComposante, Enseignement } from "../../models/index.js";
import { motifLienVisioRefuse } from "../../../shared/lienVisio.js";
import { ErreurMetier } from "./enseignements.js";

/**
 * Lien de visioconférence d'une séance à distance (plan multi-établissements, lot EC-11 ;
 * conception-ec11-groupe-b.md, règles V-1 à V-4). Le lien ne fait pas partie de la version publiée
 * de l'emploi du temps : il ne change ni l'heure ni le lieu, il se voit tout de suite (V-5). Le
 * serveur ne visite jamais l'adresse (V-7).
 */

const MOTIFS = {
    longueur: "Le lien de visio est trop long (500 caractères au plus)",
    adresse: "Le lien de visio n'est pas une adresse web",
    https: "Le lien de visio doit commencer par https://",
    hote: "Le lien de visio doit désigner un site public (par exemple meet.google.com)",
    identifiants: "Le lien de visio ne doit pas contenir d'identifiant ni de mot de passe",
};

/** Une séance est à distance si sa composante est en distanciel ou hybride, ou si elle n'a pas de salle (V-1). */
export const estADistance = (seance) => {
    const modalite = seance.enseignement?.composante?.modalite;
    return modalite === "distanciel" || modalite === "hybride" || !seance.id_salle;
};

/**
 * Pose (ou retire, avec null ou "") le lien de visio de la séance `idAffectation`. Réservé à
 * l'administration et à l'enseignant de la séance (V-3). Rend { id_affectation, lien_visio }.
 */
export const modifierLienVisio = async (acteur, idAffectation, lien) => {
    const seance = await Affectation.findByPk(idAffectation, {
        attributes: ["id_affectation", "id_user_enseignant", "id_salle", "lien_visio"],
        include: [{ model: Enseignement, as: "enseignement", attributes: ["id_enseignement"], include: [{ model: CoursComposante, as: "composante", attributes: ["modalite"] }] }],
    });
    if (!seance) throw new ErreurMetier("Séance introuvable", 404);
    if (acteur?.role !== "admin" && seance.id_user_enseignant !== acteur?.id_user) {
        throw new ErreurMetier("Seul l'enseignant de la séance ou l'administration peut changer son lien de visio", 403);
    }

    // Retirer un lien est toujours permis, même sur une séance devenue présentielle (V-4)
    const adresse = typeof lien === "string" ? lien.trim() : lien;
    if (adresse === null || adresse === undefined || adresse === "") {
        await seance.update({ lien_visio: null });
        return { id_affectation: seance.id_affectation, lien_visio: null };
    }
    if (typeof adresse !== "string") throw new ErreurMetier(MOTIFS.adresse, 400, "LIEN_VISIO_INVALIDE");
    if (!estADistance(seance)) {
        throw new ErreurMetier("Cette séance a lieu en salle : un lien de visio n'est possible que pour une séance à distance", 409, "LIEN_VISIO_PRESENTIEL");
    }
    const motif = motifLienVisioRefuse(adresse);
    if (motif) throw new ErreurMetier(MOTIFS[motif], 400, "LIEN_VISIO_INVALIDE");

    await seance.update({ lien_visio: adresse });
    return { id_affectation: seance.id_affectation, lien_visio: adresse };
};
