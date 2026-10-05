jest.mock('expo-secure-store', () => ({ WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'u', getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn() }));
jest.mock('../src/api/client', () => ({ planner: jest.fn(), biblio: jest.fn() }));

import { planner } from '../src/api/client';
import { chargerAccueilJeux, chargerHistoriqueQuiz, chargerPartiesQuiz, chargerResultatsQuiz, enregistrerReussite } from '../src/api/donnees';
import { PartieTerminal, defisLinux } from '../../shared/terminal/jeu.js';

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


/** Jeux intégrés : appels à Planner (le serveur calcule les points) et moteur partagé. */
test('réussite d’un défi : POST sur le bon défi, avec les indices et les commandes à rejouer', async () => {
  planner.mockResolvedValueOnce({ cree: true, points: 80 });
  const r = await enregistrerReussite('terminal-linux', 'navigation-01', 1, ['cd projects']);
  expect(planner).toHaveBeenLastCalledWith('/jeux/terminal-linux/defis/navigation-01/reussite', { method: 'POST', body: { indices: 1, commandes: ['cd projects'] } });
  expect(r.points).toBe(80);
});

test('accueil des jeux : catalogue et modules depuis Planner', async () => {
  planner.mockResolvedValueOnce({ jeux: [], modules: [] });
  await chargerAccueilJeux();
  expect(planner).toHaveBeenLastCalledWith('/jeux');
});

test('le moteur du terminal partagé tourne dans l’application (défi résolu par sa solution)', () => {
  const defi = defisLinux('fr').find((d) => d.id === 'pipes-03');
  const partie = new PartieTerminal(defi.id, { joueur: 'Mintsa' });
  for (const ligne of defi.solution.split('\n')) partie.executer(ligne);
  expect(partie.verifier().ok).toBe(true);
  expect(partie.invite).toBe('mintsa@hestim-lab:~ $');
});

test('quiz terminés : mes scores et les résultats d’une partie depuis Planner', async () => {
  planner.mockResolvedValueOnce({ data: [{ id: 7, titre: 'Spark', score: 2400, rang: 2, nb_joueurs: 6 }] });
  expect(await chargerHistoriqueQuiz()).toEqual([{ id: 7, titre: 'Spark', score: 2400, rang: 2, nb_joueurs: 6 }]);
  expect(planner).toHaveBeenLastCalledWith('/quiz/parties/historique');
  planner.mockResolvedValueOnce({ partie: { id: 7 }, classement: [], moi: null, equipes: [], nuages: [] });
  await chargerResultatsQuiz(7);
  expect(planner).toHaveBeenLastCalledWith('/quiz/parties/7/resultats');
});
