jest.mock('expo-secure-store', () => ({ WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'u', getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn() }));
jest.mock('../src/api/client', () => ({ planner: jest.fn(async () => ({})), biblio: jest.fn(), entetesAuthentifies: () => ({ Authorization: 'Bearer jeton' }) }));

import { planner } from '../src/api/client';
import { lireDirect, rejoindreDirect, rejoindreQuizStudio, repondreDirect, sourceMediaDirect } from '../src/api/donnees';

/** Appels du joueur natif du quiz en direct (lot SC-1c) : les routes du serveur (SC-1a). */

beforeEach(() => planner.mockClear());

test('rejoindre par le code, puis la partie en direct', async () => {
  await rejoindreQuizStudio('KM7Q2X');
  expect(planner).toHaveBeenLastCalledWith('/passations/rejoindre', { method: 'POST', body: { code: 'KM7Q2X' } });
  await rejoindreDirect(12);
  expect(planner).toHaveBeenLastCalledWith('/quiz-direct/12/rejoindre', { method: 'POST' });
});

test('relire l’état : la version déjà reçue part dans « depuis »', async () => {
  await lireDirect(12);
  expect(planner).toHaveBeenLastCalledWith('/quiz-direct/12/joueur');
  await lireDirect(12, 7);
  expect(planner).toHaveBeenLastCalledWith('/quiz-direct/12/joueur?depuis=7');
});

test('répondre à la question projetée, et lire son image avec le jeton', async () => {
  await repondreDirect(12, 3, ['b', 'a']);
  expect(planner).toHaveBeenLastCalledWith('/quiz-direct/12/reponses', { method: 'POST', body: { index: 3, reponse: ['b', 'a'] } });
  const source = sourceMediaDirect(12, 5);
  expect(source.uri).toMatch(/\/api\/quiz-direct\/12\/medias\/5$/);
  expect(source.headers).toEqual({ Authorization: 'Bearer jeton' });
});
