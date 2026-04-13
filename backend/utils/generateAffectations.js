/**
 * Algorithme de génération automatique d'affectations
 * Prend en compte :
 * - Disponibilités des enseignants
 * - Volume horaire des cours par semestre
 * - Contraintes de salles
 * - Événements/indisponibilités
 * - Éviter les conflits
 */

import { Op } from "sequelize";
import {
    Affectation,
    Cours,
    Groupe,
    Salle,
    Creneau,
    Users,
    Disponibilite,
    Evenement,
    Filiere,
    Enseignant,
} from "../models/index.js";

/**
 * Calcule le nombre de séances nécessaires pour un cours
 * @param {Number} volumeHoraire - Volume horaire total du cours
 * @param {Number} dureeCreneau - Durée d'un créneau en heures
 * @returns {Number} Nombre de séances nécessaires
 */
const calculerNombreSeances = (volumeHoraire, dureeCreneau) => {
    return Math.ceil(volumeHoraire / dureeCreneau);
};

/**
 * Calcule la durée d'un créneau en heures
 * @param {String|Date} heureDebut - Heure de début (format HH:mm ou Date)
 * @param {String|Date} heureFin - Heure de fin (format HH:mm ou Date)
 * @returns {Number} Durée en heures
 */
const calculerDureeCreneau = (heureDebut, heureFin) => {
    // Convertir en string si c'est un objet Date ou autre format
    let debutStr = heureDebut;
    let finStr = heureFin;
    
    if (heureDebut instanceof Date) {
        debutStr = `${heureDebut.getHours().toString().padStart(2, '0')}:${heureDebut.getMinutes().toString().padStart(2, '0')}`;
    } else if (typeof heureDebut === 'string' && heureDebut.includes('T')) {
        // Format ISO datetime
        const date = new Date(heureDebut);
        debutStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    if (heureFin instanceof Date) {
        finStr = `${heureFin.getHours().toString().padStart(2, '0')}:${heureFin.getMinutes().toString().padStart(2, '0')}`;
    } else if (typeof heureFin === 'string' && heureFin.includes('T')) {
        // Format ISO datetime
        const date = new Date(heureFin);
        finStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // Extraire les heures et minutes (gérer le format HH:mm:ss)
    const debutParts = debutStr.split(":");
    const finParts = finStr.split(":");
    const h1 = parseInt(debutParts[0], 10);
    const m1 = parseInt(debutParts[1] || 0, 10);
    const h2 = parseInt(finParts[0], 10);
    const m2 = parseInt(finParts[1] || 0, 10);
    
    const debut = h1 * 60 + m1;
    const fin = h2 * 60 + m2;
    return (fin - debut) / 60;
};

/**
 * Convertit une heure (HH:mm, HH:mm:ss ou Date) en minutes
 * @param {String|Date} heure
 * @returns {Number}
 */
const convertirHeureEnMinutes = (heure) => {
    if (heure instanceof Date) {
        return heure.getHours() * 60 + heure.getMinutes();
    }

    const heureStr = typeof heure === "string" && heure.includes("T")
        ? new Date(heure).toTimeString().slice(0, 8)
        : heure;

    const [h = "0", m = "0"] = String(heureStr).split(":");
    return parseInt(h, 10) * 60 + parseInt(m, 10);
};

/**
 * Vérifie si une date est dans une période d'événement bloquant
 * @param {String} date - Date à vérifier (format YYYY-MM-DD)
 * @param {Array} evenements - Liste des événements
 * @returns {Boolean} True si la date est bloquée
 */
const estDateBloquee = (date, evenements) => {
    return evenements.some(
        (evt) =>
            evt.bloque_affectations &&
            date >= evt.date_debut &&
            date <= evt.date_fin
    );
};

/**
 * Vérifie si un enseignant est disponible pour un créneau à une date donnée
 * @param {Number} idEnseignant - ID de l'enseignant
 * @param {Number} idCreneau - ID du créneau
 * @param {String} date - Date (format YYYY-MM-DD)
 * @param {Array} disponibilites - Liste des disponibilités de l'enseignant
 * @param {Array} affectationsExistantes - Affectations déjà créées
 * @returns {Boolean} True si disponible
 */
const estEnseignantDisponible = (
    idEnseignant,
    idCreneau,
    date,
    disponibilites,
    affectationsExistantes
) => {
    // Vérifier les disponibilités déclarées
    const disponibilite = disponibilites.find(
        (d) =>
            d.id_creneau === idCreneau &&
            date >= d.date_debut &&
            date <= d.date_fin
    );

    if (!disponibilite || !disponibilite.disponible) {
        return false;
    }

    // Vérifier qu'il n'a pas déjà une affectation à ce créneau cette date
    const conflit = affectationsExistantes.some(
        (aff) =>
            aff.id_user_enseignant === idEnseignant &&
            aff.id_creneau === idCreneau &&
            aff.date_seance === date &&
            aff.statut !== "annule"
    );

    return !conflit;
};

/**
 * Vérifie si une salle est disponible pour un créneau à une date donnée
 * @param {Number} idSalle - ID de la salle
 * @param {Number} idCreneau - ID du créneau
 * @param {String} date - Date (format YYYY-MM-DD)
 * @param {Array} affectationsExistantes - Affectations déjà créées
 * @returns {Boolean} True si disponible
 */
const estSalleDisponible = (
    idSalle,
    idCreneau,
    date,
    affectationsExistantes
) => {
    return !affectationsExistantes.some(
        (aff) =>
            aff.id_salle === idSalle &&
            aff.id_creneau === idCreneau &&
            aff.date_seance === date &&
            aff.statut !== "annule"
    );
};

/**
 * Vérifie si un groupe est disponible pour un créneau à une date donnée
 * @param {Number} idGroupe - ID du groupe
 * @param {Number} idCreneau - ID du créneau
 * @param {String} date - Date (format YYYY-MM-DD)
 * @param {Array} affectationsExistantes - Affectations déjà créées
 * @returns {Boolean} True si disponible
 */
const estGroupeDisponible = (
    idGroupe,
    idCreneau,
    date,
    affectationsExistantes
) => {
    return !affectationsExistantes.some(
        (aff) =>
            aff.id_groupe === idGroupe &&
            aff.id_creneau === idCreneau &&
            aff.date_seance === date &&
            aff.statut !== "annule"
    );
};

/**
 * Convertit un jour de la semaine (string) en nombre (0=dimanche, 1=lundi, etc.)
 * @param {String} jourSemaine - Jour de la semaine ("lundi", "mardi", etc.)
 * @returns {Number} Numéro du jour (0-6)
 */
const convertirJourEnNombre = (jourSemaine) => {
    const mapping = {
        dimanche: 0,
        lundi: 1,
        mardi: 2,
        mercredi: 3,
        jeudi: 4,
        vendredi: 5,
        samedi: 6,
    };
    return mapping[jourSemaine.toLowerCase()] ?? 1; // Par défaut lundi
};

/**
 * Génère les dates de séances pour une période donnée
 * @param {String} dateDebut - Date de début (format YYYY-MM-DD)
 * @param {String} dateFin - Date de fin (format YYYY-MM-DD)
 * @param {String} jourSemaine - Jour de la semaine ("lundi", "mardi", etc.)
 * @param {Array} evenements - Liste des événements bloquants
 * @returns {Array} Liste des dates disponibles
 */
const genererDatesSeances = (dateDebut, dateFin, jourSemaine, evenements) => {
    const dates = [];
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);
    const current = new Date(debut);
    const jourNombre = convertirJourEnNombre(jourSemaine);

    while (current <= fin) {
        if (current.getDay() === jourNombre) {
            const dateStr = current.toISOString().split("T")[0];
            if (!estDateBloquee(dateStr, evenements)) {
                dates.push(dateStr);
            }
        }
        current.setDate(current.getDate() + 1);
    }

    return dates;
};

/**
 * Génère tous les slots de planification dans l'ordre chronologique
 * @param {Array} creneaux
 * @param {String} dateDebut
 * @param {String} dateFin
 * @param {Array} evenements
 * @returns {Array}
 */
const genererSlotsChronologiques = (creneaux, dateDebut, dateFin, evenements) => {
    const slots = [];

    for (const creneau of creneaux) {
        const dates = genererDatesSeances(
            dateDebut,
            dateFin,
            creneau.jour_semaine,
            evenements
        );

        for (const date of dates) {
            slots.push({
                date,
                id_creneau: creneau.id_creneau,
                jour_semaine: creneau.jour_semaine,
                heure_debut: creneau.heure_debut,
                heure_fin: creneau.heure_fin,
                dureeHeures: calculerDureeCreneau(
                    creneau.heure_debut,
                    creneau.heure_fin
                ),
                debutMinutes: convertirHeureEnMinutes(creneau.heure_debut),
            });
        }
    }

    slots.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.debutMinutes - b.debutMinutes;
    });

    return slots;
};

