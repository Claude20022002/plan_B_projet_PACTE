/**
 * Source de l'état de ClassQuiz (shared/classQuiz.js, lot ME-0c, règles C-1, C-2 et C-6), commune
 * au site et à l'application. Lancé par `npm run test:unit`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ETEINT, creerSourceClassQuiz, etatClassQuiz, ressembleAPartie } from '../../../shared/classQuiz.js';

const ALLUME = { actif: true, url: 'https://quiz.exemple.ma', peutLancer: true };

test('allumé : la réponse du serveur', async () => {
  assert.deepEqual(await creerSourceClassQuiz(async () => ALLUME).lire(), ALLUME);
});

test('éteint : la réponse de #141', async () => {
  assert.deepEqual(await creerSourceClassQuiz(async () => ({ actif: false, url: null, peutLancer: false })).lire(), ETEINT);
});

test('actif sans adresse http(s), ou réponse vide : éteint', () => {
  assert.deepEqual(etatClassQuiz({ actif: true, url: null }), ETEINT);
  assert.deepEqual(etatClassQuiz({ actif: true, url: 'javascript:alert(1)' }), ETEINT);
  assert.deepEqual(etatClassQuiz({ actif: 'true', url: ALLUME.url }), ETEINT);
  assert.deepEqual(etatClassQuiz(undefined), ETEINT);
});

test('erreur réseau : éteint, et la lecture suivante réessaie', async () => {
  let appels = 0;
  const source = creerSourceClassQuiz(async () => {
    appels += 1;
    if (appels === 1) throw new Error('Failed to fetch');
    return ALLUME;
  });
  assert.deepEqual(await source.lire(), ETEINT);
  assert.deepEqual(await source.lire(), ALLUME);
  assert.equal(appels, 2);
});

test('pas de réponse dans le délai : éteint', async () => {
  const source = creerSourceClassQuiz(() => new Promise(() => {}), { delaiMs: 20 });
  assert.deepEqual(await source.lire(), ETEINT);
});

test('une seule requête pour plusieurs lectures, même simultanées', async () => {
  let appels = 0;
  const source = creerSourceClassQuiz(async () => {
    appels += 1;
    return ALLUME;
  });
  await Promise.all([source.lire(), source.lire()]);
  await source.lire();
  assert.equal(appels, 1);
  source.oublier();
  await source.lire();
  assert.equal(appels, 2);
});

test('QR d’une partie reconnu sans connaître l’adresse du service (C-6)', () => {
  assert.equal(ressembleAPartie('https://quiz.exemple.ma/play?pin=123456'), true);
  assert.equal(ressembleAPartie('https://quiz.exemple.ma/play?name=Ali&pin=123456#x'), true);
  assert.equal(ressembleAPartie('https://planner.exemple.ma/quiz/code/AB12CD'), false);
  assert.equal(ressembleAPartie('12.1700000000.abcdef'), false);
  assert.equal(ressembleAPartie('https://quiz.exemple.ma/play?pin=12'), false);
});
