/**
 * Données du parcours « génération puis publication » (lot B-8), calculées par le vrai solveur.
 * Repris du test d'intégration backend/tests/integration/generation.test.js, qui utilise un faux
 * solveur : ici, chaque règle est vérifiée sur ce que le service Timefold rend vraiment.
 *
 * Une filière à part (GEN), pour ne pas croiser les autres parcours : une promotion de 40 et son
 * TD de 20, une salle de cours et un labo ; la grille commune de l'école (grille.mjs).
 * Semestre S2 2027, du lundi 1er mars au 22 mai. Enseignements :
 *  - CM de Machine Learning pour la promotion, par un permanent ;
 *  - TP en labo pour le TD, par un vacataire qui n'a déclaré que le mardi matin ;
 *  - un module sans enseignant, qui doit être écarté et signalé.
 * Contraintes posées : lundi 15 mars férié ; une séance récurrente posée à la main le lundi à
 * 13 h 30 pour la promotion (elle doit rester, et le solveur la contourner).
 */
import { pathToFileURL } from "node:url";
import path from "node:path";

/** Crée la filière GEN et ce qu'il faut pour la générer ; rend ce que le parcours vérifie. */
export const preparerGeneration = async (racine, admin, grille) => {
  const serveur = (chemin) => import(pathToFileURL(path.join(racine, "backend", chemin)).href);
  const { createUser } = await serveur("tests/integration/helpers/testApp.js");
  const m = await serveur("models/index.js");

  const permanent = await createUser("enseignant", { prenom: "Karim", nom: "Alaoui", email: "prof.cm.parcours@exemple.hestim.test" });
  const vacataire = await createUser("enseignant", { prenom: "Youssef", nom: "Bennis", email: "prof.tp.parcours@exemple.hestim.test" });
  const autreProf = await createUser("enseignant", { prenom: "Leila", nom: "Fassi", email: "prof.autre.parcours@exemple.hestim.test" });
  await m.Enseignant.update({ statut: "vacataire" }, { where: { id_user: vacataire.id_user } });

  const gandhi = await m.Campus.findOne({ where: { code: "G" } });
  const filiere = await m.Filiere.create({ code_filiere: "GEN", nom_filiere: "Génération", id_campus_prefere: gandhi.id_campus });
  const promo = await m.Groupe.create({ nom_groupe: "4A GEN", niveau: "4ème année", annee: 4, effectif: 40, annee_scolaire: "2026-2027", type_groupe: "promotion", id_filiere: filiere.id_filiere });
  const td = await m.Groupe.create({ nom_groupe: "GEN-4A-TD1", niveau: "4ème année", annee: 4, effectif: 20, annee_scolaire: "2026-2027", type_groupe: "td", id_groupe_parent: promo.id_groupe, id_filiere: filiere.id_filiere });
  const salle = await m.Salle.create({ nom_salle: "G-GEN1", type_salle: "Salle de cours", capacite: 50, id_campus: gandhi.id_campus });
  const labo = await m.Salle.create({ nom_salle: "G-GENLAB", type_salle: "Labo informatique", capacite: 25, id_campus: gandhi.id_campus });

  const lundi = grille.lundi;
  // Le vacataire ne déclare que le mardi matin
  const mardi = grille.mardi.slice(0, 2);

  const annee = await m.AnneeUniversitaire.create({ libelle: "2026-2027", date_debut: "2026-09-01", date_fin: "2027-07-31", active: true });
  const periode = await m.Periode.create({ id_annee: annee.id_annee, code: "S2", date_debut: "2027-03-01", date_fin: "2027-05-22", nb_semaines: 12 });
  const ml = await m.Cours.create({ code_cours: "GEN-ML", nom_cours: "Machine Learning", niveau: "4ème année", volume_horaire: 33, type_cours: "CM", semestre: "S8", id_filiere: filiere.id_filiere });
  const cm = await m.CoursComposante.create({ id_cours: ml.id_cours, type: "CM", volume_heures: 21, niveau_groupe: "promotion", creneaux_par_seance: 2 });
  const tp = await m.CoursComposante.create({ id_cours: ml.id_cours, type: "TP", volume_heures: 12, niveau_groupe: "td", creneaux_par_seance: 2, type_salle_requis: "Labo informatique" });
  const orphelin = await m.Cours.create({ code_cours: "GEN-X", nom_cours: "Module sans enseignant", niveau: "4ème année", volume_horaire: 10, type_cours: "CM", semestre: "S8", id_filiere: filiere.id_filiere });
  const sansProf = await m.CoursComposante.create({ id_cours: orphelin.id_cours, type: "CM", volume_heures: 10, niveau_groupe: "promotion" });

  const enseignement = async (composante, heures, groupe) => {
    const e = await m.Enseignement.create({ id_composante: composante.id_composante, id_periode: periode.id_periode, heures_prevues: heures });
    await e.setGroupes([groupe.id_groupe]);
    return e;
  };
  const ensCm = await enseignement(cm, 21, promo);
  const ensTp = await enseignement(tp, 12, td);
  await enseignement(sansProf, 10, promo);
  await m.EnseignementEnseignant.bulkCreate([
    { id_enseignement: ensCm.id_enseignement, id_user: permanent.id_user, role: "principal", statut_service: "accepte" },
    { id_enseignement: ensTp.id_enseignement, id_user: vacataire.id_user, role: "principal", statut_service: "accepte" },
  ]);
  // Un vacataire n'est disponible que sur les créneaux qu'il déclare : ici le mardi matin
  await m.Disponibilite.bulkCreate(mardi.map((c) => ({ id_user_enseignant: vacataire.id_user, id_creneau: c.id_creneau, date_debut: "2027-03-01", date_fin: "2027-05-22", disponible: true })));
  await m.Evenement.create({ titre: "Férié du parcours", date_debut: "2027-03-15", date_fin: "2027-03-15", type_evenement: "ferie", portee: "etablissement", bloque_affectations: true, id_user_createur: admin.id_user });

  // Séance récurrente posée à la main (deux lundis à 13 h 30) : épinglée, le solveur la contourne
  const autre = await m.Cours.create({ code_cours: "GEN-AUT", nom_cours: "Projet tutoré", niveau: "4ème année", volume_horaire: 10, type_cours: "CM", semestre: "S8", id_filiere: filiere.id_filiere });
  const manuelle = (date_seance) => ({ date_seance, statut: "planifie", id_cours: autre.id_cours, id_groupe: promo.id_groupe, id_user_enseignant: autreProf.id_user, id_salle: salle.id_salle, id_creneau: lundi[2].id_creneau, id_user_admin: admin.id_user });
  await m.Affectation.bulkCreate([manuelle("2027-03-01"), manuelle("2027-03-08")]);

  return {
    periode: { id: periode.id_periode, libelle: "2026-2027 · S2", debut: "2027-03-01", fin: "2027-05-22" },
    groupes: { promo: promo.id_groupe, td: td.id_groupe },
    salles: { cours: salle.id_salle, labo: labo.id_salle },
    creneaux: { mardi: mardi.map((c) => c.id_creneau), lundiApresMidi: lundi[2].id_creneau },
    enseignants: { permanent: permanent.id_user, vacataire: vacataire.id_user },
    enseignements: { cm: ensCm.id_enseignement, tp: ensTp.id_enseignement },
    ferie: "2027-03-15",
  };
};