/**
 * Trouve un enseignant disponible pour un cours
 * @param {Number} idCours - ID du cours
 * @param {Number} idCreneau - ID du créneau
 * @param {String} date - Date (format YYYY-MM-DD)
 * @param {Array} enseignants - Liste des enseignants
 * @param {Object} disponibilitesParEnseignant - Disponibilités par enseignant
 * @param {Array} affectationsExistantes - Affectations déjà créées
 * @returns {Object|null} Enseignant disponible ou null
 */
const trouverEnseignantDisponible = (
    idCours,
    idCreneau,
    date,
    enseignants,
    disponibilitesParEnseignant,
    affectationsExistantes
) => {
    // Prioriser les enseignants qui enseignent déjà ce cours
    const enseignantsTries = [...enseignants].sort((a, b) => {
        const aEnseigne = affectationsExistantes.some(
            (aff) => aff.id_cours === idCours && aff.id_user_enseignant === a.id_user
        );
        const bEnseigne = affectationsExistantes.some(
            (aff) => aff.id_cours === idCours && aff.id_user_enseignant === b.id_user
        );
        if (aEnseigne && !bEnseigne) return -1;
        if (!aEnseigne && bEnseigne) return 1;
        return 0;
    });

    for (const enseignant of enseignantsTries) {
        const disponibilites = disponibilitesParEnseignant[enseignant.id_user] || [];
        if (
            estEnseignantDisponible(
                enseignant.id_user,
                idCreneau,
                date,
                disponibilites,
                affectationsExistantes
            )
        ) {
            return enseignant;
        }
    }

    return null;
};

