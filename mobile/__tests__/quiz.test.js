jest.mock('socket.io-client', () => ({ io: jest.fn() }));
jest.mock('expo-screen-capture', () => ({ addScreenshotListener: jest.fn(() => ({ remove: jest.fn() })) }));

import { dureeSortie, lireLienPartie, monBilan, monResultat, ordreAffichage, reponseCases, texteSimple } from '../src/quiz/partie';

/** Partie ClassQuiz jouée nativement : logique pure du joueur (src/quiz/partie.js). */
const ORIGINE = 'https://quiz.finadmintech.fr';

test('lien de Planner : code, pseudo et jeton lus, seulement sur l’origine de ClassQuiz', () => {
  expect(lireLienPartie(`${ORIGINE}/play?pin=482913&name=Mintsa+O.&hid=12.abcDEF_-`, ORIGINE)).toEqual({ pin: '482913', nom: 'Mintsa O.', hid: '12.abcDEF_-' });
  expect(lireLienPartie(`${ORIGINE}/play?pin=482913`, ORIGINE)).toEqual({ pin: '482913', nom: 'Joueur', hid: null });
  // Autre site, sous-domaine piège, code invalide : refusés
  expect(lireLienPartie('https://pirate.test/play?pin=482913', ORIGINE)).toBeNull();
  expect(lireLienPartie(`${ORIGINE}.pirate.test/play?pin=482913`, ORIGINE)).toBeNull();
  expect(lireLienPartie(`${ORIGINE}/play?pin=48a913`, ORIGINE)).toBeNull();
  expect(lireLienPartie(undefined, ORIGINE)).toBeNull();
});

test('texte des questions sans HTML', () => {
  expect(texteSimple('<p>Que vaut <b>2 &amp; 2</b> ?</p>')).toBe('Que vaut 2 & 2 ?');
  expect(texteSimple('Ligne 1<br/>Ligne 2')).toBe('Ligne 1\nLigne 2');
  expect(texteSimple(null)).toBe('');
});

test('ordre des réponses : mélangé en mode normal, inchangé en mode kahoot', () => {
  expect(ordreAffichage(4, 'kahoot')).toEqual([0, 1, 2, 3]);
  const vus = new Set();
  for (let k = 0; k < 300; k += 1) {
    const ordre = ordreAffichage(4, 'normal');
    expect([...ordre].sort()).toEqual([0, 1, 2, 3]);
    vus.add(ordre.join(''));
  }
  expect(vus.size).toBeGreaterThan(12);
  // Hasard injecté : résultat déterministe
  expect(ordreAffichage(3, 'normal', () => 0)).toEqual([1, 2, 0]);
});

test('cases à cocher : positions d’origine croissantes, sans doublon', () => {
  expect(reponseCases([3, 0, 3, 1])).toBe('013');
  expect(reponseCases([])).toBe('');
});

test('mon résultat et mon bilan dans les résultats de la partie', () => {
  const q0 = [{ username: 'Sara B.', right: true, score: 812.4 }, { username: 'Yanis A.', right: false, score: 0 }];
  const q1 = [{ username: 'Sara B.', right: false, score: 0 }];
  expect(monResultat(q0, 'Sara B.')).toEqual({ juste: true, points: 812 });
  expect(monResultat(q0, 'Inconnu')).toBeNull();
  expect(monResultat(undefined, 'Sara B.')).toBeNull();
  expect(monBilan({ 0: q0, 1: q1 }, 'Sara B.')).toEqual({ points: 812, bonnes: 1 });
  expect(monBilan({ 0: q0 }, 'Yanis A.')).toEqual({ points: 0, bonnes: 0 });
  expect(monBilan(null, 'Sara B.')).toEqual({ points: 0, bonnes: 0 });
});

test('sorties : signalées à partir d’une seconde', () => {
  expect(dureeSortie(1000, 6000)).toBe(5000);
  expect(dureeSortie(1000, 1500)).toBeNull();
  expect(dureeSortie(null, 6000)).toBeNull();
});
