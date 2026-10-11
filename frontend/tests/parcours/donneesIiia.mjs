/**
 * Scénario IIIA (lot B-8) : deux promotions de la même filière générées ensemble par le vrai solveur.
 *  - 3A IIIA : les modules de l'emploi du temps 3A IIIA (S6) de l'an dernier, comme si cette classe
 *    existait cette année (docs/exemple_emploi_du_temp - 3A IIIA …pdf) ; à Stendhal ;
 *  - 4A IIIA : les modules de l'emploi du temps 4A IIIA (S7) d'octobre 2026 (docs/Planning/…pdf) ;
 *    à Gandhi.
 * Rythme hebdomadaire et salles repris des PDF ; une séance occupe une demi-journée (deux créneaux).
 * Les enseignants portent des noms fictifs, mais le partage est gardé : la même enseignante encadre
 * le projet des 3A et enseigne deux modules aux 4A (projet PACTE, NoSQL, projet PIC). Pas de
 * co-enseignant : chaque enseignement a un seul enseignant.
 *
 * Deux profils d'étudiant pour regarder le résultat : un 3A (groupe 1) et un 4A.
 */
import { pathToFileURL } from "node:url";
import path from "node:path";

// Semestre S1 2026-2027 à partir du lundi 19 octobre : dix semaines de cours
const PERIODE = { code: "S1", date_debut: "2026-10-19", date_fin: "2027-01-23", nb_semaines: 14 };
const SEMAINES = 10;
const HEURES_DEMI_JOURNEE = 3.5;

const ENSEIGNANTS = {
  kettani: ["Omar", "Kettani"],
  mouline: ["Hicham", "Mouline"],
  tahiri: ["Samira", "Tahiri"],
  lazrak: ["Hind", "Lazrak"],
  chafik: ["Rim", "Chafik"],
  kabbaj: ["Adil", "Kabbaj"],
  ouazzani: ["Salma", "Ouazzani"],
  benjelloun: ["Mehdi", "Benjelloun"],
  amrani: ["Younes", "Amrani"],
  saidi: ["Karim", "Saidi"],
  ghazali: ["Tarik", "Ghazali"],
};

// [code, module, enseignant, séances par semaine, options] ; td : une séance par groupe de TD
const MODULES_3A = [
  ["3A-AN", "Analyse numérique", "kettani", 1, { labo: true }],
  ["3A-BE", "Business English", "mouline", 1, { td: true }],
  ["3A-RO", "Recherche opérationnelle", "tahiri", 1],
  ["3A-GRA", "Algorithmes efficaces de graphes avec Python", "lazrak", 1, { labo: true }],
  ["3A-FIN", "La finance pour l'ingénieur", "chafik", 1],
  ["3A-RES", "Réseaux informatiques", "kabbaj", 1],
  ["3A-RESB", "Réseaux informatiques (Blended Coursera)", "kabbaj", 1, { distanciel: true }],
  ["3A-PACTE", "Projet PACTE : séance d'encadrement", "ouazzani", 1],
];
const MODULES_4A = [
  ["4A-TLC", "Théorie des langages et compilation", "benjelloun", 2],
  ["4A-ESP", "English for Specific Purposes", "amrani", 1],
  ["4A-NOSQL", "Bases de données NoSQL", "ouazzani", 1],
  ["4A-FDS", "Fondamentaux de la Data Science", "saidi", 1],
  ["4A-IBM", "IBM Data Science (Blended Coursera)", "saidi", 1, { distanciel: true }],
  ["4A-NIS2", "Introduction à la cybersécurité et la directive NIS2", "ghazali", 2],
  ["4A-SSI", "Fondamentaux de la sécurité des systèmes d'information", "ghazali", 1],
  ["4A-PIC", "Projet PIC : séance d'initiation", "ouazzani", 1, { court: true }],
];