/**
 * Trouve une salle disponible pour un groupe
 * Alterne entre Amphi (CM) et Salle Info (TP/TD) selon le type de cours
 * @param {Number} effectifGroupe - Effectif du groupe
 * @param {Number} idCreneau - ID du créneau
 * @param {String} date - Date (format YYYY-MM-DD)
 * @param {Array} salles - Liste des salles
 * @param {Array} affectationsExistantes - Affectations déjà créées
 * @param {String|null} typeCours - Type du cours pour choisir le type de salle
 * @returns {Object|null} Salle disponible ou null
 */
const trouverSalleDisponible = (
    effectifGroupe,
    idCreneau,
    date,
    salles,
    affectationsExistantes,
    typeCours = null
) => {
    const type = (typeCours || '').toLowerCase();
    const preferAmphi    = ['cm', 'cours magistral'].includes(type);
    const preferSalleInfo = ['tp', 'td', 'travaux pratiques', 'travaux dirigés'].includes(type);

    // Trier : plus petite salle adaptée, en priorisant le type de salle voulu
    const sallesTriees = [...salles]
        .filter((s) => s.disponible && s.capacite >= effectifGroupe)
        .sort((a, b) => {
            const aIsAmphi = (a.nom_salle || '').toLowerCase().includes('amphi');
            const bIsAmphi = (b.nom_salle || '').toLowerCase().includes('amphi');
            const aIsInfo  = (a.nom_salle || '').toLowerCase().includes('info');
            const bIsInfo  = (b.nom_salle || '').toLowerCase().includes('info');

            if (preferAmphi) {
                if (aIsAmphi && !bIsAmphi) return -1;
                if (!aIsAmphi && bIsAmphi) return 1;
            } else if (preferSalleInfo) {
                if (aIsInfo && !bIsInfo) return -1;
                if (!aIsInfo && bIsInfo) return 1;
            }
            return a.capacite - b.capacite;
        });

    for (const salle of sallesTriees) {
        if (estSalleDisponible(salle.id_salle, idCreneau, date, affectationsExistantes)) {
            return salle;
        }
    }

    return null;
};

/**
 * Génère automatiquement les affectations pour un semestre
 * @param {Object} params - Paramètres de génération
 * @param {String} params.dateDebut - Date de début du semestre
 * @param {String} params.dateFin - Date de fin du semestre
 * @param {Array} params.coursIds - IDs des cours à planifier (optionnel, si vide, tous les cours)
 * @param {Array} params.groupeIds - IDs des groupes à planifier (optionnel, si vide, tous les groupes)
 * @param {Number} params.idUserAdmin - ID de l'administrateur qui lance la génération
 * @param {Boolean} params.ecraserAffectations - Si true, supprime les affectations existantes pour ces cours/groupes
 * @returns {Object} Résultat de la génération
 */
