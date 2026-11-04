jest.mock('expo-secure-store', () => ({ WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'u', getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn() }));
jest.mock('../src/api/donnees', () => ({ chargerConfigQuiz: jest.fn() }));

import { chargerConfigQuiz } from '../src/api/donnees';
import { sourceClassQuiz } from '../src/quiz/classQuiz';
import { origineDe, pinScanne } from '../src/quiz/scan';
import { ressembleAPartie } from '../../shared/classQuiz.js';

/** État de ClassQuiz dans l'application (src/quiz/classQuiz.js, lot ME-0c, règles C-1, C-2 et C-6). */
beforeEach(() => {
  sourceClassQuiz.oublier();
  chargerConfigQuiz.mockReset();
});

test('allumé : adresse du service, une seule lecture par lancement', async () => {
  chargerConfigQuiz.mockResolvedValue({ actif: true, url: 'https://quiz.exemple.ma', peutLancer: false });
  expect(await sourceClassQuiz.lire()).toEqual({ actif: true, url: 'https://quiz.exemple.ma', peutLancer: false });
  await sourceClassQuiz.lire();
  expect(chargerConfigQuiz).toHaveBeenCalledTimes(1);
});

test('éteint pour l’école : aucune origine, le QR d’une partie n’est plus reconnu', async () => {
  chargerConfigQuiz.mockResolvedValue({ actif: false, url: null, peutLancer: false });
  const etat = await sourceClassQuiz.lire();
  expect(etat.actif).toBe(false);
  const origine = etat.actif ? origineDe(etat.url) : null;
  const qr = 'https://quiz.exemple.ma/play?pin=123456';
  expect(pinScanne(qr, origine)).toBeNull();
  // Le scanner le reconnaît quand même comme une partie, pour dire que ce n'est pas ouvert
  expect(ressembleAPartie(qr)).toBe(true);
});

test('erreur réseau : éteint, puis la lecture suivante réessaie', async () => {
  chargerConfigQuiz.mockRejectedValueOnce(new Error('Réseau indisponible')).mockResolvedValueOnce({ actif: true, url: 'https://quiz.exemple.ma' });
  expect((await sourceClassQuiz.lire()).actif).toBe(false);
  expect((await sourceClassQuiz.lire()).actif).toBe(true);
});
