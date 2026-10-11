/**
 * Date du jour à l'école (shared/dates.js, lot B-2). Lancé par `npm run test:unit`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aujourdhui, dansJours } from '../../../shared/dates.js';

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