/** Crée les deux promotions IIIA et leurs enseignements ; rend ce que le parcours vérifie. */
export const preparerIiia = async (racine) => {
  const serveur = (chemin) => import(pathToFileURL(path.join(racine, "backend", chemin)).href);
  const { createUser } = await serveur("tests/integration/helpers/testApp.js");
  const m = await serveur("models/index.js");

  const profs = {};
  for (const [cle, [prenom, nom]] of Object.entries(ENSEIGNANTS)) {
    profs[cle] = await createUser("enseignant", { prenom, nom, email: `${cle}.iiia@exemple.hestim.test` });
  }

  const gandhi = await m.Campus.findOne({ where: { code: "G" } });
  const stendhal = await m.Campus.findOne({ where: { code: "ST" } });
  await m.Salle.bulkCreate([
    { nom_salle: "ST-Amphi C", type_salle: "Salle de cours", capacite: 80, id_campus: stendhal.id_campus },
    { nom_salle: "ST-Amphi G", type_salle: "Salle de cours", capacite: 60, id_campus: stendhal.id_campus },
    { nom_salle: "ST-Salle Info", type_salle: "Labo informatique", capacite: 40, id_campus: stendhal.id_campus },
    { nom_salle: "G-Salle Polyvalente", type_salle: "Salle de cours", capacite: 50, id_campus: gandhi.id_campus },
    { nom_salle: "G-Salle 03", type_salle: "Salle de cours", capacite: 30, id_campus: gandhi.id_campus },
  ]);

  const filiere = await m.Filiere.create({ code_filiere: "IIIA", nom_filiere: "Ingénierie Informatique et Intelligence Artificielle" });
  const groupe = (nom_groupe, annee, effectif, type_groupe, parent = null) =>
    m.Groupe.create({ nom_groupe, niveau: `${annee}ème année`, annee, effectif, annee_scolaire: "2026-2027", type_groupe, id_groupe_parent: parent, id_filiere: filiere.id_filiere });
  const promo3 = await groupe("IIIA-3A", 3, 40, "promotion");
  const g1 = await groupe("IIIA-3A-G1", 3, 20, "td", promo3.id_groupe);
  const g2 = await groupe("IIIA-3A-G2", 3, 20, "td", promo3.id_groupe);
  const promo4 = await groupe("IIIA-4A", 4, 30, "promotion");

  const etudiant = async (email, prenom, nom, id_groupe) => {
    const u = await createUser("etudiant", { prenom, nom, email });
    await m.Appartenir.create({ id_user_etudiant: u.id_user, id_groupe });
    return u;
  };
  const etu3a = await etudiant("etu3a.iiia@exemple.hestim.test", "Ilyas", "Moujahid", g1.id_groupe);
  await etudiant("etu3a2.iiia@exemple.hestim.test", "Ghita", "Rami", g2.id_groupe);
  const etu4a = await etudiant("etu4a.iiia@exemple.hestim.test", "Nour", "Hamdani", promo4.id_groupe);

  const annee = await m.AnneeUniversitaire.findOne({ where: { libelle: "2026-2027" } });
  const periode = await m.Periode.create({ id_annee: annee.id_annee, ...PERIODE });

  const creerModules = async (modules, annee_, promo, tds, semestre) => {
    for (const [code, nom, prof, parSemaine, options = {}] of modules) {
      const longueur = options.court ? 1 : 2;
      const heures = parSemaine * SEMAINES * (options.court ? HEURES_DEMI_JOURNEE / 2 : HEURES_DEMI_JOURNEE);
      const cours = await m.Cours.create({ code_cours: code, nom_cours: nom, niveau: `${annee_}ème année`, volume_horaire: heures, type_cours: options.td ? "TD" : "CM", semestre, id_filiere: filiere.id_filiere });
      const composante = await m.CoursComposante.create({
        id_cours: cours.id_cours,
        type: options.td ? "TD" : "CM",
        volume_heures: heures,
        niveau_groupe: options.td ? "td" : "promotion",
        creneaux_par_seance: longueur,
        seances_par_semaine: parSemaine,
        type_salle_requis: options.labo ? "Labo informatique" : null,
        modalite: options.distanciel ? "distanciel" : "presentiel",
      });
      for (const g of options.td ? tds : [promo]) {
        const ens = await m.Enseignement.create({ id_composante: composante.id_composante, id_periode: periode.id_periode, heures_prevues: heures });
        await ens.setGroupes([g.id_groupe]);
        await m.EnseignementEnseignant.create({ id_enseignement: ens.id_enseignement, id_user: profs[prof].id_user, role: "principal", statut_service: "accepte" });
      }
    }
  };
  await creerModules(MODULES_3A, 3, promo3, [g1, g2], "S5");
  await creerModules(MODULES_4A, 4, promo4, [], "S7");

  return {
    periode: { id: periode.id_periode, libelle: "2026-2027 · S1", debut: PERIODE.date_debut, fin: PERIODE.date_fin },
    filiere: filiere.id_filiere,
    groupes: { promo3: promo3.id_groupe, g1: g1.id_groupe, g2: g2.id_groupe, promo4: promo4.id_groupe },
    etudiants: { troisieme: { email: etu3a.email, prenom: etu3a.prenom, nom: etu3a.nom }, quatrieme: { email: etu4a.email, prenom: etu4a.prenom, nom: etu4a.nom } },
    enseignantePartagee: { id: profs.ouazzani.id_user, email: profs.ouazzani.email },
    modules: { troisieme: MODULES_3A.map((x) => x[0]), quatrieme: MODULES_4A.map((x) => x[0]) },
  };
};
