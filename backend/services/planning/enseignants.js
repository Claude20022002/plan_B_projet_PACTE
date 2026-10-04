import { Op } from "sequelize";
import {
    AnneeUniversitaire,
    Disponibilite,
    Enseignant,
    Enseignement,
    EnseignementEnseignant,
    Periode,
    Users,
} from "../../models/index.js";

/**
 * Disponibilité d'un enseignant sur un créneau à une date :
 * - un PERMANENT est disponible partout, sauf là où il s'est déclaré indisponible ;
 * - un VACATAIRE n'est disponible que là où il a déclaré une disponibilité.
 * Les vœux (préféré / à éviter) ne bloquent jamais : ils servent à la génération.
 */
export const disponibiliteEnseignant = async ({ idUser, date, idCreneau }) => {
    const enseignant = await Enseignant.findByPk(idUser);
    if (!enseignant) return { disponible: false, raison: "Enseignant introuvable" };

    const declarations = await Disponibilite.findAll({
        where: {
            id_user_enseignant: idUser,
            id_creneau: idCreneau,
            date_debut: { [Op.lte]: date },
            date_fin: { [Op.gte]: date },
        },
    });
    const indisponibilite = declarations.find((d) => d.disponible === false);
    const preference = declarations.find((d) => d.preference !== "neutre")?.preference || "neutre";

    if (indisponibilite) {
        return { disponible: false, raison: indisponibilite.raison_indisponibilite || "Indisponibilité déclarée", preference };
    }
    if (enseignant.statut === "vacataire" && !declarations.some((d) => d.disponible === true)) {
        return { disponible: false, raison: "Vacataire : aucune disponibilité déclarée sur ce créneau", preference };
    }
    return { disponible: true, raison: null, preference };
};

/** Période (année) prise en compte pour la charge : l'année active par défaut. */
const periodesDeLAnnee = async (idAnnee) => {
    const annee = idAnnee ? await AnneeUniversitaire.findByPk(idAnnee) : await AnneeUniversitaire.findOne({ where: { active: true } });
    if (!annee) return { annee: null, ids: [] };
    const periodes = await Periode.findAll({ where: { id_annee: annee.id_annee }, attributes: ["id_periode"] });
    return { annee, ids: periodes.map((p) => p.id_periode) };
};

/**
 * Charge des enseignants sur une année : heures acceptées et proposées face au service dû.
 * Un co-enseignant compte les heures entières (il est présent à chaque séance) sauf si
 * une part (`heures`) a été fixée sur son service.
 */
export const chargesEnseignants = async ({ idAnnee = null, idUser = null } = {}) => {
    const { annee, ids } = await periodesDeLAnnee(idAnnee);
    const enseignants = await Enseignant.findAll({
        where: idUser ? { id_user: idUser } : {},
        include: [{ model: Users, as: "user", attributes: ["id_user", "nom", "prenom", "email", "actif"] }],
    });

    const services = ids.length
        ? await EnseignementEnseignant.findAll({
              where: { ...(idUser ? { id_user: idUser } : {}), statut_service: { [Op.ne]: "refuse" } },
              include: [{ model: Enseignement, as: "enseignement", where: { id_periode: ids }, attributes: ["heures_prevues"] }],
          })
        : [];

    const totaux = new Map();
    for (const service of services) {
        const heures = service.heures ?? service.enseignement.heures_prevues;
        const total = totaux.get(service.id_user) || { acceptees: 0, proposees: 0 };
        if (service.statut_service === "accepte") total.acceptees += heures;
        else total.proposees += heures;
        totaux.set(service.id_user, total);
    }

    return {
        annee: annee ? { id_annee: annee.id_annee, libelle: annee.libelle } : null,
        charges: enseignants.map((e) => {
            const { acceptees = 0, proposees = 0 } = totaux.get(e.id_user) || {};
            const prevues = acceptees + proposees;
            const du = e.service_annuel_heures;
            return {
                id_user: e.id_user,
                nom: e.user?.nom,
                prenom: e.user?.prenom,
                statut: e.statut,
                departement: e.departement,
                actif: e.user?.actif !== false,
                max_heures_semaine: e.max_heures_semaine ?? null,
                service_du: du ?? null,
                heures_acceptees: acceptees,
                heures_proposees: proposees,
                heures_prevues: prevues,
                // Écart au service dû (permanents) : positif = heures complémentaires, négatif = sous-service
                ecart: du ? prevues - du : null,
            };
        }),
    };
};
