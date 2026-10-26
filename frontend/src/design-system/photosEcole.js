/**
 * Photos de l'école sur l'accueil et la page de connexion (public/img/<dossier>/). Seule l'école
 * pilote en a aujourd'hui ; une autre école voit les mêmes pages sans photo, jamais celles d'une
 * autre école. Le téléversement des photos rejoindra le panneau de configuration (D-21).
 * Rangées par nom court de l'école (ConfigurationEtablissement.nom_court).
 */
const PHOTOS = {
  HESTIM: {
    salle: '/img/hestim/seance-salle.jpg',
    incubateur: '/img/hestim/incubateur-ciel.jpg',
    campus: '/img/hestim/campus-batiment.jpg',
  },
};

/** Photos de l'école, ou null. */
export const photosEcole = (nomCourt) => PHOTOS[nomCourt] ?? null;
