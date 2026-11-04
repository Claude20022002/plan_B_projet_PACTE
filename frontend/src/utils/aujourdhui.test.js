/**
 * Date du jour à l'école (shared/dates.js, lot B-2). Lancé par `npm run test:unit`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aujourdhui, dansJours, instantEcole } from '../../../shared/dates.js';
import { minutesAvantFin } from '../components/mesClasses/classe.js';

test("date de l'école en UTC+0, y compris entre 23 h et minuit", () => {
  assert.equal(aujourdhui(new Date('2026-10-11T23:30:00Z')), '2026-10-11');
  assert.equal(aujourdhui(new Date('2026-10-12T00:00:00Z')), '2026-10-12');
});

test('dans n jours, et il y a n jours', () => {
  const maintenant = new Date('2026-12-31T12:00:00Z');
  assert.equal(dansJours(1, maintenant), '2027-01-01');
  assert.equal(dansJours(-31, maintenant), '2026-11-30');
  assert.equal(dansJours(0, maintenant), '2026-12-31');
});

test("une heure de l'école est lue en UTC+0, quel que soit le fuseau du navigateur", () => {
  assert.equal(instantEcole('2026-10-29', '23:55').toISOString(), '2026-10-29T23:55:00.000Z');
  assert.equal(instantEcole('2026-10-29T00:00:00', '08:30:00').toISOString(), '2026-10-29T08:30:00.000Z');
});

test("rappel de l'appel : la séance de 23:55 n'est pas finie à 23:26 (bug d'un navigateur en UTC+1)", () => {
  const seance = { date: '2026-10-29', heure_fin: '23:55' };
  assert.equal(minutesAvantFin(seance, new Date('2026-10-29T23:26:00Z')), 29);
  assert.equal(minutesAvantFin(seance, new Date('2026-10-29T23:56:00Z')), -1);
});
