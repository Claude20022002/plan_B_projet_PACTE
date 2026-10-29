/**
 * État d'ouverture d'un support de cours (lot EC-1). Lancé par `npm run test:unit`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { etatOuverture } from './ouverture.js';

const JOUR = '2026-11-10';

test('sans date, ou avec des dates vides : libre', () => {
  assert.deepEqual(etatOuverture({}, JOUR), { etat: 'libre', date: null });
  assert.deepEqual(etatOuverture({ visible_du: null, visible_jusqu_au: null }, JOUR), { etat: 'libre', date: null });
  assert.deepEqual(etatOuverture(undefined, JOUR), { etat: 'libre', date: null });
});

test("ouverture à venir : programmé ; le jour même : plus programmé", () => {
  assert.deepEqual(etatOuverture({ visible_du: '2026-11-11' }, JOUR), { etat: 'programme', date: '2026-11-11' });
  assert.deepEqual(etatOuverture({ visible_du: JOUR }, JOUR), { etat: 'libre', date: null });
});

test("fermeture : encore ouvert le dernier jour, fermé le lendemain", () => {
  assert.deepEqual(etatOuverture({ visible_jusqu_au: JOUR }, JOUR), { etat: 'ouvert', date: JOUR });
  assert.deepEqual(etatOuverture({ visible_jusqu_au: '2026-11-09' }, JOUR), { etat: 'ferme', date: '2026-11-09' });
});

test("une ouverture à venir l'emporte sur une fermeture plus lointaine", () => {
  assert.deepEqual(etatOuverture({ visible_du: '2026-11-20', visible_jusqu_au: '2026-12-20' }, JOUR), { etat: 'programme', date: '2026-11-20' });
});
