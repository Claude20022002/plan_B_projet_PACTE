/** Textes du panneau « Identité et marque » (français), fusionnés sous la clé « etablissement » par i18n/index.js. */
const etablissement = {
  intro: "Le nom, le logo et les couleurs de l'école apparaissent sur toutes les pages, dans les courriels, les PDF et l'application. Après un enregistrement, la page se recharge pour les appliquer ; les autres utilisateurs les voient à leur prochaine visite.",
  sections: { identite: 'Identité', couleurs: 'Couleurs', logo: 'Logo', courriels: 'Courriels' },
  champs: {
    nom: "Nom complet de l'école",
    nomAide: 'Pied des pages, PDF, page de connexion, nom de l’expéditeur des courriels.',
    nomCourt: 'Nom court',
    nomCourtAide: 'Panneau de l’accueil, titre de l’onglet, objet des courriels. Le produit s’appelle alors « {{exemple}} ».',
    principale: 'Couleur principale',
    principaleAide: 'Menu, boutons, cadre du panneau. Le texte blanc doit s’y lire : contraste d’au moins 4,5:1.',
    accent: "Couleur d'accent",
    accentAide: 'Mot « PLANNER », boutons d’appel, filets. Contraste d’au moins 3:1 sur blanc.',
    expediteur: 'Nom de l’expéditeur des courriels',
    expediteurAide: 'Laissé vide : « {{produit}} ».',
    reponse: 'Adresse de réponse',
    reponseAide: 'Les réponses aux courriels de Planner arrivent ici (par exemple la scolarité). Laissée vide : pas de réponse possible.',
  },
  contraste: 'Contraste {{valeur}}:1 (au moins {{seuil}}:1)',
  apercu: 'Aperçu',
  apercuBouton: 'Bouton',
  logo: {
    actuel: 'Logo actuel',
    aucun: 'Pas de logo : le nom court est affiché à sa place.',
    choisir: 'Choisir une image',
    retirer: 'Retirer le logo',
    regles: 'PNG, JPEG ou WebP, 512 Ko au plus, de préférence sur fond transparent ou blanc. Le SVG est refusé (il peut contenir du script).',
    tropLourd: 'Image trop lourde : 512 Ko au plus.',
    format: 'Format refusé : PNG, JPEG ou WebP seulement.',
    confirmerRetrait: 'Retirer le logo ? Le nom court de l’école sera affiché à sa place.',
  },
  enregistrer: 'Enregistrer',
  enregistre: 'Enregistré : la page se recharge.',
  corriger: 'Corrigez les champs signalés avant d’enregistrer.',
};

export default etablissement;
