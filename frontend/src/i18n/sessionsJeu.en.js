/** Texts of the class game sessions (English), under the "sessionsJeu" key (i18n/index.js). */
const sessionsJeu = {
  modes: {
    individuel: {
      nom: 'Everyone on their phone',
      description: 'Students scan the QR code and each play on their own; you follow the challenges they complete.',
      aide: 'Scan the QR code with your phone, or enter the code in “Activities”.',
    },
    collectif: {
      nom: 'Together, on the board',
      description: 'The game is projected; students send their answers from their phone and you pick the one that is played.',
      aide: 'Scan the QR code to send your answers to the board.',
    },
  },
  lancer: {
    bouton: 'Launch in class',
    titre: 'Launch “{{jeu}}” in class',
    module: 'Module',
    moduleAide: 'Only students of this module can join the session.',
    mode: 'How to play',
    action: 'Launch and show the QR code',
  },
  code: 'Session code',
  enCours: 'Game sessions in progress',
  reprendre: 'Resume',
  participants_one: '{{count}} student joined the session',
  participants_other: '{{count}} students joined the session',
  terminer: 'End the session',
  terminerTitre: 'End the session?',
  terminerTexte: 'Students will no longer be able to join or send answers. Their progress stays saved.',
  termineeOk: 'Session ended',
  terminee: 'Session ended',
  individuel: {
    titre: 'Students',
    personne: 'Nobody has joined yet: project the QR code.',
    defis_one: '{{count}} challenge',
    defis_other: '{{count}} challenges',
  },
  collectif: {
    defi: 'Projected challenge',
    terminal: 'Class terminal',
    saisieProf: 'Type a command on the board',
    propositions: 'Student answers',
    attente: 'Answers sent by students show up here.',
    jouer: 'Play',
    ecarter: 'Dismiss the answer {{texte}}',
    recommencer: 'Restart the challenge',
    reussi: 'Objective reached: well done, class!',
    suivant: 'Next challenge',
  },
  rejoindre: {
    titre: 'Join a game',
    code: 'Code shown by the teacher',
    action: 'Join',
    aide: 'Scan the projected QR code, or enter its 6-character code here.',
    enCours: 'Joining the session…',
  },
  direct: {
    votreReponse: 'Your answer (one command)',
    envoyer: 'Send',
    envoyee: 'Answer sent to the teacher',
    statuts: {
      attente: 'Your answer is waiting for the teacher’s choice:',
      choisie: 'Your answer was played on the board:',
      ecartee: 'Your answer was not picked:',
    },
  },
};

export default sessionsJeu;
