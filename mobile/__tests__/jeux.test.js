jest.mock('expo-secure-store', () => ({ WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'u', getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn() }));
jest.mock('../src/api/client', () => ({ planner: jest.fn(), biblio: jest.fn() }));

import { planner } from '../src/api/client';
import { chargerPartiesQuiz } from '../src/api/donnees';

/** Parties ClassQuiz proposées à l'étudiant : seuls les liens https sont gardés. */
test('parties en cours : lien https gardé, lien non sécurisé écarté', async () => {
  planner.mockResolvedValueOnce({
    data: [
      { id: 1, titre: 'Révision PySpark', pin: '482913', url: 'https://quiz.finadmintech.fr/play?pin=482913&name=Mintsa+O.' },
      { id: 2, titre: 'Piège', pin: '111111', url: 'http://pirate.test/play' },
      { id: 3, titre: 'Sans lien', pin: '222222', url: null },
    ],
  });
  const parties = await chargerPartiesQuiz();
  expect(planner).toHaveBeenCalledWith('/quiz/parties/en-cours');
  expect(parties.map((p) => p.id)).toEqual([1, 3]);
});
