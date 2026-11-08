/** Textes des sessions de jeu lancées en classe (français), sous la clé « sessionsJeu » (i18n/index.js). */
const sessionsJeu = {
  modes: {
    individuel: {
      nom: 'Chacun sur son téléphone',
      description: 'Les étudiants scannent le QR code et jouent chacun de leur côté ; vous suivez leurs défis réussis.',
      aide: 'Scannez le QR code avec votre téléphone, ou saisissez le code dans « Activités ».',
    },
    collectif: {
      nom: 'Ensemble, au tableau',
      description: 'Le jeu est projeté ; les étudiants envoient leurs réponses depuis leur téléphone et vous choisissez celle qui est jouée.',
      aide: 'Scannez le QR code pour envoyer vos réponses au tableau.',
    },
  },
  lancer: {
    bouton: 'Lancer en classe',
    titre: 'Lancer « {{jeu}} » en classe',
    module: 'Module',
    moduleAide: 'Seuls les étudiants de ce module pourront rejoindre le jeu.',
    mode: 'Comment jouer',
    action: 'Lancer et afficher le QR code',
  },
  code: 'Code du jeu',
  enCours: 'Jeux en cours avec vos classes',
  reprendre: 'Reprendre',
  participants_one: '{{count}} étudiant a rejoint le jeu',
  participants_other: '{{count}} étudiants ont rejoint le jeu',
  terminer: 'Terminer le jeu',
  terminerTitre: 'Terminer le jeu ?',
  terminerTexte: 'Les étudiants ne pourront plus le rejoindre ni envoyer de réponse. Leur progression reste enregistrée.',
  termineeOk: 'Jeu terminé',
  terminee: 'Jeu terminé',
  individuel: {
    titre: 'Étudiants',
    personne: 'Personne n’a encore rejoint : projetez le QR code.',
    defis_one: '{{count}} défi',
    defis_other: '{{count}} défis',
  },
  collectif: {
    defi: 'Défi projeté',
    terminal: 'Terminal de la classe',
    saisieProf: 'Taper une commande au tableau',
    propositions: 'Réponses des étudiants',
    attente: 'Les réponses envoyées par les étudiants arrivent ici.',
    jouer: 'Jouer',
    ecarter: 'Écarter la réponse {{texte}}',
    recommencer: 'Recommencer le défi',
    reussi: 'Objectif atteint : bravo à la classe !',
    suivant: 'Défi suivant',
  },
  rejoindre: {
    titre: 'Rejoindre un jeu',
    code: 'Code affiché par l’enseignant',
    action: 'Rejoindre',
    aide: 'Scannez le QR code projeté, ou saisissez ici son code à 6 caractères.',
    enCours: 'On vous fait entrer dans le jeu…',
  },
  direct: {
    votreReponse: 'Votre réponse (une commande)',
    envoyer: 'Envoyer',
    envoyee: 'Réponse envoyée à l’enseignant',
    statuts: {
      attente: 'Votre réponse attend le choix de l’enseignant :',
      choisie: 'Votre réponse a été jouée au tableau :',
      ecartee: 'Votre réponse n’a pas été retenue :',
    },
  },
};

export default sessionsJeu;
