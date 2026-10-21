jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import { doitProposer, propositionFaite, retenirProposition } from '../src/alertes/proposition';

/** Alertes proposées au premier lancement (src/alertes/proposition.js, R-11). */

test('proposées seulement si le système peut encore demander, et une seule fois', () => {
  expect(doitProposer('a_demander', false)).toBe(true);
  expect(doitProposer('a_demander', true)).toBe(false);
  // Déjà autorisées : rien à proposer ; refusées pour de bon : seuls les réglages du téléphone y peuvent
  expect(doitProposer('accordee', false)).toBe(false);
  expect(doitProposer('refusee', false)).toBe(false);
  // Pas de push (Expo Go sur Android, émulateur) : rien à proposer
  expect(doitProposer(null, false)).toBe(false);
});

test('la proposition faite est retenue sur le téléphone', async () => {
  expect(await propositionFaite()).toBe(false);
  await retenirProposition();
  expect(await propositionFaite()).toBe(true);
});
