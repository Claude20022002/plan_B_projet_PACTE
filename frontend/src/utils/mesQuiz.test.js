/**
 * Conversions de l'éditeur « Mes quiz » (mesQuiz.js). Lancés par `npm run test:unit`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TEMPS_PAR_DEFAUT, questionVide, versBrouillon, versServiceQuiz } from './mesQuiz.js';
import { erreurDuBrouillon } from './brouillonQuiz.js';

const duService = { question: 'Port de BGP ?', time: 20, type: 'ABCD', answers: [{ answer: '179', right: true }, { answer: '80', right: false }] };

test('aller-retour : une question relue sans changement repart à l’identique', () => {
  assert.deepEqual(versServiceQuiz(versBrouillon(duService)), duService);
  assert.deepEqual(versBrouillon(duService), { question: 'Port de BGP ?', type: 'ABCD', temps: 20, reponses: [{ texte: '179', juste: true }, { texte: '80', juste: false }] });
});

test('choix multiple gardé ; durée absente ou illisible : celle par défaut', () => {
  const multiple = versBrouillon({ question: 'Protocoles de routage ?', type: 'CHECK', answers: [{ answer: 'BGP', right: true }, { answer: 'OSPF', right: true }, { answer: 'HTTP', right: false }] });
  assert.equal(multiple.type, 'CHECK');
  assert.equal(multiple.temps, TEMPS_PAR_DEFAUT);
  assert.equal(versBrouillon({ ...duService, time: 'n/a' }).temps, TEMPS_PAR_DEFAUT);
});

test('les espaces autour des textes ne partent pas au service de quiz', () => {
  const q = versServiceQuiz({ question: '  Port de BGP ?  ', type: 'ABCD', temps: 20, reponses: [{ texte: ' 179 ', juste: true }, { texte: '80', juste: false }] });
  assert.equal(q.question, 'Port de BGP ?');
  assert.deepEqual(q.answers.map((r) => r.answer), ['179', '80']);
});

test('une question ajoutée est à compléter : le contrôle du brouillon le dit', () => {
  assert.deepEqual(erreurDuBrouillon([questionVide()]), { cle: 'jeux.quizIa.erreurs.enonce', numero: 1 });
});
