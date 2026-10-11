/**
 * Calculs de l'écran du quiz projeté (animationQuiz.js). Lancés par `npm run test:unit`
 * (lanceur de tests de Node, sans navigateur ni serveur).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adresseRejoindre, classement, decompte, secondesRestantes, texteSimple } from './animationQuiz.js';

test('adresse du QR : celle que le scan de l’application reconnaît', () => {
  assert.equal(adresseRejoindre('https://quiz.exemple.test/', '482913'), 'https://quiz.exemple.test/play?pin=482913');
  assert.equal(adresseRejoindre(null, '482913'), null);
  assert.equal(adresseRejoindre('https://quiz.exemple.test', ''), null);
});

test('QCM : réponses comptées par texte, bonne réponse signalée', () => {
  const question = { type: 'ABCD', answers: [{ answer: '<b>ls</b>', right: true }, { answer: 'cd', right: false }, { answer: 'pwd', right: false }] };
  const reponses = [{ answer: '<b>ls</b>' }, { answer: '<b>ls</b>' }, { answer: 'pwd' }, { answer: 'inconnue' }];
  assert.deepEqual(decompte(question, reponses), {
    parChoix: [
      { texte: 'ls', nombre: 2, juste: true },
      { texte: 'cd', nombre: 0, juste: false },
      { texte: 'pwd', nombre: 1, juste: false },
    ],
    total: 4,
  });
});

test('cases à cocher : chaque case cochée compte une fois par joueur', () => {
  const question = { type: 'CHECK', answers: [{ answer: 'A', right: true }, { answer: 'B', right: false }, { answer: 'C', right: true }] };
  const { parChoix } = decompte(question, [{ answer: '02' }, { answer: '0' }, { answer: '00' }]);
  assert.deepEqual(parChoix.map((c) => c.nombre), [3, 0, 1]);
});

test('type sans choix : seulement le nombre de réponses', () => {
  assert.deepEqual(decompte({ type: 'TEXT', answers: [{ answer: 'Linux' }] }, [{ answer: 'linux' }]), { parChoix: null, total: 1 });
  assert.deepEqual(decompte(null, null), { parChoix: null, total: 0 });
});

test('classement : points cumulés, joueurs sans réponse à zéro, égalités par nom', () => {
  const resultats = { 0: [{ username: 'Sara', score: 900 }, { username: 'Ali', score: 500 }], 1: [{ username: 'Ali', score: 400 }] };
  assert.deepEqual(classement(resultats, ['Ali', 'Sara', 'Yanis', 'Zoé']), [
    { nom: 'Ali', points: 900 },
    { nom: 'Sara', points: 900 },
    { nom: 'Yanis', points: 0 },
    { nom: 'Zoé', points: 0 },
  ]);
});

test('compte à rebours arrondi à la seconde supérieure, jamais négatif', () => {
  assert.equal(secondesRestantes(0, 20, 0), 20);
  assert.equal(secondesRestantes(0, 20, 19_100), 1);
  assert.equal(secondesRestantes(0, 20, 25_000), 0);
  assert.equal(secondesRestantes(0, undefined, 0), 0);
});

test('texte sans HTML', () => {
  assert.equal(texteSimple('<p>Que fait <code>ls</code>&nbsp;?</p>'), 'Que fait ls ?');
});