export const genererAffectationsAutomatiques = async (params) => {
    const {
        dateDebut,
        dateFin,
        coursIds = [],
        groupeIds = [],
        idUserAdmin,
        ecraserAffectations = false,
        maxSessionHours = 4,
        maxHoursPerDayGroup = 6,
        maxHoursPerDayCourse = 4,
        allowSameCourseTwicePerDay = false,
    } = params;

    const resultat = {
        affectationsCreees: [],
        affectationsEchouees: [],
        statistiques: {
            totalSeancesPlanifiees: 0,
            totalSeancesEchouees: 0,
            conflitsDetectes: 0,
        },
    };

    try {
        // 1. Récupérer les groupes
        const whereGroupe = groupeIds.length > 0 ? { id_groupe: { [Op.in]: groupeIds } } : {};
        const groupes = await Groupe.findAll({ 
            where: whereGroupe,
            include: [{ model: Filiere, as: "filiere" }],
        });

        if (groupes.length === 0) {
            throw new Error("Aucun groupe trouvé à planifier");
        }

        // 2. Pour chaque groupe, récupérer les cours correspondants (même filière et même niveau)
        const coursParGroupe = {};
        for (const groupe of groupes) {
            const whereCours = {
                id_filiere: groupe.id_filiere,
                niveau: groupe.niveau,
            };
            
            if (coursIds.length > 0) {
                whereCours.id_cours = { [Op.in]: coursIds };
            }

            const coursDuGroupe = await Cours.findAll({
                where: whereCours,
            });

            if (coursDuGroupe.length === 0) {
                console.warn(`Aucun cours trouvé pour le groupe ${groupe.nom_groupe} (filière: ${groupe.filiere?.nom_filiere}, niveau: ${groupe.niveau})`);
            } else {
                coursParGroupe[groupe.id_groupe] = coursDuGroupe;
            }
        }

        // Vérifier qu'on a au moins un cours pour au moins un groupe
        const totalCours = Object.values(coursParGroupe).reduce((sum, cours) => sum + cours.length, 0);
        if (totalCours === 0) {
            throw new Error("Aucun cours trouvé pour les groupes sélectionnés. Vérifiez que les cours correspondent aux filières et niveaux des groupes.");
        }

        // 3. Récupérer les créneaux
        const creneaux = await Creneau.findAll({
            order: [["jour_semaine", "ASC"], ["heure_debut", "ASC"]],
        });

        if (creneaux.length === 0) {
            throw new Error("Aucun créneau trouvé");
        }

        // 4. Récupérer les salles disponibles
        const salles = await Salle.findAll({
            where: { disponible: true },
            order: [["capacite", "ASC"]],
        });

        if (salles.length === 0) {
            throw new Error("Aucune salle disponible");
        }

        // 5. Récupérer les enseignants
        const enseignants = await Users.findAll({
            where: { role: "enseignant", actif: true },
        });

        if (enseignants.length === 0) {
            throw new Error("Aucun enseignant disponible");
        }

        // 6. Récupérer les disponibilités des enseignants
        const disponibilites = await Disponibilite.findAll({
            where: {
                id_user_enseignant: { [Op.in]: enseignants.map((e) => e.id_user) },
                date_debut: { [Op.lte]: dateFin },
                date_fin: { [Op.gte]: dateDebut },
            },
            include: [{ model: Creneau, as: "creneau" }],
        });

        const disponibilitesParEnseignant = {};
        enseignants.forEach((ens) => {
            disponibilitesParEnseignant[ens.id_user] = disponibilites.filter(
                (d) => d.id_user_enseignant === ens.id_user
            );
        });

        // 7. Récupérer les événements bloquants (si la table existe)
        let evenements = [];
        try {
            evenements = await Evenement.findAll({
                where: {
                    date_debut: { [Op.lte]: dateFin },
                    date_fin: { [Op.gte]: dateDebut },
                },
            });
        } catch (error) {
            // Si la table n'existe pas encore, continuer sans événements
            console.warn("Table Evenements non trouvée, continuation sans événements bloquants:", error.message);
            evenements = [];
        }

        // 8. Récupérer les affectations existantes
        const affectationsExistantes = await Affectation.findAll({
            where: {
                date_seance: { [Op.between]: [dateDebut, dateFin] },
                statut: { [Op.ne]: "annule" },
            },
            include: [
                { model: Creneau, as: "creneau" },
                { model: Cours, as: "cours" },
                { model: Groupe, as: "groupe" },
            ],
        });

        // 9. Si écraser, supprimer les affectations existantes pour ces cours/groupes
        if (ecraserAffectations) {
            const tousLesCours = Object.values(coursParGroupe).flat();
            const idsCours = coursIds.length > 0 ? coursIds : tousLesCours.map((c) => c.id_cours);
            const idsGroupes = groupeIds.length > 0 ? groupeIds : groupes.map((g) => g.id_groupe);
            
            await Affectation.destroy({
                where: {
                    id_cours: { [Op.in]: idsCours },
                    id_groupe: { [Op.in]: idsGroupes },
                    date_seance: { [Op.between]: [dateDebut, dateFin] },
                },
            });
        }

        // 10. Générer les slots disponibles dans l'ordre chronologique
        const slotsChronologiques = genererSlotsChronologiques(
            creneaux,
            dateDebut,
            dateFin,
            evenements
        );

        // 11. Pour chaque groupe, répartir les cours de manière équilibrée
        for (const groupe of groupes) {
            const coursDuGroupe = coursParGroupe[groupe.id_groupe] || [];
            
            if (coursDuGroupe.length === 0) {
                console.warn(`Aucun cours à planifier pour le groupe ${groupe.nom_groupe}`);
                continue;
            }

            const etatCours = coursDuGroupe.map((coursItem) => ({
                coursItem,
                heuresRestantes: Number(coursItem.volume_horaire) || 0,
                heuresPlanifiees: 0,
            }));
            const indexParCours = new Map(
                etatCours.map((etat, index) => [etat.coursItem.id_cours, index])
            );
            const heuresParJourGroupe = {};
            const heuresParJourCours = {};
            let dernierCoursPlanifie = null;
            let dernierSlotDate = null;
            let roundRobinIndex = 0;

            for (const slot of slotsChronologiques) {
                const tousPlanifies = etatCours.every((etat) => etat.heuresRestantes <= 0);
                if (tousPlanifies) break;

                if (
                    !estGroupeDisponible(
                        groupe.id_groupe,
                        slot.id_creneau,
                        slot.date,
                        affectationsExistantes
                    )
                ) {
                    continue;
                }

                const heuresJourGroupe = heuresParJourGroupe[slot.date] || 0;
                if (heuresJourGroupe + slot.dureeHeures > maxHoursPerDayGroup) {
                    continue;
                }

                if (slot.dureeHeures > maxSessionHours) {
                    continue;
                }

                // Alternance: partir de la prochaine position pour éviter de toujours reprendre le même cours
                const ordreCours = etatCours
                    .map((etat, index) => etatCours[(roundRobinIndex + index) % etatCours.length])
                    .filter((etat) => etat.heuresRestantes > 0);

                const candidats = ordreCours.filter((etat) => {
                    const coursId = etat.coursItem.id_cours;
                    const mapCours = heuresParJourCours[coursId] || {};
                    const heuresCoursCeJour = mapCours[slot.date] || 0;
                    const resteApresSlot = etat.heuresRestantes - slot.dureeHeures;
                    const autoriserDernierPetitReste = etat.heuresRestantes <= maxSessionHours;

                    if (
                        !allowSameCourseTwicePerDay &&
                        heuresCoursCeJour > 0 &&
                        ordreCours.length > 1
                    ) {
                        return false;
                    }

                    if (heuresCoursCeJour + slot.dureeHeures > maxHoursPerDayCourse) {
                        return false;
                    }

                    return resteApresSlot >= -0.01 || autoriserDernierPetitReste;
                });

                // Préférer le double créneau consécutif (même cours sur le même jour)
                // Sinon, alterner les cours pour une distribution équilibrée
                const memeJourQueAvant = dernierSlotDate === slot.date;
                candidats.sort((a, b) => {
                    const aIsLast = a.coursItem.id_cours === dernierCoursPlanifie;
                    const bIsLast = b.coursItem.id_cours === dernierCoursPlanifie;
                    if (memeJourQueAvant) {
                        // Même jour → favoriser le même cours (double slot consécutif)
                        if (aIsLast && !bIsLast) return -1;
                        if (!aIsLast && bIsLast) return 1;
                    } else {
                        // Jour différent → alterner pour équilibrer
                        if (aIsLast && !bIsLast) return 1;
                        if (!aIsLast && bIsLast) return -1;
                    }
                    return b.heuresRestantes - a.heuresRestantes;
                });

                let slotPlanifie = false;

                for (const candidat of candidats) {
                    const coursItem = candidat.coursItem;
                    const enseignant = trouverEnseignantDisponible(
                        coursItem.id_cours,
                        slot.id_creneau,
                        slot.date,
                        enseignants,
                        disponibilitesParEnseignant,
                        affectationsExistantes
                    );

                    if (!enseignant) {
                        continue;
                    }

                    const salle = trouverSalleDisponible(
                        groupe.effectif,
                        slot.id_creneau,
                        slot.date,
                        salles,
                        affectationsExistantes,
                        coursItem.type_cours
                    );

                    if (!salle) {
                        continue;
                    }

                    try {
                        const nouvelleAffectation = await Affectation.create({
                            date_seance: slot.date,
                            statut: "planifie",
                            id_cours: coursItem.id_cours,
                            id_groupe: groupe.id_groupe,
                            id_user_enseignant: enseignant.id_user,
                            id_salle: salle.id_salle,
                            id_creneau: slot.id_creneau,
                            id_user_admin: idUserAdmin,
                        });

                        affectationsExistantes.push({
                            id_user_enseignant: enseignant.id_user,
                            id_salle: salle.id_salle,
                            id_groupe: groupe.id_groupe,
                            id_creneau: slot.id_creneau,
                            date_seance: slot.date,
                            statut: "planifie",
                            id_cours: coursItem.id_cours,
                        });

                        const indexCours = indexParCours.get(coursItem.id_cours);
                        if (indexCours !== undefined) {
                            etatCours[indexCours].heuresRestantes = Math.max(
                                0,
                                etatCours[indexCours].heuresRestantes - slot.dureeHeures
                            );
                            etatCours[indexCours].heuresPlanifiees += slot.dureeHeures;
                        }

                        heuresParJourGroupe[slot.date] = (heuresParJourGroupe[slot.date] || 0) + slot.dureeHeures;
                        if (!heuresParJourCours[coursItem.id_cours]) {
                            heuresParJourCours[coursItem.id_cours] = {};
                        }
                        heuresParJourCours[coursItem.id_cours][slot.date] =
                            (heuresParJourCours[coursItem.id_cours][slot.date] || 0) +
                            slot.dureeHeures;

                        resultat.affectationsCreees.push({
                            id: nouvelleAffectation.id_affectation,
                            cours: coursItem.nom_cours,
                            groupe: groupe.nom_groupe,
                            enseignant: `${enseignant.prenom} ${enseignant.nom}`,
                            salle: salle.nom_salle,
                            date: slot.date,
                            creneau: `${slot.heure_debut}-${slot.heure_fin}`,
                        });

                        resultat.statistiques.totalSeancesPlanifiees++;
                        dernierCoursPlanifie = coursItem.id_cours;
                        dernierSlotDate = slot.date;
                        roundRobinIndex =
                            ((indexParCours.get(coursItem.id_cours) || 0) + 1) % etatCours.length;
                        slotPlanifie = true;
                        break;
                    } catch (error) {
                        console.error("Erreur lors de la création de l'affectation:", error);
                        resultat.affectationsEchouees.push({
                            cours: coursItem.nom_cours,
                            groupe: groupe.nom_groupe,
                            date: slot.date,
                            creneau: `${slot.heure_debut}-${slot.heure_fin}`,
                            raison: error.message,
                        });
                        resultat.statistiques.totalSeancesEchouees++;
                    }
                }

                if (!slotPlanifie && candidats.length > 0) {
                    const premierCandidat = candidats[0].coursItem;
                    resultat.affectationsEchouees.push({
                        cours: premierCandidat.nom_cours,
                        groupe: groupe.nom_groupe,
                        date: slot.date,
                        creneau: `${slot.heure_debut}-${slot.heure_fin}`,
                        raison: "Aucun enseignant ou aucune salle disponible pour ce slot",
                    });
                    resultat.statistiques.totalSeancesEchouees++;
                }
            }

            for (const etat of etatCours) {
                if (etat.heuresRestantes > 0) {
                    const seancesTheoriques = calculerNombreSeances(
                        etat.coursItem.volume_horaire,
                        maxSessionHours
                    );
                    resultat.affectationsEchouees.push({
                        cours: etat.coursItem.nom_cours,
                        groupe: groupe.nom_groupe,
                        date: "N/A",
                        creneau: "N/A",
                        raison: `Volume partiellement planifié: ${etat.heuresPlanifiees.toFixed(
                            1
                        )}h/${etat.coursItem.volume_horaire}h (≈ ${seancesTheoriques} séances attendues)`,
                    });
                }
            }
        }

        return resultat;
    } catch (error) {
        console.error("Erreur lors de la génération automatique:", error);
        throw error;
    }
};
