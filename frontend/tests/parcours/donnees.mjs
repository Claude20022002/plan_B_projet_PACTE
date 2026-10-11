/**
 * Données des parcours de démonstration (lot B-8) : une base de test jetable, remplie avec les
 * outils des tests d'intégration du serveur (backend/tests/integration/helpers/testApp.js).
 *
 * Contenu : un administrateur, une enseignante, une classe de 8 étudiants et une séance
 * aujourd'hui, en cours toute la journée (l'appel ne s'ouvre que le jour de la séance, et
 * « Mes classes » met en avant la classe en cours). Les comptes et leur mot de passe sont créés ici :
 * aucun identifiant n'est écrit dans les tests. Les données de la génération sont dans
 * donneesGeneration.mjs.
 */
import { pathToFileURL } from "node:url";
import path from "node:path";
import { creerGrille } from "./grille.mjs";
import { preparerGeneration } from "./donneesGeneration.mjs";
import { preparerIiia } from "./donneesIiia.mjs";

// Le Maroc est à UTC+0 toute l'année ; la séance doit tomber « aujourd'hui » pour le serveur
const FUSEAU = "Africa/Casablanca";
const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const ETUDIANTS = [["Salma", "Bennani"], ["Yassine", "Alami"], ["Imane", "Tazi"], ["Omar", "Idrissi"], ["Kenza", "Berrada"], ["Mehdi", "Chraibi"], ["Sara", "El Fassi"], ["Anas", "Lahlou"]];

/** Vide la base de test, la remplit et rend les comptes et la séance créés. */
export const preparerDonnees = async (racine) => {
  const serveur = (chemin) => import(pathToFileURL(path.join(racine, "backend", chemin)).href);
  const { resetDatabase, createUser, createPlanningFixture, PASSWORD } = await serveur("tests/integration/helpers/testApp.js");
  const { Affectation, AnneeUniversitaire, Appartenir, CoursComposante, Creneau, Enseignement, EnseignementEnseignant, Periode } = await serveur("models/index.js");

  await resetDatabase();
  const admin = await createUser("admin", { prenom: "Admin", nom: "Parcours", email: "admin.parcours@exemple.hestim.test" });
  const enseignante = await createUser("enseignant", { prenom: "Nadia", nom: "Sefrioui", email: "prof.parcours@exemple.hestim.test" });
  const etudiants = [];
  for (const [i, [prenom, nom]] of ETUDIANTS.entries()) {
    etudiants.push(await createUser("etudiant", { prenom, nom, email: `etu${i + 1}.parcours@exemple.hestim.test` }));
  }
  const fixture = await createPlanningFixture({ admin, enseignant: enseignante, etudiant: etudiants[0] });
  for (const e of etudiants.slice(1)) await Appartenir.create({ id_user_etudiant: e.id_user, id_groupe: fixture.groupe.id_groupe });

  const maintenant = new Date();
  const aujourdhui = maintenant.toLocaleDateString("en-CA", { timeZone: FUSEAU });
  const jour = JOURS[new Date(`${aujourdhui}T12:00:00Z`).getUTCDay()];
  const creneau = await Creneau.create({ jour_semaine: jour, heure_debut: "00:05:00", heure_fin: "23:55:00", duree_minutes: 1430 });
  const seance = await Affectation.create({
    date_seance: aujourdhui,
    statut: "confirme",
    id_cours: fixture.cours.id_cours,
    id_groupe: fixture.groupe.id_groupe,
    id_user_enseignant: enseignante.id_user,
    id_salle: fixture.salle.id_salle,
    id_creneau: creneau.id_creneau,
    id_user_admin: admin.id_user,
  });

  const grille = await creerGrille(Creneau);
  const generation = await preparerGeneration(racine, admin, grille);
  // Après la génération GEN, qui crée l'année 2026-2027
  const iiia = await preparerIiia(racine);

  // La classe du jour est aussi un enseignement de l'enseignante, comme dans les vraies données :
  // « Créer un quiz » n'accepte qu'un groupe qui suit le module. Sur une autre année, inactive, pour
  // ne rien changer aux générations du S1 et du S2 (parcours iiia et generation)
  const annee = await AnneeUniversitaire.create({ libelle: "2025-2026", date_debut: "2025-09-01", date_fin: "2026-07-31", active: false });
  const s1 = await Periode.create({ id_annee: annee.id_annee, code: "S1", date_debut: "2025-09-15", date_fin: "2026-01-23", nb_semaines: 15 });
  const composante = await CoursComposante.create({ id_cours: fixture.cours.id_cours, type: "CM", volume_heures: 21, niveau_groupe: "promotion" });
  const enseignement = await Enseignement.create({ id_composante: composante.id_composante, id_periode: s1.id_periode, heures_prevues: 21 });
  await enseignement.setGroupes([fixture.groupe.id_groupe]);
  await EnseignementEnseignant.create({ id_enseignement: enseignement.id_enseignement, id_user: enseignante.id_user, role: "principal", statut_service: "accepte" });

  const compte = (u) => ({ email: u.email, prenom: u.prenom, nom: u.nom });
  return {
    motDePasse: PASSWORD,
    admin: compte(admin),
    enseignante: compte(enseignante),
    etudiants: etudiants.map(compte),
    seance: { id: seance.id_affectation, cours: fixture.cours.nom_cours, groupe: fixture.groupe.nom_groupe },
    generation,
    iiia,
  };
};
