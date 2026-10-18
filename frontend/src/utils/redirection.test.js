/**
 * Retour après connexion (utils/redirection.js) : seulement vers les chemins prévus, jamais vers
 * un autre site. Lancé par `npm run test:unit`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cheminSuivantSur } from './redirection.js';

test('QR scannés avec l\'appareil photo : appel, quiz du Studio, session de jeu', () => {
  assert.equal(cheminSuivantSur('/presence?c=12.34.abc'), '/presence?c=12.34.abc');
  assert.equal(cheminSuivantSur('/quiz/code/ABC234'), '/quiz/code/ABC234');
  assert.equal(cheminSuivantSur('/jeux/session/ABC234'), '/jeux/session/ABC234');
});

test('autres chemins et redirections ouvertes refusés', () => {
  assert.equal(cheminSuivantSur('/jeux/session/ABC234/../admin'), null);
  assert.equal(cheminSuivantSur('/jeux/sessions/12'), null);
  assert.equal(cheminSuivantSur('//exemple.com/jeux/session/ABC234'), null);
  assert.equal(cheminSuivantSur('https://exemple.com'), null);
  assert.equal(cheminSuivantSur(null), null);
});
