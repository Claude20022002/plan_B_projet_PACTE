/**
 * Grille hebdomadaire : le dimanche n'est affiché que s'il porte une séance de la semaine.
 * Lancé par `npm run test:unit` (lanceur de Node).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { joursMasques } from './semaine.js';

const seance = (date) => ({ start: new Date(date) });

test('semaine sans séance le dimanche : le dimanche est masqué', () => {
  assert.deepEqual(joursMasques([seance('2026-11-02T09:00:00'), seance('2026-11-07T11:00:00')]), [0]);
  assert.deepEqual(joursMasques([]), [0]);
  assert.deepEqual(joursMasques(), [0]);
});

test('une séance le dimanche : aucun jour masqué, la séance est visible', () => {
  assert.deepEqual(joursMasques([seance('2026-11-02T09:00:00'), seance('2026-11-08T00:05:00')]), []);
});

test('une séance sans date de début ne compte pas', () => {
  assert.deepEqual(joursMasques([{ start: null }]), [0]);
});
